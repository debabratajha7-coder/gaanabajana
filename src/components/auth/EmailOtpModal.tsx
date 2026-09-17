"use client";

import { FormEvent, useEffect } from "react";
import { OtpInput } from "@/components/auth/OtpInput";

type EmailOtpModalProps = {
  open: boolean;
  maskedEmail: string;
  code: string;
  onCodeChange: (value: string) => void;
  loading: boolean;
  error: string;
  onSubmit: (e: FormEvent) => void;
  onClose?: () => void;
};

export function EmailOtpModal({
  open,
  maskedEmail,
  code,
  onCodeChange,
  loading,
  error,
  onSubmit,
  onClose,
}: EmailOtpModalProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-otp-title"
    >
      <div className="w-full max-w-md border border-[var(--line)] bg-[var(--bg-elevated)] p-6 shadow-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--fg-muted)]">
          Almost there
        </p>
        <h2 id="email-otp-title" className="display mt-2 text-3xl">
          Verify your email
        </h2>
        <p className="mt-2 text-sm text-[var(--fg-muted)]">
          We’ve sent a one-time code to{" "}
          <span className="font-medium text-[var(--fg)]">{maskedEmail}</span>. Enter
          it below to finish.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-5">
          <OtpInput value={code} onChange={onCodeChange} />
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <button
            className="btn btn-primary w-full"
            type="submit"
            disabled={loading || code.length < 6}
          >
            {loading ? "Verifying…" : "Verify email"}
          </button>
          {onClose && (
            <button
              type="button"
              className="btn btn-ghost w-full"
              onClick={onClose}
              disabled={loading}
            >
              Close
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
