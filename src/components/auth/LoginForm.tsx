"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { OtpInput } from "@/components/auth/OtpInput";
import { EmailOtpModal } from "@/components/auth/EmailOtpModal";

const errorCopy: Record<string, string> = {
  google_not_configured: "Google sign-in is not configured yet.",
  invalid_oauth_state: "Google sign-in expired. Try again.",
  google_token_failed: "Google could not verify the login.",
  google_profile_failed: "Could not load your Google profile.",
  google_email_required: "A verified Google email is required.",
  google_failed: "Google sign-in failed. Try again.",
  access_denied: "Google sign-in was cancelled.",
};

type Step = "password" | "choose" | "otp";
type OtpChannel = "email" | "phone";

type Channels = {
  email?: { masked: string };
  phone?: { masked: string };
};

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("password");
  const [pendingToken, setPendingToken] = useState("");
  const [channels, setChannels] = useState<Channels>({});
  const [otpChannel, setOtpChannel] = useState<OtpChannel | null>(null);
  const [challengeToken, setChallengeToken] = useState("");
  const [maskedTarget, setMaskedTarget] = useState("");
  const [code, setCode] = useState("");
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailChallengeToken, setEmailChallengeToken] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [emailError, setEmailError] = useState("");

  const oauthError = useMemo(() => {
    const err = searchParams.get("error");
    if (!err) return "";
    return errorCopy[err] || "Sign-in failed. Try again.";
  }, [searchParams]);

  function resetToPassword() {
    setStep("password");
    setPendingToken("");
    setChannels({});
    setOtpChannel(null);
    setChallengeToken("");
    setMaskedTarget("");
    setCode("");
    setEmailModalOpen(false);
    setEmailChallengeToken("");
    setMaskedEmail("");
    setEmailCode("");
    setEmailError("");
    setError("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      if (data.requiresOtpChoice) {
        setPendingToken(data.pendingToken);
        setChannels(data.channels || {});
        setStep("choose");
        setCode("");
        return;
      }

      if (data.requiresEmailOtp) {
        setEmailChallengeToken(data.emailChallengeToken);
        setMaskedEmail(data.maskedEmail || "your email");
        setEmailCode("");
        setEmailError("");
        setEmailModalOpen(true);
        return;
      }

      router.push(data.user?.role === "admin" ? "/admin" : "/account");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function sendChannelOtp(channel: OtpChannel) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingToken, channel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send code");
      setOtpChannel(channel);
      setChallengeToken(data.challengeToken);
      setMaskedTarget(
        data.maskedTarget || (channel === "email" ? "your email" : "your phone")
      );
      setCode("");
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send code");
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyAdminOtp(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeToken, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid code");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyEmailOtp(e: FormEvent) {
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
      router.push(data.user?.role === "admin" ? "/admin" : "/account");
      router.refresh();
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  const title =
    step === "choose"
      ? "Choose verification"
      : step === "otp"
        ? "Verify it’s you"
        : "Login";

  const subtitle =
    step === "choose"
      ? "Send a one-time code by email or SMS to finish signing in."
      : step === "otp"
        ? `Enter the code sent to ${maskedTarget}.`
        : "Access orders, wishlist, and saved addresses.";

  return (
    <div className="container-gb mx-auto max-w-md py-12 md:py-16">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--fg-muted)]">
        Welcome back
      </p>
      <h1 className="display mt-2 text-4xl md:text-5xl">{title}</h1>
      <p className="mt-2 text-[var(--fg-muted)]">{subtitle}</p>

      {step === "password" && (
        <>
          <div className="mt-8 space-y-4">
            <GoogleSignInButton enabled={googleEnabled} />
            {googleEnabled && (
              <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-[var(--fg-muted)]">
                <span className="h-px flex-1 bg-[var(--line)]" />
                or
                <span className="h-px flex-1 bg-[var(--line)]" />
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <div>
              <label className="field-label" htmlFor="identifier">
                Phone number or email
              </label>
              <input
                id="identifier"
                className="input"
                type="text"
                inputMode="email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                placeholder="Email or 10-digit mobile"
                required
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label className="field-label mb-0" htmlFor="password">
                  Password
                </label>
                <Link
                  href={`/forgot-password${identifier.trim() ? `?identifier=${encodeURIComponent(identifier.trim())}` : ""}`}
                  className="text-xs text-[var(--fg-muted)] hover:text-[var(--accent)]"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            {(error || oauthError) && (
              <p className="text-sm text-[var(--danger)]">{error || oauthError}</p>
            )}
            <button className="btn btn-primary w-full" type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </>
      )}

      {step === "choose" && (
        <div className="mt-8 space-y-3">
          {channels.email && (
            <button
              type="button"
              className="btn btn-primary w-full"
              disabled={loading}
              onClick={() => sendChannelOtp("email")}
            >
              {loading ? "Sending…" : `Email OTP · ${channels.email.masked}`}
            </button>
          )}
          {channels.phone && (
            <button
              type="button"
              className="btn btn-ghost w-full border border-[var(--line)]"
              disabled={loading}
              onClick={() => sendChannelOtp("phone")}
            >
              {loading ? "Sending…" : `Phone OTP · ${channels.phone.masked}`}
            </button>
          )}
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <button type="button" className="btn btn-ghost w-full" onClick={resetToPassword}>
            Back to password
          </button>
        </div>
      )}

      {step === "otp" && (
        <form onSubmit={onVerifyAdminOtp} className="mt-8 space-y-5">
          <OtpInput value={code} onChange={setCode} />
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <button
            className="btn btn-primary w-full"
            type="submit"
            disabled={loading || code.length < 6}
          >
            {loading ? "Verifying…" : "Verify & continue"}
          </button>
          <button
            type="button"
            className="btn btn-ghost w-full"
            disabled={loading}
            onClick={() => {
              setStep("choose");
              setCode("");
              setError("");
              setChallengeToken("");
            }}
          >
            Choose another method
          </button>
          <button type="button" className="btn btn-ghost w-full" onClick={resetToPassword}>
            Back to password
          </button>
        </form>
      )}

      {step === "password" && (
        <p className="mt-6 text-sm text-[var(--fg-muted)]">
          New here?{" "}
          <Link href="/register" className="text-[var(--accent)]">
            Create account
          </Link>
        </p>
      )}

      <EmailOtpModal
        open={emailModalOpen}
        maskedEmail={maskedEmail}
        code={emailCode}
        onCodeChange={setEmailCode}
        loading={loading}
        error={emailError}
        onSubmit={onVerifyEmailOtp}
        onClose={resetToPassword}
      />
    </div>
  );
}
