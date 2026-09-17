import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import {
  getPhonePeOrderStatus,
  isPhonePeConfigured,
  isPhonePePaidState,
} from "@/lib/phonepe";
import { markOrderPaid } from "@/lib/orders";
import { Order } from "@/models/Order";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params;
  if (!orderNumber) {
    return NextResponse.json({ error: "order_id required" }, { status: 400 });
  }

  await connectDB();
  let order = await Order.findOne({ orderNumber }).lean();
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (
    order.paymentStatus !== "paid" &&
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

  return NextResponse.json({ order });
}
