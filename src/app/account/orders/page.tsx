"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { formatINR } from "@/lib/utils";

type Order = {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  awb?: string;
};

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function statusLabel(status: string) {
  const s = status.toLowerCase();
  if (s === "cancelled") return "Cancelled";
  if (s === "delivered") return "Delivered";
  if (s === "pending_payment") return "Awaiting payment";
  if (s === "shipped" || s === "processing" || s === "confirmed") return "Live";
  return status.replace(/_/g, " ");
}

function statusBadgeClass(status: string) {
  const s = status.toLowerCase();
  if (s === "cancelled") return "bg-red-500/15 text-red-400";
  if (s === "delivered") return "bg-emerald-500/15 text-emerald-400";
  if (s === "pending_payment") return "bg-white/10 text-[var(--fg-muted)]";
  if (s === "shipped" || s === "processing" || s === "confirmed")
    return "bg-[var(--accent)]/15 text-[var(--accent)]";
  return "bg-white/10 text-[var(--fg-muted)]";
}

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/account/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .finally(() => setLoaded(true));
  }, []);

  return (
    <div className="mesh-bg">
      <div className="container-gb max-w-2xl py-8 sm:py-12">
        <h1 className="display text-3xl sm:text-4xl">My orders</h1>
        <p className="mt-2 text-sm text-[var(--fg-muted)]">
          Live orders, deliveries, and cancellations in one place.
        </p>

        <div className="mt-8 space-y-3">
          {!loaded && (
            <>
              <div className="skeleton h-24 w-full rounded-[var(--radius-glass)]" />
              <div className="skeleton h-24 w-full rounded-[var(--radius-glass)]" />
            </>
          )}
          {loaded && orders.length === 0 && (
            <div className="glass-panel p-6 text-center">
              <p className="text-[var(--fg-muted)]">No orders yet.</p>
              <Link href="/" className="btn btn-primary mt-4 inline-flex">
                Browse instruments
              </Link>
            </div>
          )}
          {orders.map((o) => {
            const cancelled = o.status === "cancelled";
            return (
              <Link
                key={o.orderNumber}
                href={`/account/orders/${o.orderNumber}`}
                className={`glass-panel flex items-center gap-3 p-4 transition hover:border-[var(--accent)] sm:p-5 ${
                  cancelled ? "opacity-70" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-mono text-sm font-semibold tracking-tight text-[var(--fg)]">
                      {o.orderNumber}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusBadgeClass(o.status)}`}
                    >
                      {statusLabel(o.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs capitalize text-[var(--fg-muted)]">
                    {o.paymentStatus}
                    {o.createdAt ? ` · ${formatWhen(o.createdAt)}` : ""}
                    {!cancelled && o.awb ? ` · AWB ${o.awb}` : ""}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-[var(--price)]">
                  {formatINR(o.total)}
                </p>
                <ChevronRight className="h-4 w-4 shrink-0 text-[var(--fg-muted)]" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
