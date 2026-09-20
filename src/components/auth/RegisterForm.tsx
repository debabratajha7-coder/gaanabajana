"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { OtpInput } from "@/components/auth/OtpInput";
import { EmailOtpModal } from "@/components/auth/EmailOtpModal";

type Step = "phone" | "phone_otp" | "details";

export function RegisterForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [emailChallengeToken, setEmailChallengeToken] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [code, setCode] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");

  async function sendPhoneOtp(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send OTP");
      setPhone(data.phone || phone);
      setMaskedPhone(data.masked || phone);
      setOtpToken(data.otpToken || "");
      setCode("");
      setStep("phone_otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function verifyPhoneOtp(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup/phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otpToken, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid code");
      setChallengeToken(data.challengeToken);
      setCode("");
      setStep("details");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function submitDetails(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeToken,
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create account");
      if (data.completed) {
        router.push("/account");
        router.refresh();
        return;
      }
      setEmailChallengeToken(data.emailChallengeToken);
      setMaskedEmail(data.maskedEmail || form.email);
      setEmailCode("");
      setEmailError("");
      setEmailModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function verifyEmailOtp(e: FormEvent) {
    e.preventDefault();
    setEmailError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailChallengeToken, code: emailCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid code");
      setEmailModalOpen(false);
      router.push("/account");
      router.refresh();
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  const steps = [
    { id: "phone", label: "Phone" },
    { id: "phone_otp", label: "SMS" },
    { id: "details", label: "Profile" },
  ] as const;
  const stepIndex = steps.findIndex((s) => s.id === step);

  return (
    <div className="container-gb mx-auto max-w-md py-12 md:py-16">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--fg-muted)]">
        Join Gaanabajana
      </p>
      <h1 className="display mt-2 text-4xl md:text-5xl">Create account</h1>
      <p className="mt-2 text-[var(--fg-muted)]">
        Verify your phone, set your profile, then confirm email — secure checkout in minutes.
      </p>

      <ol className="mt-8 flex gap-2">
        {steps.map((s, i) => (
          <li
            key={s.id}
            className={`h-1 flex-1 rounded-full transition ${
              i <= stepIndex ? "bg-[var(--fg)]" : "bg-[var(--line)]"
            }`}
            title={s.label}
          />
        ))}
      </ol>
      <p className="mt-2 text-xs text-[var(--fg-muted)]">
        Step {stepIndex + 1} of {steps.length} · {steps[stepIndex]?.label}
      </p>

      {step === "phone" && (
        <>
          <div className="mt-8 space-y-4">
            <GoogleSignInButton enabled={googleEnabled} />
            {googleEnabled && (
              <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-[var(--fg-muted)]">
                <span className="h-px flex-1 bg-[var(--line)]" />
                or continue with phone
                <span className="h-px flex-1 bg-[var(--line)]" />
              </div>
            )}
          </div>
          <form onSubmit={sendPhoneOtp} className="mt-4 space-y-4">
            <div>
              <label className="field-label" htmlFor="phone">
                Mobile number
              </label>
              <div className="flex overflow-hidden rounded-[var(--radius-control)] border border-[var(--line-strong)] bg-[var(--bg-elevated)]">
                <span className="flex items-center border-r border-[var(--line)] px-3 text-sm text-[var(--fg-muted)]">
                  +91
                </span>
                <input
                  id="phone"
                  className="input flex-1 border-0 bg-transparent shadow-none"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="10-digit number"
                  value={phone.replace(/^\+91/, "")}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>
            {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
            <button className="btn btn-primary w-full" type="submit" disabled={loading}>
              {loading ? "Sending…" : "Send OTP"}
            </button>
          </form>
        </>
      )}

      {step === "phone_otp" && (
        <form onSubmit={verifyPhoneOtp} className="mt-8 space-y-5">
          <p className="text-sm text-[var(--fg-muted)]">
            Enter the 6-digit code sent to <span className="text-[var(--fg)]">{maskedPhone}</span>
          </p>
          <OtpInput value={code} onChange={setCode} />
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <button className="btn btn-primary w-full" type="submit" disabled={loading || code.length < 6}>
            {loading ? "Verifying…" : "Verify phone"}
          </button>
          <button
            type="button"
            className="btn btn-ghost w-full"
            onClick={() => {
              setStep("phone");
              setCode("");
              setError("");
            }}
          >
            Change number
          </button>
        </form>
      )}

      {step === "details" && (
        <form onSubmit={submitDetails} className="mt-8 space-y-4">
          <div>
            <label className="field-label" htmlFor="name">
              Full name
            </label>
            <input
              id="name"
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="input"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="input"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={6}
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="confirm">
              Confirm password
            </label>
            <input
              id="confirm"
              className="input"
              type="password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              minLength={6}
              required
            />
          </div>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <button className="btn btn-primary w-full" type="submit" disabled={loading}>
            {loading ? "Saving…" : "Continue"}
          </button>
        </form>
      )}

      <p className="mt-6 text-sm text-[var(--fg-muted)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--accent)]">
          Login
        </Link>
      </p>

      <EmailOtpModal
        open={emailModalOpen}
        maskedEmail={maskedEmail}
        code={emailCode}
        onCodeChange={setEmailCode}
        loading={loading}
        error={emailError}
        onSubmit={verifyEmailOtp}
      />
    </div>
  );
}
