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

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const parents = categories.filter((c) => !c.parent);
  const childrenOf = (id: string) =>
    categories.filter((c) => String(c.parent) === String(id));

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--bg)_88%,transparent)] backdrop-blur-md">
      <div className="hidden border-b border-[var(--line)] bg-[var(--bg-elevated)] sm:block">
        <div className="container-gb flex items-center justify-between gap-4 py-2 text-xs text-[var(--fg-muted)]">
          <p className="truncate">Call: {settings?.phone || "+91-98765-43210"}</p>
          <div className="flex shrink-0 gap-4">
            <Link href="/track-order" className="hover:text-[var(--accent)]">
              Track order
            </Link>
            <Link href="/deals" className="hover:text-[var(--accent)]">
              Deals
            </Link>
            <Link href="/contact" className="hidden hover:text-[var(--accent)] md:inline">
              Contact
            </Link>
          </div>
        </div>
      </div>

      <div className="container-gb flex items-center gap-3 py-3 sm:gap-4 sm:py-4">
        <button
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line)] lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link href="/" className="min-w-0 shrink">
          <span className="block truncate font-[family-name:var(--font-display)] text-xl tracking-wide text-[var(--fg)] sm:text-2xl md:text-3xl">
            Gaanbajana
          </span>
        </Link>

        <form action="/search" className="ml-auto hidden max-w-md flex-1 md:flex">
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

        <div className="ml-auto flex items-center gap-1 sm:gap-2 md:ml-0">
          <Link
            href={user ? "/account" : "/login"}
            aria-label="Account"
            className="hidden h-11 w-11 items-center justify-center rounded-full border border-transparent transition hover:border-[var(--line)] sm:flex"
          >
            <User className="h-5 w-5" />
          </Link>
          <Link
            href="/account/wishlist"
            aria-label="Wishlist"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-transparent transition hover:border-[var(--line)]"
          >
            <Heart className="h-5 w-5" />
          </Link>
          <Link
            href="/cart"
            className="relative flex h-11 w-11 items-center justify-center rounded-full border border-transparent transition hover:border-[var(--line)]"
            aria-label="Cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-bold text-[#1a120a]">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>

      <nav className="container-gb hidden gap-6 overflow-x-auto pb-3 text-sm lg:flex">
        {parents.slice(0, 8).map((p) => (
          <div key={p._id} className="group relative shrink-0">
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
        <div className="animate-drawer fixed inset-0 top-[57px] z-40 overflow-y-auto bg-[var(--bg)] lg:hidden">
          <div className="container-gb space-y-5 py-5 pb-28">
            <form action="/search" onSubmit={() => setOpen(false)}>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fg-muted)]" />
                <input
                  name="q"
                  placeholder="Search instruments…"
                  className="input pl-10"
                  defaultValue={q}
                />
              </div>
            </form>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/deals" className="btn btn-ghost" onClick={() => setOpen(false)}>
                Deals
              </Link>
              <Link
                href="/track-order"
                className="btn btn-ghost"
                onClick={() => setOpen(false)}
              >
                Track
              </Link>
            </div>
            <div className="space-y-4">
              {parents.map((p) => (
                <div key={p._id} className="border-b border-[var(--line)] pb-4">
                  <Link
                    href={`/collections/${p.slug}`}
                    className="block py-1 font-[family-name:var(--font-display)] text-xl"
                    onClick={() => setOpen(false)}
                  >
                    {p.name}
                  </Link>
                  <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-sm text-[var(--fg-muted)]">
                    {childrenOf(p._id).map((c) => (
                      <Link
                        key={c._id}
                        href={`/collections/${c.slug}`}
                        onClick={() => setOpen(false)}
                        className="py-1"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
