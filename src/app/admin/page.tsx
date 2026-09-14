"use client";

import { useEffect, useState } from "react";
import { formatINR } from "@/lib/utils";
import Link from "next/link";
import { Package, LayoutGrid, ShoppingBag, Palette } from "lucide-react";

export default function AdminDashboardPage() {
  const [data, setData] = useState<{
    ordersToday: number;
    revenue: number;
    users: number;
    customers: number;
    lowStock: { title: string; stock: number; slug: string }[];
    recentOrders: { orderNumber: string; total: number; status: string }[];
  } | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <p>Loading…</p>;

  return (
    <div>
      <h1 className="display text-3xl sm:text-4xl">Hello</h1>
      <p className="mt-2 text-[var(--fg-muted)]">
        Pick what you want to do. Keep it simple.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Link
          href="/admin/products"
          className="flex gap-4 border border-[var(--line)] bg-[var(--bg-elevated)] p-5 transition hover:border-[var(--accent)]"
        >
          <Package className="h-6 w-6 shrink-0 text-[var(--accent)]" />
          <span>
            <span className="block font-semibold">Add a product</span>
            <span className="mt-1 block text-sm text-[var(--fg-muted)]">
              Category → brand → name → price → photos
            </span>
          </span>
        </Link>
        <Link
          href="/admin/shop-by-category"
          className="flex gap-4 border border-[var(--line)] bg-[var(--bg-elevated)] p-5 transition hover:border-[var(--accent)]"
        >
          <LayoutGrid className="h-6 w-6 shrink-0 text-[var(--accent)]" />
          <span>
            <span className="block font-semibold">Shop by category</span>
            <span className="mt-1 block text-sm text-[var(--fg-muted)]">
              Change Guitars / Keys tile names & photos
            </span>
          </span>
        </Link>
        <Link
          href="/admin/orders"
          className="flex gap-4 border border-[var(--line)] bg-[var(--bg-elevated)] p-5 transition hover:border-[var(--accent)]"
        >
          <ShoppingBag className="h-6 w-6 shrink-0 text-[var(--accent)]" />
          <span>
            <span className="block font-semibold">Orders</span>
            <span className="mt-1 block text-sm text-[var(--fg-muted)]">
              See what customers bought
            </span>
          </span>
        </Link>
        <Link
          href="/admin/website"
          className="flex gap-4 border border-[var(--line)] bg-[var(--bg-elevated)] p-5 transition hover:border-[var(--accent)]"
        >
          <Palette className="h-6 w-6 shrink-0 text-[var(--accent)]" />
          <span>
            <span className="block font-semibold">Site</span>
            <span className="mt-1 block text-sm text-[var(--fg-muted)]">
              Update texts, banner, and category tiles
            </span>
          </span>
        </Link>
      </div>

      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
          <p className="text-sm text-[var(--fg-muted)]">Users</p>
          <p className="mt-2 display text-3xl text-[var(--accent)]">{data.users ?? 0}</p>
          <p className="mt-1 text-xs text-[var(--fg-muted)]">Logged-in accounts</p>
        </div>
        <div className="border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
          <p className="text-sm text-[var(--fg-muted)]">Customers</p>
          <p className="mt-2 display text-3xl text-[var(--accent)]">{data.customers}</p>
          <p className="mt-1 text-xs text-[var(--fg-muted)]">Paid at least once</p>
        </div>
      </div>
    </div>
  );
}
