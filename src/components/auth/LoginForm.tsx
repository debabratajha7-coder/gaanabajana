"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

const errorCopy: Record<string, string> = {
  google_not_configured: "Google sign-in is not configured yet.",
  invalid_oauth_state: "Google sign-in expired. Try again.",
  google_token_failed: "Google could not verify the login.",
  google_profile_failed: "Could not load your Google profile.",
  google_email_required: "A verified Google email is required.",
  google_failed: "Google sign-in failed. Try again.",
  access_denied: "Google sign-in was cancelled.",
};

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const oauthError = useMemo(() => {
    const code = searchParams.get("error");
    if (!code) return "";
    return errorCopy[code] || "Sign-in failed. Try again.";
  }, [searchParams]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Login failed");
      return;
    }
    router.push(data.user?.role === "admin" ? "/admin" : "/account");
    router.refresh();
  }

  return (
    <div className="container-gb mx-auto max-w-md py-16">
      <h1 className="display text-4xl">Login</h1>
      <p className="mt-2 text-[var(--fg-muted)]">
        Access orders, wishlist, and saved addresses.
      </p>

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
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        {(error || oauthError) && (
          <p className="text-[var(--danger)]">{error || oauthError}</p>
        )}
        <button className="btn btn-primary w-full" type="submit">
          Sign in
        </button>
      </form>
      <p className="mt-4 text-sm text-[var(--fg-muted)]">
        New here?{" "}
        <Link href="/register" className="text-[var(--accent)]">
          Create account
        </Link>
      </p>
    </div>
  );
}
