import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import {
  isPhonePeFailedState,
  isPhonePePaidState,
  verifyPhonePeCallbackAuthorization,
} from "@/lib/phonepe";
import { markOrderPaid } from "@/lib/orders";
import { Order } from "@/models/Order";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const limited = rateLimit(`phonepe-webhook:${clientIp(req)}`, 60, 60_000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const rawBody = await req.text();
  const authorization =
    req.headers.get("authorization") || req.headers.get("Authorization");

  const username = process.env.PHONEPE_WEBHOOK_USERNAME;
  const password = process.env.PHONEPE_WEBHOOK_PASSWORD;
  const isProd =
    process.env.NODE_ENV === "production" ||
    process.env.PHONEPE_ENV === "production";

  // Production always requires webhook credentials
  if (isProd && (!username || !password)) {
    console.error("PhonePe webhook credentials missing in production");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 }
    );
  }

  if (username && password) {
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
