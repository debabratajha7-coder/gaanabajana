"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatINR } from "@/lib/utils";

type Order = {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  awb?: string;
};

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch("/api/account/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []));
  }, []);

  return (
    <div className="mesh-bg">
    <div className="container-gb py-12">
      <div className="glass-panel p-5 sm:p-7">
        <h1 className="display text-3xl sm:text-4xl">My orders</h1>
      </div>
      <div className="mt-8 space-y-3">
        {orders.length === 0 && (
          <p className="text-[var(--fg-muted)]">No orders yet.</p>
        )}
        {orders.map((o) => (
          <Link
            key={o.orderNumber}
            href={`/account/orders/${o.orderNumber}`}
            className="glass-panel flex flex-wrap items-center justify-between gap-3 p-5"
          >
            <div>
              <p className="font-medium">{o.orderNumber}</p>
              <p className="text-sm text-[var(--fg-muted)]">
                {o.status} · {o.paymentStatus}
                {o.awb ? ` · AWB ${o.awb}` : ""}
              </p>
            </div>
            <p className="text-[var(--accent)]">{formatINR(o.total)}</p>
          </Link>
        ))}
      </div>
    </div>
    </div>
  );
}
