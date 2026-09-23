import { connectDB } from "@/lib/db";
import {
  createShiprocketOrder,
  hasShiprocketOrderId,
  isShiprocketConfigured,
} from "@/lib/shiprocket";
import { sendOrderEmail } from "@/lib/email";
import { Order } from "@/models/Order";
import { getSiteSettings } from "@/models/SiteSettings";
import { format } from "date-fns";

export async function markOrderPaid(orderNumber: string, paymentId?: string) {
  await connectDB();
  const order = await Order.findOne({ orderNumber });
  if (!order) throw new Error("Order not found");
  if (order.paymentStatus === "paid") return order;

  order.paymentStatus = "paid";
  order.status = "confirmed";
  if (paymentId) order.phonepeTransactionId = paymentId;
  order.timeline.push({ status: "paid", at: new Date(), note: "Payment confirmed" });
  await order.save();

  await pushOrderToShiprocket(order.orderNumber);

  if (order.shippingAddress?.email) {
    await sendOrderEmail({
      to: order.shippingAddress.email,
      orderNumber: order.orderNumber,
      total: order.total,
      status: "confirmed",
    });
  }

  return Order.findOne({ orderNumber });
}

/** Confirm a COD order (no gateway) — ready to pack / push to Shiprocket. */
export async function confirmCodOrder(orderNumber: string) {
  await connectDB();
  const order = await Order.findOne({ orderNumber });
  if (!order) throw new Error("Order not found");
  if (order.paymentMethod !== "cod") {
    throw new Error("Not a COD order");
  }
  if (order.status === "cancelled") {
    throw new Error("Order cancelled");
  }

  const newlyConfirmed = order.status === "pending_payment";
  if (newlyConfirmed) {
    order.status = "confirmed";
    order.timeline.push({
      status: "confirmed",
      at: new Date(),
      note: "Cash on delivery — pay when the parcel arrives",
    });
    await order.save();
  }

  await pushOrderToShiprocket(order.orderNumber);

  if (newlyConfirmed && order.shippingAddress?.email) {
    await sendOrderEmail({
      to: order.shippingAddress.email,
      orderNumber: order.orderNumber,
      total: order.total,
      status: "confirmed (COD)",
    });
  }

  return Order.findOne({ orderNumber });
}

/** When courier marks delivered, treat COD cash as collected. */
export async function markCodCollected(orderNumber: string) {
  await connectDB();
  const order = await Order.findOne({ orderNumber });
  if (!order) return null;
  if (order.paymentMethod !== "cod") return order;
  if (order.paymentStatus === "paid") return order;

  order.paymentStatus = "paid";
  order.timeline.push({
    status: "cod_collected",
    at: new Date(),
    note: "Cash collected on delivery",
  });
  await order.save();
  return order;
}

export async function pushOrderToShiprocket(orderNumber: string) {
  await connectDB();
  const order = await Order.findOne({ orderNumber });
  if (!order) throw new Error("Order not found");

  // Clear bogus ids from earlier bugs so retry can run
  if (!hasShiprocketOrderId(order.shiprocketOrderId)) {
    order.shiprocketOrderId = undefined;
    order.shiprocketShipmentId = undefined;
  }

  if (hasShiprocketOrderId(order.shiprocketOrderId)) return order;

  if (!isShiprocketConfigured()) {
    order.timeline.push({
      status: "shiprocket_skipped",
      at: new Date(),
      note: "Shiprocket credentials not configured",
    });
    await order.save();
    return order;
  }

  const settings = await getSiteSettings();
  const [firstName, ...rest] = order.shippingAddress.fullName.split(" ");
  const weight = Math.max(
    0.5,
    order.items.reduce(
      (sum: number, i: { weightKg?: number; qty: number }) =>
        sum + (i.weightKg || 1) * i.qty,
      0
    )
  );
  const length = Math.max(...order.items.map(() => 40), 10);
  const breadth = 20;
  const height = Math.min(40, 10 + order.items.length * 5);
  const isCod = order.paymentMethod === "cod";
  // For COD, Shiprocket treats sub_total as the cash-to-collect amount.
  const shiprocketSubTotal = isCod ? order.total : order.subtotal;

  try {
    const result = await createShiprocketOrder({
      orderId: order.orderNumber,
      orderDate: format(new Date(), "yyyy-MM-dd HH:mm"),
      pickupLocation:
        process.env.SHIPROCKET_PICKUP_LOCATION ||
        settings.pickupLocationName ||
        "Primary",
      billing: {
        firstName: firstName || "Customer",
        lastName: rest.join(" ") || "",
        address: order.shippingAddress.line1,
        address2: order.shippingAddress.line2,
        city: order.shippingAddress.city,
        pincode: order.shippingAddress.pincode,
        state: order.shippingAddress.state,
        country: order.shippingAddress.country || "India",
        email: order.shippingAddress.email,
        phone: order.shippingAddress.phone,
      },
      items: order.items.map(
        (i: {
          title: string;
          sku?: string;
          slug: string;
          qty: number;
          price: number;
        }) => ({
          name: i.title,
          sku: i.sku || i.slug,
          units: i.qty,
          selling_price: i.price,
        })
      ),
      paymentMethod: isCod ? "COD" : "Prepaid",
      subTotal: shiprocketSubTotal,
      length,
      breadth,
      height,
      weight,
    });

    order.shiprocketOrderId = result.order_id;
    order.shiprocketShipmentId = result.shipment_id;
    if (result.awb_code) order.awb = result.awb_code;
    if (result.courier_name) order.courierName = result.courier_name;
    order.status = "processing";
    order.timeline.push({
      status: "shiprocket_created",
      at: new Date(),
      note: `Shiprocket order ${result.order_id} · shipment ${result.shipment_id}${
        isCod ? " · COD" : ""
      }`,
    });
    await order.save();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Shiprocket error";
    order.timeline.push({
      status: "shiprocket_error",
      at: new Date(),
      note: message,
    });
    await order.save();
    console.error("Shiprocket push failed", message);
  }

  return order;
}

export function generateOrderNumber() {
  const now = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GB${now}${rand}`;
}

const CANCELLABLE = new Set([
  "pending_payment",
  "confirmed",
  "processing",
]);

export function isOrderCancellable(status: string) {
  return CANCELLABLE.has(status);
}

/** Customer-initiated cancel before the parcel ships. */
export async function cancelCustomerOrder(
  orderNumber: string,
  reason?: string
) {
  await connectDB();
  const order = await Order.findOne({ orderNumber });
  if (!order) throw new Error("Order not found");
  if (order.status === "cancelled") return order;
  if (!isOrderCancellable(order.status)) {
    throw new Error(
      "This order can no longer be cancelled online. Contact us if you need help."
    );
  }

  const isPrepaid =
    order.paymentMethod !== "cod" && order.paymentStatus === "paid";
  const noteParts = [
    reason?.trim() || "Cancelled by customer",
    isPrepaid ? "Refund will be processed in 5–7 business days" : "",
    hasShiprocketOrderId(order.shiprocketOrderId)
      ? "Shipping partner will be updated"
      : "",
  ].filter(Boolean);

  order.status = "cancelled";
  order.timeline.push({
    status: "cancelled",
    at: new Date(),
    note: noteParts.join(" · "),
  });
  await order.save();

  if (order.shippingAddress?.email) {
    const { sendCancellationEmail } = await import("@/lib/email");
    await sendCancellationEmail({
      to: order.shippingAddress.email,
      orderNumber: order.orderNumber,
      total: order.total,
      prepaid: isPrepaid,
    }).catch((err) => console.error("Cancel email failed", err));
  }

  return order;
}
