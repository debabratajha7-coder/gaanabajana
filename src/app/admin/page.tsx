"use client";

import { useEffect, useState } from "react";
import { formatINR } from "@/lib/utils";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [data, setData] = useState<{
    ordersToday: number;
    revenue: number;
    customers: number;
    lowStock: { title: string; stock: number; slug: string }[];
    recentOrders: { orderNumber: string; total: number; status: string }[];
  } | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <p>Loading dashboard…</p>;

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--line)] p-5">
          <p className="text-sm text-[var(--fg-muted)]">Orders today</p>
          <p className="mt-2 text-3xl text-[var(--accent)]">{data.ordersToday}</p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] p-5">
          <p className="text-sm text-[var(--fg-muted)]">Paid revenue</p>
          <p className="mt-2 text-3xl text-[var(--accent)]">{formatINR(data.revenue)}</p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] p-5">
          <p className="text-sm text-[var(--fg-muted)]">Customers</p>
          <p className="mt-2 text-3xl text-[var(--accent)]">{data.customers}</p>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl">Recent orders</h2>
          <ul className="mt-4 space-y-2">
            {data.recentOrders.map((o) => (
              <li key={o.orderNumber} className="flex justify-between text-sm">
                <Link href="/admin/orders" className="text-[var(--accent)]">
                  {o.orderNumber}
                </Link>
                <span>
                  {o.status} · {formatINR(o.total)}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl">Low stock</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {data.lowStock.map((p) => (
              <li key={p.slug} className="flex justify-between">
                <span>{p.title}</span>
                <span className="text-[var(--danger)]">{p.stock}</span>
              </li>
            ))}
            {data.lowStock.length === 0 && (
              <li className="text-[var(--fg-muted)]">All good</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
