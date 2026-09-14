"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) router.push("/login");
        else setUser(d.user);
      });
  }, [router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (!user) return <div className="container-gb py-16">Loading…</div>;

  return (
    <div className="container-gb py-12">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">Hello, {user.name}</h1>
      <p className="mt-2 text-[var(--fg-muted)]">{user.email}</p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["/account/orders", "Orders"],
          ["/account/addresses", "Addresses"],
          ["/account/wishlist", "Wishlist"],
          ["/account/reviews", "My reviews"],
          ...(user.role === "admin" ? [["/admin", "Admin panel"]] : []),
        ].map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-5 transition hover:border-[var(--accent)]"
          >
            {label}
          </Link>
        ))}
      </div>
      <button type="button" className="btn btn-ghost mt-8" onClick={logout}>
        Log out
      </button>
    </div>
  );
}
