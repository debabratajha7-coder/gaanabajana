"use client";

import { useEffect, useState } from "react";
import { Check, Copy, MapPin, Phone, Mail } from "lucide-react";
import { formatINR } from "@/lib/utils";

type TimelineItem = { status: string; at?: string; note?: string };

type Address = {
  fullName?: string;
  phone?: string;
  email?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
};

type OrderItem = {
  title?: string;
  qty?: number;
  price?: number;
  sku?: string;
};

type Order = {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  subtotal?: number;
  shippingFee?: number;
  shiprocketOrderId?: string;
  shiprocketShipmentId?: string;
  awb?: string;
  timeline?: TimelineItem[];
  items?: OrderItem[];
  shippingAddress?: Address;
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
  return "Not pushed — add manually in Shiprocket";
}

function formatAddressBlock(a?: Address) {
  if (!a) return "";
  return [
    a.fullName,
    a.line1,
    a.line2,
    [a.city, a.state, a.pincode].filter(Boolean).join(", "),
    a.country || "India",
    a.phone ? `Phone: ${a.phone}` : "",
    a.email ? `Email: ${a.email}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  function load() {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []));
  }

  useEffect(load, []);

  async function copyText(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setMsg("Could not copy — select the address manually");
    }
  }

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
        setMsg(
          note ||
            "API push failed — use the address below to add the order manually in Shiprocket"
        );
      }
    } else {
      setMsg("Updated");
    }
    load();
  }

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl">Orders</h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--fg-muted)]">
        Copy the customer address into Shiprocket manually for now. Once the
        shipment is created there, webhooks will update the customer timeline
        and send emails.
      </p>
      {msg && <p className="mt-2 text-sm text-[var(--fg-muted)]">{msg}</p>}

      <div className="mt-6 space-y-4">
        {orders.map((o) => {
          const addr = o.shippingAddress;
          const addressText = formatAddressBlock(addr);
          return (
            <div
              key={o.orderNumber}
              className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold tracking-tight">
                    {o.orderNumber}
                  </p>
                  <p className="mt-1 text-sm capitalize">
                    {o.status.replace(/_/g, " ")} · {o.paymentStatus} ·{" "}
                    {formatINR(o.total)}
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
                    disabled={
                      busy === o.orderNumber || validId(o.shiprocketOrderId)
                    }
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

              {/* Ship-to address for manual Shiprocket entry */}
              <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--bg)]/50 p-3.5 sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--fg-muted)]">
                    <MapPin className="h-3.5 w-3.5 text-[var(--accent)]" />
                    Ship to (paste into Shiprocket)
                  </p>
                  {addressText ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] px-2.5 py-1 text-[11px] font-semibold text-[var(--fg-muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                      onClick={() =>
                        copyText(`${o.orderNumber}-addr`, addressText)
                      }
                    >
                      {copied === `${o.orderNumber}-addr` ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-500" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" /> Copy address
                        </>
                      )}
                    </button>
                  ) : null}
                </div>

                {addr ? (
                  <div className="mt-3 space-y-1 text-sm leading-relaxed text-[var(--fg)]">
                    <p className="font-semibold">{addr.fullName || "—"}</p>
                    {addr.line1 ? <p>{addr.line1}</p> : null}
                    {addr.line2 ? <p>{addr.line2}</p> : null}
                    <p>
                      {[addr.city, addr.state, addr.pincode]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </p>
                    <p className="text-[var(--fg-muted)]">
                      {addr.country || "India"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--fg-muted)]">
                      {addr.phone ? (
                        <a
                          href={`tel:${addr.phone.replace(/\s+/g, "")}`}
                          className="inline-flex items-center gap-1 hover:text-[var(--accent)]"
                        >
                          <Phone className="h-3 w-3" />
                          {addr.phone}
                        </a>
                      ) : null}
                      {addr.email ? (
                        <a
                          href={`mailto:${addr.email}`}
                          className="inline-flex items-center gap-1 hover:text-[var(--accent)]"
                        >
                          <Mail className="h-3 w-3" />
                          {addr.email}
                        </a>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-[var(--fg-muted)]">
                    No shipping address on this order.
                  </p>
                )}
              </div>

              {o.items && o.items.length > 0 ? (
                <div className="mt-3 border-t border-[var(--line)] pt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--fg-muted)]">
                    Items
                  </p>
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {o.items.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex justify-between gap-3 text-[var(--fg)]"
                      >
                        <span className="min-w-0 truncate">
                          {item.title || "Item"} × {item.qty || 1}
                          {item.sku ? (
                            <span className="text-[var(--fg-muted)]">
                              {" "}
                              · {item.sku}
                            </span>
                          ) : null}
                        </span>
                        <span className="shrink-0 tabular-nums text-[var(--fg-muted)]">
                          {formatINR((item.price || 0) * (item.qty || 1))}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
