"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatINR } from "@/lib/utils";
import Link from "next/link";

export default function AccountOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<{
    orderNumber: string;
    status: string;
    paymentStatus: string;
    total: number;
    items: { title: string; qty: number; price: number }[];
    awb?: string;
    trackingUrl?: string;
    shiprocketOrderId?: string;
    timeline: { status: string; at: string; note?: string }[];
  } | null>(null);

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/orders/${params.id}`)
      .then((r) => r.json())
      .then((d) => setOrder(d.order));
  }, [params.id]);

  if (!order) return <div className="container-gb py-12">Loading…</div>;

  return (
    <div className="mesh-bg">
    <div className="container-gb py-12">
      <div className="glass-panel p-5 sm:p-7">
      <Link href="/account/orders" className="text-sm text-[var(--accent)]">
        ← Orders
      </Link>
      <h1 className="mt-4 display text-3xl sm:text-4xl">
        {order.orderNumber}
      </h1>
      <p className="mt-2 text-[var(--fg-muted)]">
        {order.status} · {order.paymentStatus} · {formatINR(order.total)}
      </p>
      {(order.awb || order.trackingUrl) && (
        <p className="mt-2">
          Tracking: {order.awb || "pending"}{" "}
          {order.trackingUrl && (
            <a href={order.trackingUrl} className="text-[var(--accent)]" target="_blank">
              Open link
            </a>
          )}
        </p>
      )}
      </div>
      <ul className="glass-panel mt-8 space-y-2 p-5">
        {order.items.map((i, idx) => (
          <li key={idx} className="flex justify-between border-b border-[var(--line)] py-3 last:border-0">
            <span>
              {i.title} × {i.qty}
            </span>
            <span>{formatINR(i.price * i.qty)}</span>
          </li>
        ))}
      </ul>
      <div className="glass-panel mt-8 p-5">
        <h2 className="display text-2xl">Timeline</h2>
        <ul className="mt-3 space-y-2 text-sm text-[var(--fg-muted)]">
          {order.timeline?.map((t, i) => (
            <li key={i}>
              {t.status} — {new Date(t.at).toLocaleString()}
              {t.note ? ` · ${t.note}` : ""}
            </li>
          ))}
        </ul>
      </div>
    </div>
    </div>
  );
}
