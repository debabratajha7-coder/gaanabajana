import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import {
  isPhonePeFailedState,
  isPhonePePaidState,
  verifyPhonePeCallbackAuthorization,
} from "@/lib/phonepe";
import { markOrderPaid } from "@/lib/orders";
import { Order } from "@/models/Order";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const authorization =
    req.headers.get("authorization") || req.headers.get("Authorization");

  const hasWebhookAuth = Boolean(
    process.env.PHONEPE_WEBHOOK_USERNAME && process.env.PHONEPE_WEBHOOK_PASSWORD
  );
  if (hasWebhookAuth) {
    if (!verifyPhonePeCallbackAuthorization(authorization)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let payload: {
    type?: string;
    payload?: {
      merchantOrderId?: string;
      orderId?: string;
      state?: string;
      paymentDetails?: Array<{ transactionId?: string }>;
    };
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const merchantOrderId = payload.payload?.merchantOrderId;
  const state = payload.payload?.state;
  const phonepeOrderId = payload.payload?.orderId;
  const transactionId = payload.payload?.paymentDetails?.[0]?.transactionId;

  if (!merchantOrderId) return NextResponse.json({ ok: true });

  await connectDB();

  const type = payload.type || "";
  const completed =
    type.includes("ORDER_COMPLETED") || isPhonePePaidState(state);
  const failed = type.includes("ORDER_FAILED") || isPhonePeFailedState(state);

  if (completed) {
    await Order.findOneAndUpdate(
      { orderNumber: merchantOrderId },
      {
        ...(phonepeOrderId ? { phonepeOrderId } : {}),
      }
    );
    await markOrderPaid(merchantOrderId, transactionId || phonepeOrderId);
  } else if (failed && !type.includes("TRANSACTION_ATTEMPT")) {
    await Order.findOneAndUpdate(
      { orderNumber: merchantOrderId },
      {
        paymentStatus: "failed",
        ...(phonepeOrderId ? { phonepeOrderId } : {}),
        $push: { timeline: { status: "payment_failed", at: new Date() } },
      }
    );
  }

  return NextResponse.json({ ok: true });
}
