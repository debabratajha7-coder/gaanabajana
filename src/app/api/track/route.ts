import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderNumber = searchParams.get("order");
  const phone = searchParams.get("phone");
  if (!orderNumber || !phone) {
    return NextResponse.json({ error: "order and phone required" }, { status: 400 });
  }
  await connectDB();
  const order = await Order.findOne({ orderNumber }).lean();
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const digits = phone.replace(/\D/g, "").slice(-10);
  const orderPhone = order.shippingAddress.phone.replace(/\D/g, "").slice(-10);
  if (digits !== orderPhone) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      awb: order.awb,
      trackingUrl: order.trackingUrl,
      shiprocketShipmentId: order.shiprocketShipmentId,
      timeline: order.timeline,
      total: order.total,
    },
  });
}
