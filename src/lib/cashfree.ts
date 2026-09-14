import crypto from "crypto";

const BASE =
  process.env.CASHFREE_ENV === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

function headers() {
  const appId = process.env.CASHFREE_APP_ID;
  const secret = process.env.CASHFREE_SECRET_KEY;
  if (!appId || !secret) throw new Error("Cashfree credentials missing");
  return {
    "Content-Type": "application/json",
    "x-api-version": "2023-08-01",
    "x-client-id": appId,
    "x-client-secret": secret,
  };
}

export function isCashfreeConfigured() {
  return Boolean(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY);
}

export async function createCashfreeOrder(input: {
  orderId: string;
  amount: number;
  customer: { id: string; email: string; phone: string; name: string };
  returnUrl: string;
}) {
  const res = await fetch(`${BASE}/orders`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      order_id: input.orderId,
      order_amount: input.amount,
      order_currency: "INR",
      customer_details: {
        customer_id: input.customer.id,
        customer_email: input.customer.email,
        customer_phone: input.customer.phone,
        customer_name: input.customer.name,
      },
      order_meta: {
        return_url: input.returnUrl,
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || JSON.stringify(data) || "Cashfree order failed");
  }
  return data as {
    order_id: string;
    payment_session_id: string;
    order_status: string;
  };
}

export async function getCashfreeOrder(orderId: string) {
  const res = await fetch(`${BASE}/orders/${orderId}`, {
    headers: headers(),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch Cashfree order");
  return data as { order_id: string; order_status: string; order_amount: number };
}

export function verifyCashfreeWebhookSignature(
  rawBody: string,
  signature: string | null,
  timestamp: string | null
) {
  const secret = process.env.CASHFREE_WEBHOOK_SECRET || process.env.CASHFREE_SECRET_KEY;
  if (!secret || !signature || !timestamp) return false;
  const signedPayload = `${timestamp}${rawBody}`;
  const expected = crypto.createHmac("sha256", secret).update(signedPayload).digest("base64");
  return expected === signature;
}
