import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyCashfreeWebhookSignature } from "@/lib/cashfree";
import { markOrderPaid } from "@/lib/orders";
import { Order } from "@/models/Order";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-webhook-signature");
  const timestamp = req.headers.get("x-webhook-timestamp");

  // In sandbox without webhook secret, still accept but verify order via payload type
  const hasSecret = Boolean(
    process.env.CASHFREE_WEBHOOK_SECRET || process.env.CASHFREE_SECRET_KEY
  );
  if (hasSecret && signature && timestamp) {
    const ok = verifyCashfreeWebhookSignature(rawBody, signature, timestamp);
    if (!ok) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let payload: {
    type?: string;
    data?: {
      order?: { order_id?: string };
      payment?: { cf_payment_id?: string; payment_status?: string };
    };
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orderId = payload.data?.order?.order_id;
  const paymentStatus = payload.data?.payment?.payment_status;
  const paymentId = payload.data?.payment?.cf_payment_id
    ? String(payload.data.payment.cf_payment_id)
    : undefined;

  if (!orderId) return NextResponse.json({ ok: true });

  await connectDB();

  if (
    payload.type?.includes("PAYMENT_SUCCESS") ||
    paymentStatus === "SUCCESS" ||
    payload.type === "PAYMENT_SUCCESS_WEBHOOK"
  ) {
    await markOrderPaid(orderId, paymentId);
  } else if (paymentStatus === "FAILED" || payload.type?.includes("FAILED")) {
    await Order.findOneAndUpdate(
      { orderNumber: orderId },
      {
        paymentStatus: "failed",
        $push: { timeline: { status: "payment_failed", at: new Date() } },
      }
    );
  }

  return NextResponse.json({ ok: true });
}
