"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Search, ShoppingBag, Menu, X, User } from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";

type Cat = { _id: string; name: string; slug: string; parent?: string | null };
type Settings = { phone?: string; storeName?: string };

export function Header({
  categories = [],
  settings,
}: {
  categories?: Cat[];
  settings?: Settings;
}) {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => undefined);
  }, []);

  const parents = categories.filter((c) => !c.parent);
  const childrenOf = (id: string) =>
    categories.filter((c) => String(c.parent) === String(id));

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--bg)_88%,transparent)] backdrop-blur-md">
      <div className="border-b border-[var(--line)] bg-[var(--bg-elevated)]">
        <div className="container-gb flex items-center justify-between gap-4 py-2 text-xs text-[var(--fg-muted)]">
          <p>Call: {settings?.phone || "+91-98765-43210"}</p>
          <div className="flex gap-4">
            <Link href="/track-order" className="hover:text-[var(--accent)]">
              Track order
            </Link>
            <Link href="/deals" className="hover:text-[var(--accent)]">
              Deals
            </Link>
            <Link href="/contact" className="hover:text-[var(--accent)]">
              Contact
            </Link>
          </div>
        </div>
      </div>

      <div className="container-gb flex items-center gap-4 py-4">
        <button
          className="lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X /> : <Menu />}
        </button>

        <Link href="/" className="shrink-0">
          <span className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-[var(--fg)] md:text-3xl">
            Gaanbajana
          </span>
        </Link>

        <form
          action="/search"
          className="ml-auto hidden max-w-md flex-1 md:flex"
        >
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fg-muted)]" />
            <input
              name="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search instruments…"
              className="input pl-10"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-3 md:ml-0">
          <Link href={user ? "/account" : "/login"} aria-label="Account">
            <User className="h-5 w-5" />
          </Link>
          <Link href="/account/wishlist" aria-label="Wishlist">
            <Heart className="h-5 w-5" />
          </Link>
          <Link href="/cart" className="relative" aria-label="Cart">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-[#1a120a]">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>

      <nav className="container-gb hidden gap-6 pb-3 text-sm lg:flex">
        {parents.slice(0, 8).map((p) => (
          <div key={p._id} className="group relative">
            <Link
              href={`/collections/${p.slug}`}
              className="text-[var(--fg-muted)] transition hover:text-[var(--accent)]"
            >
              {p.name}
            </Link>
            {childrenOf(p._id).length > 0 && (
              <div className="invisible absolute left-0 top-full z-40 min-w-[220px] rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] p-3 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100">
                {childrenOf(p._id).map((c) => (
                  <Link
                    key={c._id}
                    href={`/collections/${c.slug}`}
                    className="block rounded-lg px-3 py-2 text-[var(--fg-muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--fg)]"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {open && (
        <div className="border-t border-[var(--line)] bg-[var(--bg)] px-4 py-4 lg:hidden">
          <form action="/search" className="mb-4">
            <input
              name="q"
              placeholder="Search…"
              className="input"
              defaultValue={q}
            />
          </form>
          <div className="grid gap-2">
            {parents.map((p) => (
              <div key={p._id}>
                <Link
                  href={`/collections/${p.slug}`}
                  className="block py-2 font-medium"
                  onClick={() => setOpen(false)}
                >
                  {p.name}
                </Link>
                <div className="ml-3 grid gap-1 text-sm text-[var(--fg-muted)]">
                  {childrenOf(p._id).map((c) => (
                    <Link
                      key={c._id}
                      href={`/collections/${c.slug}`}
                      onClick={() => setOpen(false)}
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
