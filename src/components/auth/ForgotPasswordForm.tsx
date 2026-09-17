"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OtpInput } from "@/components/auth/OtpInput";

type Step = "identify" | "code" | "done";

export function ForgotPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preset = useMemo(
    () => searchParams.get("identifier") || "",
    [searchParams]
  );

  const [step, setStep] = useState<Step>("identify");
  const [identifier, setIdentifier] = useState(preset);
  const [channel, setChannel] = useState<"email" | "phone">("email");
  const [challengeToken, setChallengeToken] = useState("");
  const [maskedTarget, setMaskedTarget] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function requestCode(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, channel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send code");
      if (!data.challengeToken) {
        throw new Error(
          data.message ||
            "If that account exists, check your inbox or try the other channel."
        );
      }
      setChallengeToken(data.challengeToken);
      setMaskedTarget(data.maskedTarget || "");
      setChannel(data.channel || channel);
      setCode("");
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send code");
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeToken, code, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not reset password");
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-gb mx-auto max-w-md py-12 md:py-16">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--fg-muted)]">
        Account recovery
      </p>
      <h1 className="display mt-2 text-4xl md:text-5xl">
        {step === "done" ? "Password updated" : "Forgot password"}
      </h1>
      <p className="mt-2 text-[var(--fg-muted)]">
        {step === "identify" &&
          "We’ll send a one-time code to reset your password."}
        {step === "code" &&
          `Enter the code sent to ${maskedTarget}, then choose a new password.`}
        {step === "done" && "You can sign in with your new password."}
      </p>

      {step === "identify" && (
        <form onSubmit={requestCode} className="mt-8 space-y-4">
          <div>
            <label className="field-label" htmlFor="identifier">
              Phone number or email
            </label>
            <input
              id="identifier"
              className="input"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Email or 10-digit mobile"
              required
            />
          </div>
          <div>
            <p className="field-label">Send code via</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className={`btn flex-1 ${channel === "email" ? "btn-primary" : "btn-ghost border border-[var(--line)]"}`}
                onClick={() => setChannel("email")}
              >
                Email
              </button>
              <button
                type="button"
                className={`btn flex-1 ${channel === "phone" ? "btn-primary" : "btn-ghost border border-[var(--line)]"}`}
                onClick={() => setChannel("phone")}
              >
                Phone SMS
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <button className="btn btn-primary w-full" type="submit" disabled={loading}>
            {loading ? "Sending…" : "Send reset code"}
          </button>
          <Link href="/login" className="btn btn-ghost w-full text-center">
            Back to login
          </Link>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={resetPassword} className="mt-8 space-y-5">
          <OtpInput value={code} onChange={setCode} />
          <div>
            <label className="field-label" htmlFor="newPassword">
              New password
            </label>
            <input
              id="newPassword"
              className="input"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="confirmPassword">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              className="input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <button
            className="btn btn-primary w-full"
            type="submit"
            disabled={loading || code.length < 6}
          >
            {loading ? "Saving…" : "Reset password"}
          </button>
          <button
            type="button"
            className="btn btn-ghost w-full"
            onClick={() => {
              setStep("identify");
              setError("");
              setCode("");
            }}
          >
            Use a different email or phone
          </button>
        </form>
      )}

      {step === "done" && (
        <div className="mt-8 space-y-3">
          <button
            type="button"
            className="btn btn-primary w-full"
            onClick={() => router.push("/login")}
          >
            Go to login
          </button>
        </div>
      )}
    </div>
  );
}
