import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  getPhonePeOrderStatus,
  isPhonePeConfigured,
  isPhonePePaidState,
} from "@/lib/phonepe";
import { markOrderPaid } from "@/lib/orders";
import { Order } from "@/models/Order";
import { maskEmail, maskPhone, normalizeIndianPhone } from "@/lib/otp";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

function redactOrder(order: Record<string, unknown>) {
  const addr = (order.shippingAddress || {}) as Record<string, string>;
  return {
    orderNumber: order.orderNumber,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    status: order.status,
    fulfillmentStatus: order.fulfillmentStatus,
    total: order.total,
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    codFee: order.codFee,
    currency: order.currency,
    items: order.items,
    shiprocketOrderId: order.shiprocketOrderId,
    createdAt: order.createdAt,
    shippingAddress: {
      fullName: addr.fullName,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      country: addr.country,
      phone: addr.phone ? maskPhone(addr.phone) : undefined,
      email: addr.email ? maskEmail(addr.email) : undefined,
    },
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const limited = rateLimit(`order-get:${clientIp(req)}`, 30, 60_000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const { orderNumber } = await params;
  if (!orderNumber || !/^GB[A-Z0-9]+$/i.test(orderNumber)) {
    return NextResponse.json({ error: "order_id required" }, { status: 400 });
  }

  await connectDB();
  let order = await Order.findOne({ orderNumber }).lean();
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const session = await getSession();
  const isOwner =
    Boolean(session) &&
    Boolean(order.user) &&
    String(order.user) === session!.id;
  const isAdmin = session?.role === "admin";

  let phoneMatch = false;
  const phoneParam = req.nextUrl.searchParams.get("phone");
  if (phoneParam && order.shippingAddress?.phone) {
    try {
      phoneMatch =
        normalizeIndianPhone(phoneParam) ===
        normalizeIndianPhone(order.shippingAddress.phone);
    } catch {
      phoneMatch = false;
    }
  }

  const fullAccess = isOwner || isAdmin || phoneMatch;

  if (
    order.paymentStatus !== "paid" &&
    order.paymentMethod !== "cod" &&
    isPhonePeConfigured() &&
    (order.phonepeMerchantOrderId || order.orderNumber)
  ) {
    try {
      const status = await getPhonePeOrderStatus(
        order.phonepeMerchantOrderId || order.orderNumber
      );
      if (isPhonePePaidState(status.state)) {
        const txn =
          status.paymentDetails?.[0]?.transactionId || status.orderId;
        await markOrderPaid(orderNumber, txn);
        order = await Order.findOne({ orderNumber }).lean();
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (fullAccess) {
    return NextResponse.json({ order });
  }

  return NextResponse.json({ order: redactOrder(order as Record<string, unknown>) });
}
