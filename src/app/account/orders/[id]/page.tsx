"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Check, Copy, ExternalLink, Package, Truck } from "lucide-react";
import { formatINR } from "@/lib/utils";

type TimelineRaw = { status: string; at: string; note?: string };
type OrderItem = {
  title: string;
  qty: number;
  price: number;
  image?: string;
  slug?: string;
};

type Order = {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  subtotal?: number;
  shippingFee?: number;
  items: OrderItem[];
  awb?: string;
  trackingUrl?: string;
  courierName?: string;
  lastTrackingStatus?: string;
  shiprocketOrderId?: string;
  timeline: TimelineRaw[];
  shippingAddress?: {
    fullName?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  createdAt?: string;
};

const STATUS_COPY: Record<string, { title: string; blurb?: string }> = {
  created: { title: "Order placed", blurb: "We received your order" },
  paid: { title: "Payment confirmed", blurb: "Prepaid successfully" },
  confirmed: { title: "Order confirmed", blurb: "We’re preparing your gear" },
  processing: { title: "Packing", blurb: "Getting your order ready to ship" },
  shipped: { title: "Shipped", blurb: "On the way to you" },
  delivered: { title: "Delivered", blurb: "Hope it plays beautifully" },
  cancelled: { title: "Cancelled" },
  shiprocket_created: {
    title: "Handed to shipping",
    blurb: "Courier partner notified",
  },
  shiprocket_skipped: {
    title: "Shipping pending",
    blurb: "We’ll update tracking soon",
  },
  shiprocket_error: {
    title: "Shipping update delayed",
    blurb: "We’re sorting this on our side",
  },
  payment_failed: { title: "Payment failed" },
};

function humanizeStatus(status: string) {
  if (status.startsWith("shipping:")) {
    const label = status.slice("shipping:");
    return {
      title: label.replace(/_/g, " "),
      blurb: "Courier update",
    };
  }
  return (
    STATUS_COPY[status] || {
      title: status.replace(/_/g, " "),
    }
  );
}

function cleanNote(note?: string) {
  if (!note) return undefined;
  const n = note
    .replace(/\bundefined\b/gi, "")
    .replace(/\bnull\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s·\s*$/g, "")
    .trim();
  if (!n || /^shiprocket order$/i.test(n)) return undefined;
  // Hide raw technical notes from customers
  if (/shiprocket order undefined/i.test(note)) return undefined;
  if (/credentials not configured/i.test(note)) return undefined;
  return n;
}

function prepareTimeline(raw: TimelineRaw[]) {
  const sorted = [...(raw || [])].sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
  );

  const out: {
    key: string;
    title: string;
    blurb?: string;
    note?: string;
    at: string;
    tone: "ok" | "warn" | "mute";
  }[] = [];

  for (const t of sorted) {
    // Skip noisy internal admin toggles that bounce confirmed↔processing
    const copy = humanizeStatus(t.status);
    const note = cleanNote(t.note);
    const prev = out[out.length - 1];
    if (prev && prev.title === copy.title && !note) continue;

    let tone: "ok" | "warn" | "mute" = "ok";
    if (/error|failed|cancel/i.test(t.status)) tone = "warn";
    if (/skipped|pending/i.test(t.status)) tone = "mute";

    out.push({
      key: `${t.status}-${t.at}`,
      title: copy.title,
      blurb: copy.blurb,
      note,
      at: t.at,
      tone,
    });
  }
  return out;
}

function statusBadgeClass(status: string) {
  const s = status.toLowerCase();
  if (s === "delivered") return "bg-emerald-500/15 text-emerald-400";
  if (s === "shipped" || s === "processing")
    return "bg-[var(--accent)]/15 text-[var(--accent)]";
  if (s === "cancelled" || s === "failed")
    return "bg-red-500/15 text-red-400";
  return "bg-white/10 text-[var(--fg-muted)]";
}

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleString();
  }
}

export default function AccountOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/orders/${params.id}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Not found");
        setOrder(d.order);
      })
      .catch((e) => setError(e.message || "Could not load order"));
  }, [params.id]);

  const timeline = useMemo(
    () => prepareTimeline(order?.timeline || []),
    [order?.timeline]
  );

  async function copyOrderId() {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  if (error) {
    return (
      <div className="mesh-bg">
        <div className="container-gb py-12">
          <p className="text-[var(--danger)]">{error}</p>
          <Link href="/account/orders" className="btn btn-ghost mt-4">
            Back to orders
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mesh-bg">
        <div className="container-gb space-y-4 py-10">
          <div className="skeleton h-8 w-28" />
          <div className="skeleton h-36 w-full rounded-[var(--radius-glass)]" />
          <div className="skeleton h-48 w-full rounded-[var(--radius-glass)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="mesh-bg">
      <div className="container-gb max-w-2xl py-8 sm:py-12">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--fg-muted)] transition hover:text-[var(--accent)]"
        >
          ← Orders
        </Link>

        {/* Header */}
        <section className="glass-panel-strong mt-4 overflow-hidden p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-muted)]">
                Order
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <h1 className="truncate font-mono text-base font-semibold tracking-tight text-[var(--fg)] sm:text-lg">
                  {order.orderNumber}
                </h1>
                <button
                  type="button"
                  onClick={copyOrderId}
                  className="icon-btn h-8 w-8 shrink-0"
                  aria-label="Copy order number"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
            <p className="shrink-0 text-lg font-semibold text-[var(--price)] sm:text-xl">
              {formatINR(order.total)}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${statusBadgeClass(order.status)}`}
            >
              {order.status.replace(/_/g, " ")}
            </span>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold capitalize text-[var(--fg-muted)]">
              {order.paymentStatus}
            </span>
            {order.lastTrackingStatus ? (
              <span className="rounded-full bg-[var(--accent)]/15 px-2.5 py-1 text-[11px] font-semibold text-[var(--accent)]">
                {order.lastTrackingStatus}
              </span>
            ) : null}
          </div>

          {(order.awb || order.trackingUrl || order.courierName) && (
            <div className="mt-4 flex items-start gap-3 rounded-[calc(var(--radius-glass)-4px)] border border-[var(--line)] bg-[var(--bg)]/40 p-3">
              <Truck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
              <div className="min-w-0 text-sm">
                {order.courierName ? (
                  <p className="font-medium text-[var(--fg)]">{order.courierName}</p>
                ) : (
                  <p className="font-medium text-[var(--fg)]">Shipment</p>
                )}
                {order.awb ? (
                  <p className="mt-0.5 text-[var(--fg-muted)]">AWB {order.awb}</p>
                ) : (
                  <p className="mt-0.5 text-[var(--fg-muted)]">
                    Tracking number pending
                  </p>
                )}
                {order.trackingUrl ? (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-[var(--accent)]"
                  >
                    Track package <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>
            </div>
          )}
        </section>

        {/* Items */}
        <section className="glass-panel mt-4 p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <Package className="h-4 w-4 text-[var(--accent)]" />
            <h2 className="text-sm font-semibold tracking-wide text-[var(--fg)]">
              Items
            </h2>
          </div>
          <ul className="divide-y divide-[var(--line)]">
            {order.items.map((i, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--fg)]">
                    {i.title}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--fg-muted)]">
                    Qty {i.qty}
                  </p>
                </div>
                <p className="shrink-0 text-sm tabular-nums text-[var(--fg)]">
                  {formatINR(i.price * i.qty)}
                </p>
              </li>
            ))}
          </ul>
          {(order.subtotal != null || order.shippingFee != null) && (
            <div className="mt-3 space-y-1 border-t border-[var(--line)] pt-3 text-sm">
              {order.subtotal != null ? (
                <div className="flex justify-between text-[var(--fg-muted)]">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{formatINR(order.subtotal)}</span>
                </div>
              ) : null}
              {order.shippingFee != null ? (
                <div className="flex justify-between text-[var(--fg-muted)]">
                  <span>Shipping</span>
                  <span className="tabular-nums">
                    {order.shippingFee === 0
                      ? "Free"
                      : formatINR(order.shippingFee)}
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between font-semibold text-[var(--fg)]">
                <span>Total</span>
                <span className="tabular-nums text-[var(--price)]">
                  {formatINR(order.total)}
                </span>
              </div>
            </div>
          )}
        </section>

        {/* Timeline */}
        <section className="glass-panel mt-4 p-4 sm:p-5">
          <h2 className="text-sm font-semibold tracking-wide text-[var(--fg)]">
            Order updates
          </h2>
          <p className="mt-1 text-xs text-[var(--fg-muted)]">
            Live shipping updates appear here as your parcel moves.
          </p>

          {timeline.length === 0 ? (
            <p className="mt-6 text-sm text-[var(--fg-muted)]">
              No updates yet.
            </p>
          ) : (
            <ol className="relative mt-6 space-y-0">
              {timeline.map((t, i) => {
                const isLast = i === timeline.length - 1;
                return (
                  <li key={t.key} className="relative flex gap-3 pb-6 last:pb-0">
                    {!isLast ? (
                      <span
                        className="absolute left-[7px] top-4 h-[calc(100%-8px)] w-px bg-[var(--line)]"
                        aria-hidden
                      />
                    ) : null}
                    <span
                      className={`relative z-[1] mt-1 h-4 w-4 shrink-0 rounded-full border-2 ${
                        isLast
                          ? "border-[var(--accent)] bg-[var(--accent)] shadow-[0_0_0_4px_color-mix(in_oklab,var(--accent)_25%,transparent)]"
                          : t.tone === "warn"
                            ? "border-red-400 bg-red-400/30"
                            : "border-[var(--line-strong)] bg-[var(--bg-elevated)]"
                      }`}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                        <p
                          className={`text-sm font-semibold capitalize ${
                            isLast ? "text-[var(--fg)]" : "text-[var(--fg)]/90"
                          }`}
                        >
                          {t.title}
                        </p>
                        <time className="text-[11px] tabular-nums text-[var(--fg-muted)]">
                          {formatWhen(t.at)}
                        </time>
                      </div>
                      {t.blurb ? (
                        <p className="mt-0.5 text-xs text-[var(--fg-muted)]">
                          {t.blurb}
                        </p>
                      ) : null}
                      {t.note ? (
                        <p className="mt-1 text-xs leading-relaxed text-[var(--fg-muted)]">
                          {t.note}
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {order.shippingAddress?.fullName ? (
          <section className="glass-panel mt-4 p-4 sm:p-5">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--fg)]">
              Shipping to
            </h2>
            <p className="mt-2 text-sm text-[var(--fg)]">
              {order.shippingAddress.fullName}
            </p>
            <p className="mt-1 text-sm text-[var(--fg-muted)]">
              {[
                order.shippingAddress.city,
                order.shippingAddress.state,
                order.shippingAddress.pincode,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
          </section>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/track-order" className="btn btn-ghost text-sm">
            Track another order
          </Link>
          <Link href="/account/orders" className="btn btn-primary text-sm">
            All orders
          </Link>
        </div>
      </div>
    </div>
  );
}
