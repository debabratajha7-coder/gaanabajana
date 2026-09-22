"use client";

import { useEffect, useState } from "react";
import { formatINR } from "@/lib/utils";
import Link from "next/link";
import {
  Package,
  LayoutGrid,
  ShoppingBag,
  Palette,
  Tag,
  CreditCard,
  Truck,
} from "lucide-react";

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
      <h1 className="display text-3xl sm:text-4xl">Store home</h1>
      <p className="mt-2 max-w-2xl text-[var(--fg-muted)]">
        Everything you need to run Gaana Bajana. Follow the steps below — you
        don’t need to be technical.
      </p>

      <section className="mt-8 border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--accent)]">
          How to stock the shop (in order)
        </h2>
        <ol className="mt-4 space-y-3 text-sm leading-relaxed">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--bg-soft)] text-xs font-bold">
              1
            </span>
            <span>
              <Link href="/admin/shop-by-category" className="font-semibold underline">
                Categories
              </Link>
              {" — "}
              Add main tiles (Guitars, Accessories…) and subtypes under them
              (Strings, Capos, Cases…).
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--bg-soft)] text-xs font-bold">
              2
            </span>
            <span>
              <Link href="/admin/brands" className="font-semibold underline">
                Brands
              </Link>
              {" — "}
              Add brand names and logos (Yamaha, Fender…).
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--bg-soft)] text-xs font-bold">
              3
            </span>
            <span>
              <Link href="/admin/products" className="font-semibold underline">
                Products
              </Link>
              {" — "}
              Pick category → subtype → brand → name → price → photos. That’s it.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--bg-soft)] text-xs font-bold">
              4
            </span>
            <span>
              <Link href="/admin/website" className="font-semibold underline">
                Website
              </Link>
              {" — "}
              Banner, “Why us”, stats, and homepage section titles.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--bg-soft)] text-xs font-bold">
              5
            </span>
            <span>
              <Link href="/admin/orders" className="font-semibold underline">
                Orders
              </Link>
              {" — "}
              After PhonePe + Shiprocket are connected, paid orders show here
              with shipping IDs.
            </span>
          </li>
        </ol>
      </section>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link
          href="/admin/products"
          className="flex gap-4 border border-[var(--line)] bg-[var(--bg-elevated)] p-5 transition hover:border-[var(--accent)]"
        >
          <Package className="h-6 w-6 shrink-0 text-[var(--accent)]" />
          <span>
            <span className="block font-semibold">Add / edit products</span>
            <span className="mt-1 block text-sm text-[var(--fg-muted)]">
              Category → subtype → brand → price → photos
            </span>
          </span>
        </Link>
        <Link
          href="/admin/shop-by-category"
          className="flex gap-4 border border-[var(--line)] bg-[var(--bg-elevated)] p-5 transition hover:border-[var(--accent)]"
        >
          <LayoutGrid className="h-6 w-6 shrink-0 text-[var(--accent)]" />
          <span>
            <span className="block font-semibold">Categories & subtypes</span>
            <span className="mt-1 block text-sm text-[var(--fg-muted)]">
              Homepage tiles + Strings / Accessories under each
            </span>
          </span>
        </Link>
        <Link
          href="/admin/brands"
          className="flex gap-4 border border-[var(--line)] bg-[var(--bg-elevated)] p-5 transition hover:border-[var(--accent)]"
        >
          <Tag className="h-6 w-6 shrink-0 text-[var(--accent)]" />
          <span>
            <span className="block font-semibold">Brands</span>
            <span className="mt-1 block text-sm text-[var(--fg-muted)]">
              Names and logos for the Top Brands grid
            </span>
          </span>
        </Link>
        <Link
          href="/admin/website"
          className="flex gap-4 border border-[var(--line)] bg-[var(--bg-elevated)] p-5 transition hover:border-[var(--accent)]"
        >
          <Palette className="h-6 w-6 shrink-0 text-[var(--accent)]" />
          <span>
            <span className="block font-semibold">Website texts</span>
            <span className="mt-1 block text-sm text-[var(--fg-muted)]">
              Hero, Why us, stats, shipping thresholds
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
              What customers bought and shipping status
            </span>
          </span>
        </Link>
      </div>

      <section className="mt-8 grid gap-3 sm:grid-cols-2">
        <div className="border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="font-semibold">PhonePe payments</h2>
          </div>
          <p className="mt-2 text-sm text-[var(--fg-muted)]">
            Checkout already uses PhonePe. After your domain is live, add
            PhonePe keys in Vercel env and set the webhook to{" "}
            <code className="text-xs">/api/webhooks/phonepe</code>. Until then,
            checkout will say payments are not configured.
          </p>
        </div>
        <div className="border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="font-semibold">Shiprocket shipping</h2>
          </div>
          <p className="mt-2 text-sm text-[var(--fg-muted)]">
            After an order is paid, the app creates a Shiprocket shipment when
            email/password env vars are set. Pickup location name must match
            Shiprocket (also editable under Website → Shipping). For live
            tracking emails, set webhook URL to{" "}
            <code className="text-xs">/api/webhooks/fulfillment</code> with{" "}
            <code className="text-xs">SHIPROCKET_WEBHOOK_TOKEN</code>.
          </p>
        </div>
      </section>

      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
          <p className="text-sm text-[var(--fg-muted)]">Orders today</p>
          <p className="mt-2 display text-3xl text-[var(--accent)]">
            {data.ordersToday}
          </p>
        </div>
        <div className="border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
          <p className="text-sm text-[var(--fg-muted)]">Paid revenue</p>
          <p className="mt-2 display text-3xl text-[var(--accent)]">
            {formatINR(data.revenue)}
          </p>
        </div>
        <div className="border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
          <p className="text-sm text-[var(--fg-muted)]">Users</p>
          <p className="mt-2 display text-3xl text-[var(--accent)]">
            {data.users ?? 0}
          </p>
          <p className="mt-1 text-xs text-[var(--fg-muted)]">Logged-in accounts</p>
        </div>
        <div className="border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
          <p className="text-sm text-[var(--fg-muted)]">Customers</p>
          <p className="mt-2 display text-3xl text-[var(--accent)]">
            {data.customers}
          </p>
          <p className="mt-1 text-xs text-[var(--fg-muted)]">Paid at least once</p>
        </div>
      </div>
    </div>
  );
}
