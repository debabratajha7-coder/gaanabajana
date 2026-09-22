"use client";

import { useEffect, useState } from "react";
import { formatINR } from "@/lib/utils";

type TimelineItem = { status: string; at?: string; note?: string };

type Order = {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  shiprocketOrderId?: string;
  shiprocketShipmentId?: string;
  awb?: string;
  timeline?: TimelineItem[];
  shippingAddress: { fullName: string; phone: string };
};

function validId(id?: string) {
  return Boolean(id && id !== "undefined" && id !== "null");
}

function shiprocketLabel(o: Order) {
  if (validId(o.shiprocketOrderId)) {
    return `Pushed · #${o.shiprocketOrderId}`;
  }
  const last = [...(o.timeline || [])]
    .reverse()
    .find((t) => t.status.startsWith("shiprocket_"));
  if (last?.status === "shiprocket_error") {
    return `Failed · ${last.note || "error"}`;
  }
  if (last?.status === "shiprocket_skipped") {
    return `Not configured · ${last.note || "missing credentials"}`;
  }
  if (last?.status === "shiprocket_created" && !validId(o.shiprocketOrderId)) {
    return "Failed · invalid Shiprocket response";
  }
  return "Not pushed";
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  function load() {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []));
  }

  useEffect(load, []);

  async function update(orderNumber: string, patch: Record<string, unknown>) {
    setBusy(orderNumber);
    setMsg("");
    const res = await fetch("/api/admin/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber, ...patch }),
    });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) {
      setMsg(data.error || "Failed");
    } else if (patch.retryShiprocket) {
      const o = data.order;
      if (validId(o?.shiprocketOrderId)) {
        setMsg(`Pushed to Shiprocket · #${o.shiprocketOrderId}`);
      } else {
        const note = [...(o?.timeline || [])]
          .reverse()
          .find((t: TimelineItem) => t.status.startsWith("shiprocket_"))?.note;
        setMsg(note || "Shiprocket push did not return an order id — check credentials / pickup location");
      }
    } else {
      setMsg("Updated");
    }
    load();
  }

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl">Orders</h1>
      {msg && (
        <p className="mt-2 text-sm text-[var(--fg-muted)]">{msg}</p>
      )}
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
                  Shiprocket: {shiprocketLabel(o)} · AWB: {o.awb || "—"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  className="input w-auto"
                  value={o.status}
                  onChange={(e) =>
                    update(o.orderNumber, { status: e.target.value })
                  }
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
                  disabled={busy === o.orderNumber || validId(o.shiprocketOrderId)}
                  onClick={() =>
                    update(o.orderNumber, { retryShiprocket: true })
                  }
                >
                  {busy === o.orderNumber
                    ? "Pushing…"
                    : validId(o.shiprocketOrderId)
                      ? "Pushed"
                      : "Push Shiprocket"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
