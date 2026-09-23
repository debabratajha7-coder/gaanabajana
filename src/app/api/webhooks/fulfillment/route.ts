import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { markCodCollected } from "@/lib/orders";
import { sendShippingUpdateEmail } from "@/lib/email";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  defaultTrackingUrl,
  extractWebhookToken,
  mapCourierStatusToOrderStatus,
  pickAwb,
  pickLatestActivity,
  pickTrackingLabel,
  verifyShiprocketWebhookToken,
  type ShiprocketWebhookPayload,
} from "@/lib/shipping-webhook";

/**
 * Shiprocket tracking webhooks.
 * Dashboard URL must NOT contain words like "shiprocket" / "sr" / "kr".
 * Use: https://YOUR_DOMAIN/api/webhooks/fulfillment
 * Auth: paste the same token in Shiprocket → Token (sent as x-api-key or Authorization).
 */
export async function POST(req: NextRequest) {
  const limited = rateLimit(`fulfillment-webhook:${clientIp(req)}`, 120, 60_000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const expected = process.env.SHIPROCKET_WEBHOOK_TOKEN;
  const isProd = process.env.NODE_ENV === "production";

  if (isProd && !expected) {
    console.error("SHIPROCKET_WEBHOOK_TOKEN missing in production");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  if (expected) {
    const provided = extractWebhookToken(req);
    if (!verifyShiprocketWebhookToken(provided, expected)) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  }

  let payload: ShiprocketWebhookPayload;
  try {
    payload = (await req.json()) as ShiprocketWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const statusLabel = pickTrackingLabel(payload);
  const awb = pickAwb(payload);
  const { activity, location } = pickLatestActivity(payload);
  const courierName = payload.courier_name
    ? String(payload.courier_name)
    : undefined;
  const trackingUrl =
    (payload.tracking_url && String(payload.tracking_url)) ||
    defaultTrackingUrl(awb);

  const channelOrderId = payload.channel_order_id
    ? String(payload.channel_order_id)
    : undefined;
  const orderIdRaw = payload.order_id != null ? String(payload.order_id) : undefined;
  const srOrderId =
    payload.sr_order_id != null ? String(payload.sr_order_id) : undefined;
  const shipmentId =
    payload.shipment_id != null ? String(payload.shipment_id) : undefined;

  await connectDB();

  const or: Record<string, string>[] = [];
  if (channelOrderId) or.push({ orderNumber: channelOrderId });
  // We create Shiprocket orders with our GB order number as order_id
  if (orderIdRaw) {
    or.push({ orderNumber: orderIdRaw });
    or.push({ shiprocketOrderId: orderIdRaw });
  }
  if (srOrderId) or.push({ shiprocketOrderId: srOrderId });
  if (shipmentId) or.push({ shiprocketShipmentId: shipmentId });
  if (awb) or.push({ awb });

  if (!or.length) {
    console.warn("Fulfillment webhook: no order identifiers", payload);
    return NextResponse.json({ ok: true, matched: false });
  }

  const order = await Order.findOne({ $or: or });
  if (!order) {
    console.warn("Fulfillment webhook: order not found", {
      channelOrderId,
      orderIdRaw,
      srOrderId,
      shipmentId,
      awb,
    });
    // Still 200 so Shiprocket does not disable the webhook
    return NextResponse.json({ ok: true, matched: false });
  }

  const previousLabel = order.lastTrackingStatus || "";
  const statusChanged =
    statusLabel.toLowerCase() !== previousLabel.toLowerCase();

  if (awb) order.awb = awb;
  if (trackingUrl) order.trackingUrl = trackingUrl;
  if (courierName) order.courierName = courierName;
  if (srOrderId) order.shiprocketOrderId = srOrderId;
  else if (orderIdRaw && !order.shiprocketOrderId && !orderIdRaw.startsWith("GB")) {
    order.shiprocketOrderId = orderIdRaw;
  }
  if (shipmentId) order.shiprocketShipmentId = shipmentId;

  const mapped = mapCourierStatusToOrderStatus(statusLabel);
  if (mapped && order.status !== "cancelled") {
    // Don't regress delivered → shipped
    const rank: Record<string, number> = {
      pending_payment: 0,
      confirmed: 1,
      processing: 2,
      shipped: 3,
      delivered: 4,
      cancelled: 5,
    };
    if ((rank[mapped] ?? 0) >= (rank[order.status] ?? 0)) {
      order.status = mapped;
    }
  }

  if (statusChanged) {
    order.lastTrackingStatus = statusLabel;
    const noteParts = [statusLabel];
    if (activity) noteParts.push(activity);
    if (location) noteParts.push(`@ ${location}`);
    order.timeline.push({
      status: `shipping:${statusLabel}`,
      at: new Date(),
      note: noteParts.join(" · "),
    });
  }

  await order.save();

  // COD cash is considered collected once courier marks delivered
  if (mapped === "delivered" && order.paymentMethod === "cod") {
    try {
      await markCodCollected(order.orderNumber);
    } catch (err) {
      console.error("COD collect mark failed", err);
    }
  }

  if (statusChanged && order.shippingAddress?.email) {
    try {
      await sendShippingUpdateEmail({
        to: order.shippingAddress.email,
        orderNumber: order.orderNumber,
        statusLabel,
        awb: order.awb,
        trackingUrl: order.trackingUrl,
        courierName: order.courierName,
        activity,
        location,
      });
    } catch (err) {
      console.error("Shipping update email failed", err);
    }
  }

  return NextResponse.json({
    ok: true,
    matched: true,
    orderNumber: order.orderNumber,
    statusChanged,
  });
}
