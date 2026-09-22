"use client";

import { FormEvent, useState } from "react";

type TimelineItem = { status: string; at: string; note?: string };

type TrackResult = {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  awb?: string;
  trackingUrl?: string;
  courierName?: string;
  lastTrackingStatus?: string;
  total: number;
  timeline?: TimelineItem[];
};

function formatStatus(s: string) {
  if (s.startsWith("shipping:")) return s.slice("shipping:".length);
  return s.replace(/_/g, " ");
}

export default function TrackOrderPage() {
  const [order, setOrder] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    const res = await fetch(
      `/api/track?order=${encodeURIComponent(order)}&phone=${encodeURIComponent(phone)}`
    );
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Not found");
      return;
    }
    setResult(data.order);
  }

  return (
    <div className="mesh-bg">
      <div className="container-gb mx-auto max-w-lg py-12">
        <div className="glass-panel-strong p-5 sm:p-7">
          <h1 className="display text-3xl sm:text-4xl">Track your order</h1>
          <form onSubmit={onSubmit} className="mt-8 space-y-3">
            <input
              className="input"
              placeholder="Order number (e.g. GB…)"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              required
            />
            <input
              className="input"
              placeholder="Phone used at checkout"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <button className="btn btn-primary" type="submit">
              Track
            </button>
          </form>
          {error && <p className="mt-4 text-[var(--danger)]">{error}</p>}
          {result && (
            <div className="mt-6 space-y-4">
              <div className="glass-panel p-5">
                <p>
                  <strong>{result.orderNumber}</strong>
                </p>
                <p className="mt-2 capitalize">
                  {result.lastTrackingStatus || result.status.replace(/_/g, " ")}{" "}
                  · {result.paymentStatus}
                </p>
                {result.courierName && (
                  <p className="mt-1 text-sm text-[var(--fg-muted)]">
                    {result.courierName}
                  </p>
                )}
                {result.awb && <p className="mt-2">AWB: {result.awb}</p>}
                {result.trackingUrl && (
                  <a
                    href={result.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-[var(--accent)]"
                  >
                    Open courier tracking
                  </a>
                )}
              </div>

              {result.timeline && result.timeline.length > 0 ? (
                <div className="glass-panel p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--fg-muted)]">
                    Updates
                  </p>
                  <ol className="mt-3 space-y-3 border-l border-[var(--line)] pl-4">
                    {[...result.timeline].reverse().map((t, i) => (
                      <li key={`${t.status}-${t.at}-${i}`} className="relative">
                        <span className="absolute -left-[1.28rem] top-1.5 h-2 w-2 rounded-full bg-[var(--accent)]" />
                        <p className="text-sm font-medium capitalize text-[var(--fg)]">
                          {formatStatus(t.status)}
                        </p>
                        {t.note && (
                          <p className="mt-0.5 text-xs text-[var(--fg-muted)]">
                            {t.note}
                          </p>
                        )}
                        <p className="mt-0.5 text-[11px] text-[var(--fg-muted)]">
                          {new Date(t.at).toLocaleString("en-IN")}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
