"use client";

import { useEffect, useState } from "react";
import { formatINR } from "@/lib/utils";

type Order = {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  shiprocketOrderId?: string;
  awb?: string;
  shippingAddress: { fullName: string; phone: string };
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [msg, setMsg] = useState("");

  function load() {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []));
  }

  useEffect(load, []);

  async function update(orderNumber: string, patch: Record<string, unknown>) {
    const res = await fetch("/api/admin/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber, ...patch }),
    });
    const data = await res.json();
    if (!res.ok) setMsg(data.error || "Failed");
    else setMsg("Updated");
    load();
  }

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl">Orders</h1>
      {msg && <p className="mt-2 text-sm text-[var(--success)]">{msg}</p>}
      <div className="mt-6 space-y-3">
        {orders.map((o) => (
          <div
            key={o.orderNumber}
            className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{o.orderNumber}</p>
                <p className="text-sm text-[var(--fg-muted)]">
                  {o.shippingAddress?.fullName} · {o.shippingAddress?.phone}
                </p>
                <p className="mt-1 text-sm">
                  {o.status} · {o.paymentStatus} · {formatINR(o.total)}
                </p>
                <p className="mt-1 text-xs text-[var(--fg-muted)]">
                  Shiprocket: {o.shiprocketOrderId || "—"} · AWB: {o.awb || "—"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  className="input w-auto"
                  value={o.status}
                  onChange={(e) => update(o.orderNumber, { status: e.target.value })}
                >
                  {[
                    "pending_payment",
                    "confirmed",
                    "processing",
                    "shipped",
                    "delivered",
                    "cancelled",
                  ].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => update(o.orderNumber, { retryShiprocket: true })}
                >
                  Push Shiprocket
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
