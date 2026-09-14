"use client";

import { FormEvent, useState } from "react";

export default function TrackOrderPage() {
  const [order, setOrder] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<{
    orderNumber: string;
    status: string;
    paymentStatus: string;
    awb?: string;
    trackingUrl?: string;
    total: number;
  } | null>(null);
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
    <div className="container-gb mx-auto max-w-lg py-12">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">Track your order</h1>
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
        <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
          <p>
            <strong>{result.orderNumber}</strong>
          </p>
          <p className="mt-2">
            {result.status} · {result.paymentStatus}
          </p>
          {result.awb && <p className="mt-2">AWB: {result.awb}</p>}
          {result.trackingUrl && (
            <a href={result.trackingUrl} className="mt-2 inline-block text-[var(--accent)]">
              Open tracking
            </a>
          )}
        </div>
      )}
    </div>
  );
}
