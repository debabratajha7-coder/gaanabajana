"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export function RegisterForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not register");
      return;
    }
    router.push("/account");
    router.refresh();
  }

  return (
    <div className="container-gb mx-auto max-w-md py-16">
      <h1 className="display text-4xl">Create account</h1>
      <p className="mt-2 text-[var(--fg-muted)]">
        Save addresses, track orders, and build your wishlist.
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
          <label className="field-label" htmlFor="name">
            Name
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
          <label className="field-label" htmlFor="phone">
            Phone
          </label>
          <input
            id="phone"
            className="input"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="Optional"
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
        {error && <p className="text-[var(--danger)]">{error}</p>}
        <button className="btn btn-primary w-full" type="submit">
          Create account
        </button>
      </form>
      <p className="mt-4 text-sm text-[var(--fg-muted)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--accent)]">
          Login
        </Link>
      </p>
    </div>
  );
}
