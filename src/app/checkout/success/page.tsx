"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatINR } from "@/lib/utils";

function SuccessInner() {
  const params = useSearchParams();
  const orderId = params.get("order_id");
  const methodHint = params.get("method");
  const [order, setOrder] = useState<{
    orderNumber: string;
    paymentStatus: string;
    paymentMethod?: string;
    status: string;
    total: number;
    codFee?: number;
    shiprocketOrderId?: string;
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setOrder(d.order);
      })
      .catch(() => setError("Could not load order"));
  }, [orderId]);

  const isCod =
    order?.paymentMethod === "cod" || methodHint === "cod";
  const confirmed =
    isCod
      ? order?.status === "confirmed" ||
        order?.status === "processing" ||
        order?.status === "shipped" ||
        order?.status === "delivered"
      : order?.paymentStatus === "paid";

  const title = isCod
    ? confirmed
      ? "Order confirmed — pay on delivery"
      : "Confirming your COD order…"
    : order?.paymentStatus === "paid"
      ? "Payment received"
      : "Checking payment…";

  return (
    <div className="container-gb py-20 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl">
        {title}
      </h1>
      {order && (
        <div className="mx-auto mt-6 max-w-md rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-6 text-left">
          <p>
            Order: <strong>{order.orderNumber}</strong>
          </p>
          <p className="mt-2 capitalize">
            Status: {order.status.replace(/_/g, " ")}
          </p>
          <p className="mt-2 capitalize">
            Payment:{" "}
            {isCod
              ? order.paymentStatus === "paid"
                ? "COD collected"
                : "Cash on delivery (pending)"
              : order.paymentStatus}
          </p>
          <p className="mt-2 text-[var(--accent)]">{formatINR(order.total)}</p>
          {isCod ? (
            <p className="mt-3 text-sm text-[var(--fg-muted)]">
              Keep the exact amount ready for the courier
              {order.codFee ? ` (includes COD fee)` : ""}. We’ll email tracking
              updates as the shipment moves.
            </p>
          ) : null}
          {order.shiprocketOrderId && (
            <p className="mt-2 text-sm text-[var(--fg-muted)]">
              Shipping created · Shiprocket #{order.shiprocketOrderId}
            </p>
          )}
        </div>
      )}
      {error && <p className="mt-4 text-[var(--danger)]">{error}</p>}
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/account/orders" className="btn btn-primary">
          My orders
        </Link>
        <Link href="/" className="btn btn-ghost">
          Home
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <SuccessInner />
    </Suspense>
  );
}
