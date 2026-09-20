"use client";

import { FormEvent, useEffect, useState } from "react";
import { useCart } from "@/components/providers/CartProvider";
import { formatINR } from "@/lib/utils";
import Link from "next/link";

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState({
    freeShippingThreshold: 1000,
    shippingFee: 99,
  });
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    note: "",
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setSettings({
            freeShippingThreshold: d.settings.freeShippingThreshold,
            shippingFee: d.settings.shippingFee,
          });
        }
      })
      .catch(() => undefined);
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setForm((f) => ({
            ...f,
            fullName: d.user.name || f.fullName,
            email: d.user.email || f.email,
            phone: d.user.phone || f.phone,
          }));
          const def = d.user.addresses?.find(
            (a: { isDefault?: boolean }) => a.isDefault
          ) || d.user.addresses?.[0];
          if (def) {
            setForm((f) => ({
              ...f,
              fullName: def.fullName || f.fullName,
              phone: def.phone || f.phone,
              line1: def.line1 || "",
              line2: def.line2 || "",
              city: def.city || "",
              state: def.state || "",
              pincode: def.pincode || "",
            }));
          }
        }
      })
      .catch(() => undefined);
  }, []);

  const shipping =
    subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingFee;
  const total = subtotal + shipping;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            qty: i.qty,
            variantName: i.variantName,
          })),
          shippingAddress: form,
          note: form.note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      if (!data.redirectUrl) throw new Error("PhonePe redirect URL missing");

      clear();
      window.location.href = data.redirectUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="container-gb py-20 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-4xl">Nothing to checkout</h1>
        <Link href="/cart" className="btn btn-primary mt-6">
          Back to cart
        </Link>
      </div>
    );
  }

  return (
    <div className="container-gb grid gap-10 py-10 lg:grid-cols-[1fr_340px]">
      <form onSubmit={onSubmit} className="space-y-4">
        <h1 className="font-[family-name:var(--font-display)] text-4xl">Checkout</h1>
        <p className="text-sm text-[var(--fg-muted)]">
          Pay securely with UPI, cards, and netbanking via PhonePe.
        </p>
        {(
          [
            ["fullName", "Full name"],
            ["phone", "Phone"],
            ["email", "Email"],
            ["line1", "Address line 1"],
            ["line2", "Address line 2 (optional)"],
            ["city", "City"],
            ["state", "State"],
            ["pincode", "Pincode"],
          ] as const
        ).map(([key, label]) => (
          <div key={key}>
            <label className="mb-1 block text-sm text-[var(--fg-muted)]">{label}</label>
            <input
              className="input"
              required={key !== "line2"}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          </div>
        ))}
        <div>
          <label className="mb-1 block text-sm text-[var(--fg-muted)]">Order note</label>
          <textarea
            className="input min-h-24"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </div>
        {error && <p className="text-[var(--danger)]">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Redirecting…" : `Pay ${formatINR(total)}`}
        </button>
      </form>
      <aside className="glass-panel-strong h-fit p-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">Summary</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {items.map((i) => (
            <li key={`${i.productId}-${i.variantName}`} className="flex justify-between gap-3">
              <span>
                {i.title} × {i.qty}
              </span>
              <span>{formatINR(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t border-[var(--line)] pt-4 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatINR(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>{shipping === 0 ? "Free" : formatINR(shipping)}</span>
          </div>
          <div className="flex justify-between text-lg text-[var(--price)]">
            <span>Total</span>
            <span>{formatINR(total)}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
