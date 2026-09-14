"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
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
      <h1 className="font-[family-name:var(--font-display)] text-4xl">Create account</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {(["name", "email", "phone", "password"] as const).map((key) => (
          <input
            key={key}
            className="input"
            type={key === "password" ? "password" : key === "email" ? "email" : "text"}
            placeholder={key[0].toUpperCase() + key.slice(1)}
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            required={key !== "phone"}
          />
        ))}
        {error && <p className="text-[var(--danger)]">{error}</p>}
        <button className="btn btn-primary w-full" type="submit">
          Register
        </button>
      </form>
      <p className="mt-4 text-sm text-[var(--fg-muted)]">
        Already have an account? <Link href="/login" className="text-[var(--accent)]">Login</Link>
      </p>
    </div>
  );
}
