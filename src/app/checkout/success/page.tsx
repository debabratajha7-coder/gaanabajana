"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatINR } from "@/lib/utils";

function SuccessInner() {
  const params = useSearchParams();
  const orderId = params.get("order_id");
  const [order, setOrder] = useState<{
    orderNumber: string;
    paymentStatus: string;
    status: string;
    total: number;
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

  return (
    <div className="container-gb py-20 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl">
        {order?.paymentStatus === "paid" ? "Payment received" : "Checking payment…"}
      </h1>
      {order && (
        <div className="mx-auto mt-6 max-w-md rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-6 text-left">
          <p>Order: <strong>{order.orderNumber}</strong></p>
          <p className="mt-2">Status: {order.status}</p>
          <p className="mt-2">Payment: {order.paymentStatus}</p>
          <p className="mt-2 text-[var(--accent)]">{formatINR(order.total)}</p>
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
