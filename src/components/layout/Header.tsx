"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Heart, Search, ShoppingBag, Menu, X, User } from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";
import { CartBadge } from "@/components/ui/CartBadge";
import { motion, AnimatePresence } from "motion/react";

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
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(72);
  const [q, setQ] = useState("");
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    document.body.toggleAttribute("data-menu-open", open);
    return () => {
      document.body.style.overflow = "";
      document.body.removeAttribute("data-menu-open");
    };
  }, [open]);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const measure = () => setHeaderHeight(el.getBoundingClientRect().height);
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const parents = categories.filter((c) => !c.parent);
  const childrenOf = (id: string) =>
    categories.filter((c) => String(c.parent) === String(id));

  function SearchField() {
    return (
      <div className="search-group">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fg-muted)]" />
        <input
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search instruments"
          className="input search-group-input pl-11"
          aria-label="Search instruments"
        />
        <button type="submit" className="search-group-btn" aria-label="Search">
          <Search className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--bg)_86%,transparent)] backdrop-blur-xl"
    >
      <div className="hidden border-b border-[var(--line)] sm:block">
        <div className="container-gb flex items-center justify-between gap-4 py-2 text-[11px] tracking-wide text-[var(--fg-muted)]">
          <p className="truncate">{settings?.phone || "+91-98765-43210"}</p>
          <div className="flex gap-5">
            <Link href="/track-order" className="transition hover:text-[var(--accent)]">
              Track
            </Link>
            <Link href="/deals" className="transition hover:text-[var(--accent)]">
              Deals
            </Link>
            <Link href="/contact" className="hidden transition hover:text-[var(--accent)] md:inline">
              Help
            </Link>
          </div>
        </div>
      </div>

      <div className="container-gb flex items-center gap-3 py-3.5 sm:gap-4">
        <button
          type="button"
          className="icon-btn lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-nav-drawer"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link href="/" className="min-w-0 shrink">
          <span className="display block truncate text-[1.35rem] text-[var(--fg)] sm:text-2xl md:text-[1.85rem]">
            Gaanbajana
          </span>
        </Link>

        <form action="/search" method="get" className="ml-auto hidden max-w-md flex-1 md:flex">
          <SearchField />
        </form>

        <div className="ml-auto flex items-center gap-0.5 md:ml-0 md:gap-1">
          <Link
            href={user ? "/account" : "/login"}
            aria-label="Account"
            className="icon-btn"
          >
            <User className="h-5 w-5" />
          </Link>
          <Link
            href="/account/wishlist"
            aria-label="Wishlist"
            className="icon-btn"
          >
            <Heart className="h-5 w-5" />
          </Link>
          <Link href="/cart" className="icon-btn relative" aria-label="Cart">
            <ShoppingBag className="h-5 w-5" />
            <CartBadge count={count} />
          </Link>
        </div>
      </div>

      <nav className="container-gb hidden border-t border-[var(--line)] lg:block">
        <div className="flex flex-wrap items-center gap-x-1 gap-y-0 py-0">
          {parents.slice(0, 8).map((p, i) => (
            <div key={p._id} className="group relative">
              <Link
                href={`/collections/${p.slug}`}
                className={`inline-flex items-center px-3.5 py-3 text-[13px] text-[var(--fg-muted)] transition hover:text-[var(--fg)] ${
                  i > 0 ? "border-l border-[var(--line)]" : ""
                }`}
              >
                {p.name}
              </Link>
              {childrenOf(p._id).length > 0 && (
                <div className="invisible absolute left-0 top-full z-40 min-w-[220px] border border-[var(--line)] bg-[var(--bg-elevated)] p-1 opacity-0 shadow-2xl transition group-hover:visible group-hover:opacity-100">
                  {childrenOf(p._id).map((c) => (
                    <Link
                      key={c._id}
                      href={`/collections/${c.slug}`}
                      className="block border-b border-[var(--line)] px-3 py-2.5 text-[13px] text-[var(--fg-muted)] last:border-b-0 hover:bg-[var(--bg-soft)] hover:text-[var(--fg)]"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ top: headerHeight }}
            className="fixed inset-x-0 bottom-0 z-[60] overflow-y-auto bg-[var(--bg)] lg:hidden"
          >
            <div className="container-gb space-y-6 py-6 pb-10">
              <form
                action="/search"
                method="get"
                onSubmit={() => setOpen(false)}
              >
                <SearchField />
              </form>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={user ? "/account" : "/login"}
                  className="btn btn-ghost"
                  onClick={() => setOpen(false)}
                >
                  {user ? "Account" : "Login"}
                </Link>
                <Link
                  href="/account/wishlist"
                  className="btn btn-ghost"
                  onClick={() => setOpen(false)}
                >
                  Wishlist
                </Link>
                <Link href="/deals" className="btn btn-ghost" onClick={() => setOpen(false)}>
                  Deals
                </Link>
                <Link
                  href="/track-order"
                  className="btn btn-ghost"
                  onClick={() => setOpen(false)}
                >
                  Track order
                </Link>
              </div>

              <div className="space-y-5">
                {parents.map((p) => (
                  <div key={p._id} className="border-b border-[var(--line)] pb-4">
                    <Link
                      href={`/collections/${p.slug}`}
                      className="display block py-1 text-xl"
                      onClick={() => setOpen(false)}
                    >
                      {p.name}
                    </Link>
                    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm text-[var(--fg-muted)]">
                      {childrenOf(p._id).map((c) => (
                        <Link
                          key={c._id}
                          href={`/collections/${c.slug}`}
                          onClick={() => setOpen(false)}
                          className="py-1.5"
                        >
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
