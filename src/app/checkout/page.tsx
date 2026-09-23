"use client";

import { FormEvent, useEffect, useState } from "react";
import { useCart } from "@/components/providers/CartProvider";
import { formatINR } from "@/lib/utils";
import Link from "next/link";
import { Banknote, Smartphone } from "lucide-react";

type PaymentMethod = "prepaid" | "cod";

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const [loading, setLoading] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("prepaid");
  const [settings, setSettings] = useState({
    freeShippingThreshold: 1000,
    shippingFee: 99,
    codFee: 49,
    codEnabled: true,
    codOtpRequired: false,
  });
  const [otp, setOtp] = useState({
    challengeToken: "",
    code: "",
    masked: "",
    sent: false,
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
            freeShippingThreshold: d.settings.freeShippingThreshold ?? 1000,
            shippingFee: d.settings.shippingFee ?? 99,
            codFee: d.settings.codFee ?? 49,
            codEnabled: d.settings.codEnabled !== false,
            codOtpRequired: Boolean(d.features?.codOtpRequired),
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
          const def =
            d.user.addresses?.find(
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
  const codFee =
    paymentMethod === "cod" && settings.codEnabled
      ? Number(settings.codFee || 0)
      : 0;
  const total = subtotal + shipping + codFee;

  async function sendCodOtp() {
    setError("");
    setOtpBusy(true);
    try {
      const res = await fetch("/api/checkout/cod-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.otpRequired === false) {
          setSettings((s) => ({ ...s, codOtpRequired: false }));
          setError("");
          return;
        }
        throw new Error(data.error || "Could not send OTP");
      }
      setOtp({
        challengeToken: data.challengeToken || "",
        code: data.devCode || "",
        masked: data.maskedTarget || "",
        sent: true,
      });
      setSettings((s) => ({ ...s, codOtpRequired: true }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send OTP");
    } finally {
      setOtpBusy(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (paymentMethod === "cod" && !settings.codEnabled) {
        throw new Error("Cash on delivery is not available");
      }

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
          paymentMethod,
          ...(paymentMethod === "cod" && settings.codOtpRequired
            ? {
                otpChallengeToken: otp.challengeToken,
                otpCode: otp.code,
              }
            : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      if (!data.redirectUrl) throw new Error("Redirect URL missing");

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
        <h1 className="font-[family-name:var(--font-display)] text-4xl">
          Nothing to checkout
        </h1>
        <Link href="/cart" className="btn btn-primary mt-6">
          Back to cart
        </Link>
      </div>
    );
  }

  const submitLabel =
    paymentMethod === "cod"
      ? `Place COD order · ${formatINR(total)}`
      : `Pay ${formatINR(total)} with PhonePe`;

  return (
    <div className="container-gb grid gap-10 py-10 lg:grid-cols-[1fr_340px]">
      <form onSubmit={onSubmit} className="space-y-4">
        <h1 className="font-[family-name:var(--font-display)] text-4xl">
          Checkout
        </h1>
        <p className="text-sm text-[var(--fg-muted)]">
          Choose how you want to pay, then confirm your shipping details.
        </p>

        {/* Payment method */}
        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm text-[var(--fg-muted)]">
            Payment method
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                paymentMethod === "prepaid"
                  ? "border-[var(--accent)] bg-[var(--accent)]/8"
                  : "border-[var(--line)] bg-[var(--bg-elevated)]"
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                className="mt-1"
                checked={paymentMethod === "prepaid"}
                onChange={() => setPaymentMethod("prepaid")}
              />
              <span>
                <span className="flex items-center gap-1.5 font-semibold">
                  <Smartphone className="h-4 w-4 text-[var(--accent)]" />
                  Pay online
                </span>
                <span className="mt-1 block text-xs text-[var(--fg-muted)]">
                  UPI, cards & netbanking via PhonePe
                </span>
              </span>
            </label>

            {settings.codEnabled ? (
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                  paymentMethod === "cod"
                    ? "border-[var(--accent)] bg-[var(--accent)]/8"
                    : "border-[var(--line)] bg-[var(--bg-elevated)]"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  className="mt-1"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                />
                <span>
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Banknote className="h-4 w-4 text-[var(--accent)]" />
                    Cash on delivery
                  </span>
                  <span className="mt-1 block text-xs text-[var(--fg-muted)]">
                    Pay the courier when your order arrives
                    {settings.codFee > 0
                      ? ` · +${formatINR(settings.codFee)} COD fee`
                      : ""}
                  </span>
                </span>
              </label>
            ) : null}
          </div>
        </fieldset>

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
            <label className="mb-1 block text-sm text-[var(--fg-muted)]">
              {label}
            </label>
            <input
              className="input"
              required={key !== "line2"}
              value={form[key]}
              onChange={(e) => {
                setForm({ ...form, [key]: e.target.value });
                if (key === "phone" && otp.sent) {
                  setOtp({
                    challengeToken: "",
                    code: "",
                    masked: "",
                    sent: false,
                  });
                }
              }}
            />
          </div>
        ))}

        {paymentMethod === "cod" && settings.codOtpRequired ? (
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
            <p className="text-sm font-medium">Verify phone for COD</p>
            <p className="mt-1 text-xs text-[var(--fg-muted)]">
              Enter the SMS code we send to your shipping phone — this helps
              block fake COD orders.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-ghost"
                disabled={otpBusy || !form.phone}
                onClick={sendCodOtp}
              >
                {otpBusy
                  ? "Sending…"
                  : otp.sent
                    ? "Resend OTP"
                    : "Send OTP"}
              </button>
              {otp.masked ? (
                <span className="self-center text-xs text-[var(--fg-muted)]">
                  Sent to {otp.masked}
                </span>
              ) : null}
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-sm text-[var(--fg-muted)]">
                Enter OTP
              </label>
              <input
                className="input max-w-[12rem] tracking-[0.3em]"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required={settings.codOtpRequired}
                value={otp.code}
                onChange={(e) =>
                  setOtp((o) => ({
                    ...o,
                    code: e.target.value.replace(/\D/g, "").slice(0, 6),
                  }))
                }
                placeholder="••••••"
              />
            </div>
          </div>
        ) : paymentMethod === "cod" ? (
          <p className="text-xs text-[var(--fg-muted)]">
            Phone SMS verification is optional right now — we’ll confirm your
            order after you place it.
          </p>
        ) : null}

        <div>
          <label className="mb-1 block text-sm text-[var(--fg-muted)]">
            Order note
          </label>
          <textarea
            className="input min-h-24"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </div>
        {error && <p className="text-[var(--danger)]">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading
            ? paymentMethod === "cod"
              ? "Placing order…"
              : "Redirecting…"
            : submitLabel}
        </button>
      </form>

      <aside className="glass-panel-strong h-fit p-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">
          Summary
        </h2>
        <ul className="mt-4 space-y-2 text-sm">
          {items.map((i) => (
            <li
              key={`${i.productId}-${i.variantName}`}
              className="flex justify-between gap-3"
            >
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
          {codFee > 0 ? (
            <div className="flex justify-between">
              <span>COD fee</span>
              <span>{formatINR(codFee)}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-lg text-[var(--price)]">
            <span>Total</span>
            <span>{formatINR(total)}</span>
          </div>
          <p className="pt-2 text-xs text-[var(--fg-muted)]">
            {paymentMethod === "cod"
              ? "Pay this amount in cash to the delivery partner."
              : "You’ll complete payment securely on PhonePe."}
          </p>
        </div>
      </aside>
    </div>
  );
}
