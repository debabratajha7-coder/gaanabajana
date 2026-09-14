import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getCashfreeOrder, isCashfreeConfigured } from "@/lib/cashfree";
import { markOrderPaid } from "@/lib/orders";
import { Order } from "@/models/Order";

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("order_id");
  if (!orderId) return NextResponse.json({ error: "order_id required" }, { status: 400 });
  await connectDB();
  let order = await Order.findOne({ orderNumber: orderId }).lean();
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (
    order.paymentStatus !== "paid" &&
    isCashfreeConfigured() &&
    order.cashfreeOrderId
  ) {
    try {
      const cf = await getCashfreeOrder(order.cashfreeOrderId);
      if (cf.order_status === "PAID") {
        await markOrderPaid(orderId);
        order = await Order.findOne({ orderNumber: orderId }).lean();
      }
    } catch (e) {
      console.error(e);
    }
  }

  return NextResponse.json({ order });
}
