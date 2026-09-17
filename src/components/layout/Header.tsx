"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import {
  Heart,
  Search,
  ShoppingBag,
  Menu,
  X,
  User,
  Package,
  Tag,
  LifeBuoy,
  MapPin,
  BookOpen,
  Info,
  FileText,
} from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";
import { CartBadge } from "@/components/ui/CartBadge";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { brandWordmark } from "@/lib/brand";

type Cat = { _id: string; name: string; slug: string; parent?: string | null };
type Settings = { phone?: string; storeName?: string; email?: string };

export function Header({
  categories = [],
  settings,
}: {
  categories?: Cat[];
  settings?: Settings;
}) {
  const { count } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const reduce = useReducedMotion();
  const headerRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [q, setQ] = useState("");
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
  const wordmark = brandWordmark(settings?.storeName);

  const close = () => setOpen(false);

  function goSearch(e?: FormEvent) {
    e?.preventDefault();
    const query = q.trim();
    close();
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
  }

  const menu =
    mounted &&
    createPortal(
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[200] lg:hidden" role="presentation">
            <motion.button
              type="button"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/50"
              onClick={close}
            />

            <motion.aside
              id="mobile-nav-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
              initial={reduce ? { opacity: 0 } : { x: "-100%" }}
              animate={reduce ? { opacity: 1 } : { x: 0 }}
              exit={reduce ? { opacity: 0 } : { x: "-100%" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-y-0 left-0 flex w-[min(100vw-3.25rem,19.5rem)] max-w-full flex-col border-r border-[var(--line)] bg-[var(--bg)] shadow-[8px_0_32px_rgba(0,0,0,0.35)]"
            >
              <div className="flex items-center justify-between gap-2 border-b border-[var(--line)] px-3.5 py-3">
                <Link
                  href="/"
                  className="display truncate text-lg"
                  onClick={close}
                >
                  {wordmark}
                </Link>
                <button
                  type="button"
                  className="icon-btn shrink-0"
                  onClick={close}
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain px-3.5 py-4 pb-[calc(1.5rem+var(--safe-bottom))]">
                <form onSubmit={goSearch} className="mb-6">
                  <div className="search-group">
                    <input
                      name="q"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Search"
                      className="input search-group-input px-3 text-sm"
                      aria-label="Search instruments"
                    />
                    <button
                      type="submit"
                      className="search-group-btn"
                      aria-label="Search"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                  </div>
                </form>

                <section className="mb-6">
                  <p className="eyebrow mb-2.5">Account</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {user ? (
                      <>
                        <Link
                          href="/account"
                          className="btn btn-ghost px-2 text-xs"
                          onClick={close}
                        >
                          <User className="h-3.5 w-3.5" /> Account
                        </Link>
                        <Link
                          href="/account/orders"
                          className="btn btn-ghost px-2 text-xs"
                          onClick={close}
                        >
                          <Package className="h-3.5 w-3.5" /> Orders
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          className="btn btn-primary px-2 text-xs"
                          onClick={close}
                        >
                          Login
                        </Link>
                        <Link
                          href="/register"
                          className="btn btn-ghost px-2 text-xs"
                          onClick={close}
                        >
                          Register
                        </Link>
                      </>
                    )}
                    <Link
                      href="/account/wishlist"
                      className="btn btn-ghost px-2 text-xs"
                      onClick={close}
                    >
                      <Heart className="h-3.5 w-3.5" /> Wishlist
                    </Link>
                    <Link
                      href="/cart"
                      className="btn btn-ghost px-2 text-xs"
                      onClick={close}
                    >
                      <ShoppingBag className="h-3.5 w-3.5" /> Cart
                      {count > 0 && (
                        <span className="ml-0.5 text-[var(--accent)]">
                          ({count})
                        </span>
                      )}
                    </Link>
                  </div>
                </section>

                <section className="mb-6">
                  <p className="eyebrow mb-2.5">Shop</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Link
                      href="/deals"
                      className="btn btn-ghost px-2 text-xs"
                      onClick={close}
                    >
                      <Tag className="h-3.5 w-3.5" /> Deals
                    </Link>
                    <Link
                      href="/deals/sale"
                      className="btn btn-ghost px-2 text-xs"
                      onClick={close}
                    >
                      Sale
                    </Link>
                    <Link
                      href="/deals/open-box"
                      className="btn btn-ghost px-2 text-xs"
                      onClick={close}
                    >
                      Open box
                    </Link>
                    <Link
                      href="/blog"
                      className="btn btn-ghost px-2 text-xs"
                      onClick={close}
                    >
                      <BookOpen className="h-3.5 w-3.5" /> Blog
                    </Link>
                  </div>
                </section>

                <section className="mb-6">
                  <p className="eyebrow mb-2.5">Categories</p>
                  <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
                    {parents.map((p) => {
                      const kids = childrenOf(p._id);
                      const isOpen = expanded === p._id;
                      return (
                        <div key={p._id}>
                          <div className="flex items-center gap-1">
                            <Link
                              href={`/collections/${p.slug}`}
                              className="display min-w-0 flex-1 py-3 text-[1.05rem] leading-tight"
                              onClick={close}
                            >
                              {p.name}
                            </Link>
                            {kids.length > 0 && (
                              <button
                                type="button"
                                className="icon-btn h-9 w-9 shrink-0"
                                aria-expanded={isOpen}
                                aria-label={`${isOpen ? "Hide" : "Show"} ${p.name} types`}
                                onClick={() =>
                                  setExpanded((cur) =>
                                    cur === p._id ? null : p._id
                                  )
                                }
                              >
                                <span className="text-base leading-none">
                                  {isOpen ? "−" : "+"}
                                </span>
                              </button>
                            )}
                          </div>
                          {kids.length > 0 && isOpen && (
                            <div className="grid grid-cols-1 gap-0.5 pb-3 pl-1 text-sm text-[var(--fg-muted)]">
                              {kids.map((c) => (
                                <Link
                                  key={c._id}
                                  href={`/collections/${c.slug}`}
                                  onClick={close}
                                  className="py-1.5"
                                >
                                  {c.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {parents.length === 0 && (
                      <p className="py-3 text-sm text-[var(--fg-muted)]">
                        Categories will appear here once added in admin.
                      </p>
                    )}
                  </div>
                </section>

                <section className="mb-6">
                  <p className="eyebrow mb-2.5">Help & info</p>
                  <div className="grid gap-0">
                    {[
                      { href: "/track-order", label: "Track order", icon: MapPin },
                      { href: "/contact", label: "Contact", icon: LifeBuoy },
                      { href: "/faqs", label: "FAQs", icon: LifeBuoy },
                      { href: "/about", label: "About", icon: Info },
                      { href: "/stores", label: "Stores", icon: MapPin },
                      {
                        href: "/policies/shipping",
                        label: "Shipping Policy",
                        icon: FileText,
                      },
                      {
                        href: "/policies/returns",
                        label: "Refund & Cancellation",
                        icon: FileText,
                      },
                      {
                        href: "/policies/warranty",
                        label: "Warranty",
                        icon: FileText,
                      },
                      {
                        href: "/policies/privacy",
                        label: "Privacy Policy",
                        icon: FileText,
                      },
                      {
                        href: "/policies/terms",
                        label: "Terms & Conditions",
                        icon: FileText,
                      },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-2.5 border-b border-[var(--line)] py-3 text-sm last:border-b-0"
                        onClick={close}
                      >
                        <item.icon className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </section>

                {(settings?.phone || settings?.email) && (
                  <section className="border-t border-[var(--line)] pt-4 text-xs text-[var(--fg-muted)]">
                    {settings.phone && <p>{settings.phone}</p>}
                    {settings.email && <p className="mt-1">{settings.email}</p>}
                  </section>
                )}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>,
      document.body
    );

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--bg)_86%,transparent)] backdrop-blur-xl"
    >
      <div className="hidden border-b border-[var(--line)] sm:block">
        <div className="container-gb flex items-center justify-between gap-4 py-2 text-[11px] tracking-wide text-[var(--fg-muted)]">
          <p className="truncate">
            {settings?.phone || "+91 9563754563, +91 7679586321"}
          </p>
          <div className="flex gap-5">
            <Link href="/track-order" className="transition hover:text-[var(--accent)]">
              Track
            </Link>
            <Link href="/deals" className="transition hover:text-[var(--accent)]">
              Deals
            </Link>
            <Link
              href="/contact"
              className="hidden transition hover:text-[var(--accent)] md:inline"
            >
              Help
            </Link>
          </div>
        </div>
      </div>

      <div className="container-gb flex items-center gap-3 py-3.5 sm:gap-4">
        <button
          type="button"
          className="icon-btn relative z-[1] lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-nav-drawer"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link href="/" className="min-w-0 shrink">
          <span
            className="display block truncate text-[1.35rem] text-[var(--fg)] sm:text-2xl md:text-[1.85rem]"
            suppressHydrationWarning
          >
            {wordmark}
          </span>
        </Link>

        <form onSubmit={goSearch} className="ml-auto hidden max-w-md flex-1 md:flex">
          <div className="search-group">
            <input
              name="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search instruments"
              className="input search-group-input px-4"
              aria-label="Search instruments"
            />
            <button type="submit" className="search-group-btn" aria-label="Search">
              <Search className="h-4 w-4" />
            </button>
          </div>
        </form>

        <div className="ml-auto flex items-center gap-0.5 md:ml-0 md:gap-1">
          <Link
            href={user ? "/account" : "/login"}
            aria-label="Account"
            className="icon-btn"
          >
            <User className="h-5 w-5" />
          </Link>
          <Link href="/account/wishlist" aria-label="Wishlist" className="icon-btn">
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

      {menu}
    </header>
  );
}
