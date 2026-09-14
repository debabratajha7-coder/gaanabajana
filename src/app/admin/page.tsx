"use client";

import { useEffect, useState } from "react";
import { formatINR } from "@/lib/utils";
import Link from "next/link";
import { Package, ShoppingBag, FileText } from "lucide-react";

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
      <h1 className="display text-3xl sm:text-4xl">Dashboard</h1>
      <p className="mt-2 text-sm text-[var(--fg-muted)]">
        Store overview and shortcuts.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/admin/products" className="btn btn-primary btn-sm">
          <Package className="h-3.5 w-3.5" /> Add product
        </Link>
        <Link href="/admin/orders" className="btn btn-ghost btn-sm">
          <ShoppingBag className="h-3.5 w-3.5" /> Orders
        </Link>
        <Link href="/admin/cms" className="btn btn-ghost btn-sm">
          <FileText className="h-3.5 w-3.5" /> CMS
        </Link>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
          <p className="text-sm text-[var(--fg-muted)]">Orders today</p>
          <p className="mt-2 display text-3xl text-[var(--accent)]">{data.ordersToday}</p>
        </div>
        <div className="border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
          <p className="text-sm text-[var(--fg-muted)]">Paid revenue</p>
          <p className="mt-2 display text-3xl text-[var(--accent)]">
            {formatINR(data.revenue)}
          </p>
        </div>
        <div className="border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
          <p className="text-sm text-[var(--fg-muted)]">Customers</p>
          <p className="mt-2 display text-3xl text-[var(--accent)]">{data.customers}</p>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="display text-2xl">Recent orders</h2>
          <ul className="mt-4 divide-y divide-[var(--line)] border border-[var(--line)]">
            {data.recentOrders.map((o) => (
              <li key={o.orderNumber} className="flex justify-between px-4 py-3 text-sm">
                <Link href="/admin/orders" className="text-[var(--accent)]">
                  {o.orderNumber}
                </Link>
                <span className="text-[var(--fg-muted)]">
                  {o.status} · {formatINR(o.total)}
                </span>
              </li>
            ))}
            {data.recentOrders.length === 0 && (
              <li className="px-4 py-3 text-sm text-[var(--fg-muted)]">No orders yet</li>
            )}
          </ul>
        </div>
        <div>
          <h2 className="display text-2xl">Low stock</h2>
          <ul className="mt-4 divide-y divide-[var(--line)] border border-[var(--line)]">
            {data.lowStock.map((p) => (
              <li key={p.slug} className="flex justify-between px-4 py-3 text-sm">
                <span>{p.title}</span>
                <span className="text-[var(--danger)]">{p.stock}</span>
              </li>
            ))}
            {data.lowStock.length === 0 && (
              <li className="px-4 py-3 text-sm text-[var(--fg-muted)]">All good</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
