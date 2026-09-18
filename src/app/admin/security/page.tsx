"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { OtpInput } from "@/components/auth/OtpInput";
import { maskPhone } from "@/lib/otp-client";

type Me = {
  email: string;
  phone?: string;
  role: string;
  isSuperAdmin?: boolean;
  hasPassword?: boolean;
};

export default function AdminSecurityPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [maskedNew, setMaskedNew] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setMe(d.user);
      })
      .catch(() => setError("Could not load account"));
  }, []);

  async function requestChange(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const res = await fetch("/api/account/phone/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, currentPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send code");
      setChallengeToken(data.challengeToken);
      setMaskedNew(data.maskedPhone || "");
      setOtpCode("");
      setStep("otp");
      setMsg(`Code sent to ${data.maskedPhone}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function confirmChange(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const res = await fetch("/api/account/phone/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeToken, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not verify code");
      setMe((m) => (m ? { ...m, phone: data.phone } : m));
      setPhone("");
      setCurrentPassword("");
      setChallengeToken("");
      setOtpCode("");
      setStep("form");
      setMsg("OTP phone updated. Next login will use this number.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (!me) {
    return <div className="py-8 text-[var(--fg-muted)]">Loading…</div>;
  }

  const currentMasked = me.phone ? maskPhone(me.phone) : "Not set";

  return (
    <div className="max-w-lg">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--fg-muted)]">
        Account
      </p>
      <h1 className="display mt-2 text-3xl">Login &amp; security</h1>
      <p className="mt-2 text-sm text-[var(--fg-muted)]">
        Sign in from any device with your email and password. Admin access always
        asks for an OTP on your phone.
      </p>

      <div className="mt-8 space-y-3 border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
            Login email
          </p>
          <p className="mt-1 text-sm font-medium">{me.email}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
            OTP phone
          </p>
          <p className="mt-1 text-sm font-medium">{currentMasked}</p>
          {me.phone && (
            <p className="mt-1 text-xs text-[var(--fg-muted)]">{me.phone}</p>
          )}
        </div>
        <p className="text-xs text-[var(--fg-muted)]">
          Password changes:{" "}
          <Link href="/account/profile" className="underline hover:text-[var(--accent)]">
            Profile &amp; security
          </Link>
        </p>
      </div>

      {step === "form" ? (
        <form onSubmit={requestChange} className="mt-8 space-y-4">
          <h2 className="display text-2xl">Change OTP phone</h2>
          <p className="text-sm text-[var(--fg-muted)]">
            Enter your password and the new Indian mobile number. We will SMS a
            code to that number before saving it.
          </p>
          <div>
            <label className="field-label" htmlFor="currentPassword">
              Current password
            </label>
            <input
              id="currentPassword"
              className="input"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="newPhone">
              New phone number
            </label>
            <input
              id="newPhone"
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile"
              required
              inputMode="tel"
              autoComplete="tel"
            />
          </div>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          {msg && <p className="text-sm text-[var(--success)]">{msg}</p>}
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Sending…" : "Send OTP to new number"}
          </button>
        </form>
      ) : (
        <form onSubmit={confirmChange} className="mt-8 space-y-4">
          <h2 className="display text-2xl">Verify new number</h2>
          <p className="text-sm text-[var(--fg-muted)]">
            Enter the 6-digit code sent to {maskedNew || "your new phone"}.
          </p>
          <OtpInput value={otpCode} onChange={setOtpCode} />
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          {msg && <p className="text-sm text-[var(--success)]">{msg}</p>}
          <div className="flex flex-wrap gap-3">
            <button
              className="btn btn-primary"
              type="submit"
              disabled={busy || otpCode.length < 6}
            >
              {busy ? "Saving…" : "Confirm & save"}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={busy}
              onClick={() => {
                setStep("form");
                setChallengeToken("");
                setOtpCode("");
                setError("");
                setMsg("");
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
