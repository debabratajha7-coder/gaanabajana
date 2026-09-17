"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OtpInput } from "@/components/auth/OtpInput";

const REASONS = [
  { value: "not_using", label: "I no longer use Gaanbajna" },
  { value: "too_many_emails", label: "I get too many emails" },
  { value: "privacy", label: "I want to protect my privacy" },
  { value: "better_alternative", label: "I found another store" },
  { value: "other", label: "Something else" },
] as const;

type Reason = (typeof REASONS)[number]["value"];
type Step = "reason" | "consequences" | "confirm";
type VerifyMode = "password" | "email" | "phone";

export function DeleteAccountControl() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("reason");
  const [reason, setReason] = useState<Reason | "">("");
  const [feedback, setFeedback] = useState("");
  const [verifyMode, setVerifyMode] = useState<VerifyMode>("password");
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [challengeToken, setChallengeToken] = useState("");
  const [maskedTarget, setMaskedTarget] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function close() {
    if (loading) return;
    setOpen(false);
    setStep("reason");
    setReason("");
    setFeedback("");
    setVerifyMode("password");
    setPassword("");
    setConfirmText("");
    setOtpSent(false);
    setChallengeToken("");
    setMaskedTarget("");
    setOtpCode("");
    setError("");
  }

  function setMode(mode: VerifyMode) {
    setVerifyMode(mode);
    setError("");
    setPassword("");
    setOtpSent(false);
    setChallengeToken("");
    setMaskedTarget("");
    setOtpCode("");
  }

  async function sendDeleteOtp(channel: "email" | "phone") {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/account/delete/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send code");
      setChallengeToken(data.challengeToken);
      setMaskedTarget(data.maskedTarget || "");
      setOtpSent(true);
      setOtpCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send code");
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!reason) {
      setError("Please choose a reason");
      setStep("reason");
      return;
    }
    if (confirmText.trim().toUpperCase() !== "DELETE") {
      setError("Type DELETE in capital letters to confirm");
      return;
    }
    if (verifyMode === "password") {
      if (!password.trim()) {
        setError("Enter your password");
        return;
      }
    } else {
      if (!otpSent || !challengeToken) {
        setError("Send a verification code first");
        return;
      }
      if (otpCode.length < 6) {
        setError("Enter the 6-digit code");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          feedback: feedback.trim() || undefined,
          confirmText: "DELETE",
          ...(verifyMode === "password"
            ? { password }
            : { challengeToken, code: otpCode }),
        }),
      });
      let data: { error?: string } = {};
      try {
        data = await res.json();
      } catch {
        /* empty */
      }
      if (!res.ok) throw new Error(data.error || "Could not delete account");
      setOpen(false);
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[11px] tracking-wide text-[var(--fg-muted)]/55 transition hover:text-[var(--fg-muted)]"
      >
        Delete account
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto border border-[var(--line)] bg-[var(--bg-elevated)] p-6 shadow-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--fg-muted)]">
              Account
            </p>
            <h2 id="delete-account-title" className="display mt-2 text-3xl">
              {step === "reason" && "Before you go"}
              {step === "consequences" && "What this means"}
              {step === "confirm" && "Confirm deletion"}
            </h2>

            {step === "reason" && (
              <div className="mt-5 space-y-4">
                <p className="text-sm text-[var(--fg-muted)]">
                  We’re sorry to see you leave. Tell us why you’re deleting your
                  account — it helps us improve.
                </p>
                <fieldset className="space-y-2">
                  <legend className="sr-only">Reason</legend>
                  {REASONS.map((r) => (
                    <label
                      key={r.value}
                      className="flex cursor-pointer items-start gap-3 border border-[var(--line)] px-3 py-2.5 text-sm transition hover:border-[var(--fg-muted)]"
                    >
                      <input
                        type="radio"
                        name="delete-reason"
                        className="mt-1"
                        checked={reason === r.value}
                        onChange={() => setReason(r.value)}
                      />
                      <span>{r.label}</span>
                    </label>
                  ))}
                </fieldset>
                <div>
                  <label className="field-label" htmlFor="delete-feedback">
                    Anything else? (optional)
                  </label>
                  <textarea
                    id="delete-feedback"
                    className="input min-h-[88px] resize-y"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    maxLength={1000}
                    placeholder="Optional feedback"
                  />
                </div>
                {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
                <button
                  type="button"
                  className="btn btn-primary w-full"
                  disabled={!reason}
                  onClick={() => {
                    setError("");
                    setStep("consequences");
                  }}
                >
                  Continue
                </button>
                <button type="button" className="btn btn-ghost w-full" onClick={close}>
                  Keep my account
                </button>
              </div>
            )}

            {step === "consequences" && (
              <div className="mt-5 space-y-4">
                <p className="text-sm text-[var(--fg-muted)]">
                  Deleting your account permanently removes your personal data from
                  Gaanbajna.
                </p>
                <ul className="space-y-2 text-sm text-[var(--fg)]">
                  <li className="border-l-2 border-[var(--line)] pl-3">
                    Profile, phone, and saved addresses will be deleted
                  </li>
                  <li className="border-l-2 border-[var(--line)] pl-3">
                    Wishlist and your product reviews will be removed
                  </li>
                  <li className="border-l-2 border-[var(--line)] pl-3">
                    You’ll need a new account to shop with this email or phone again
                  </li>
                  <li className="border-l-2 border-[var(--line)] pl-3 text-[var(--fg-muted)]">
                    Past orders may be kept for tax and legal records, without your
                    login
                  </li>
                </ul>
                <button
                  type="button"
                  className="btn btn-primary w-full"
                  onClick={() => setStep("confirm")}
                >
                  I understand, continue
                </button>
                <button
                  type="button"
                  className="btn btn-ghost w-full"
                  onClick={() => setStep("reason")}
                >
                  Back
                </button>
                <button type="button" className="btn btn-ghost w-full" onClick={close}>
                  Keep my account
                </button>
              </div>
            )}

            {step === "confirm" && (
              <form onSubmit={onDelete} className="mt-5 space-y-4">
                <p className="text-sm text-[var(--fg-muted)]">
                  Confirm it’s you, then type{" "}
                  <span className="font-semibold text-[var(--fg)]">DELETE</span>.
                </p>

                <div>
                  <p className="field-label">Verify with</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {(
                      [
                        ["password", "Password"],
                        ["email", "Email OTP"],
                        ["phone", "Phone OTP"],
                      ] as const
                    ).map(([mode, label]) => (
                      <button
                        key={mode}
                        type="button"
                        className={`btn px-2 text-xs ${
                          verifyMode === mode
                            ? "btn-primary"
                            : "btn-ghost border border-[var(--line)]"
                        }`}
                        onClick={() => setMode(mode)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {verifyMode === "password" ? (
                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <label className="field-label mb-0" htmlFor="delete-password">
                        Password
                      </label>
                      <Link
                        href="/forgot-password"
                        className="text-xs text-[var(--fg-muted)] hover:text-[var(--accent)]"
                        onClick={close}
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <input
                      id="delete-password"
                      className="input"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {!otpSent ? (
                      <button
                        type="button"
                        className="btn btn-ghost w-full border border-[var(--line)]"
                        disabled={loading}
                        onClick={() =>
                          sendDeleteOtp(verifyMode === "email" ? "email" : "phone")
                        }
                      >
                        {loading
                          ? "Sending…"
                          : `Send ${verifyMode === "email" ? "email" : "SMS"} code`}
                      </button>
                    ) : (
                      <>
                        <p className="text-xs text-[var(--fg-muted)]">
                          Code sent to {maskedTarget}
                        </p>
                        <OtpInput value={otpCode} onChange={setOtpCode} />
                        <button
                          type="button"
                          className="text-xs text-[var(--fg-muted)] hover:text-[var(--accent)]"
                          disabled={loading}
                          onClick={() =>
                            sendDeleteOtp(verifyMode === "email" ? "email" : "phone")
                          }
                        >
                          Resend code
                        </button>
                      </>
                    )}
                  </div>
                )}

                <div>
                  <label className="field-label" htmlFor="delete-confirm">
                    Type DELETE
                  </label>
                  <input
                    id="delete-confirm"
                    className="input"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="DELETE"
                    required
                  />
                </div>
                {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
                <button
                  type="submit"
                  className="btn w-full border border-[var(--danger)]/40 bg-transparent text-sm text-[var(--danger)] hover:bg-[var(--danger)]/10"
                  disabled={loading}
                >
                  {loading ? "Deleting…" : "Permanently delete my account"}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost w-full"
                  disabled={loading}
                  onClick={() => setStep("consequences")}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="btn btn-ghost w-full"
                  disabled={loading}
                  onClick={close}
                >
                  Keep my account
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
