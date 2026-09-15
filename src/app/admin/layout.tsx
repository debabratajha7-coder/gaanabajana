"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  LayoutGrid,
  Tag,
  Palette,
  Newspaper,
  Star,
  Images,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const primary = [
  { href: "/admin", label: "Home", icon: LayoutDashboard },
  { href: "/admin/products", label: "Add a product", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/shop-by-category", label: "Shop by category", icon: LayoutGrid },
  { href: "/admin/brands", label: "Brands", icon: Tag },
  { href: "/admin/website", label: "Site", icon: Palette },
];

const more = [
  { href: "/admin/blog", label: "Blog posts", icon: Newspaper },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/media", label: "All photos", icon: Images },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ok, setOk] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.user?.role !== "admin") router.replace("/login");
        else setOk(true);
      })
      .catch(() => {
        if (!cancelled) router.replace("/login");
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (more.some((m) => isActive(pathname, m.href))) setMoreOpen(true);
  }, [pathname]);

  if (!ok) {
    return <div className="container-gb py-16">Checking admin access…</div>;
  }

  const chips = [...primary, ...more];

  return (
    <div className="admin-shell -mt-0 min-h-[70vh] border-t border-[var(--line)] bg-[var(--bg)] text-[var(--fg)]">
      <div className="container-gb py-6 lg:grid lg:grid-cols-[250px_1fr] lg:gap-10 lg:py-8">
        <nav className="mb-6 flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {chips.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "shrink-0 border px-3 py-2 text-xs font-semibold tracking-wide",
                isActive(pathname, href)
                  ? "border-[var(--accent)] bg-[var(--bg-soft)] text-[var(--accent-deep)]"
                  : "border-[var(--line)] text-[var(--fg-muted)]"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <aside className="hidden lg:block">
          <div className="sticky top-28 border border-[var(--line)] bg-[var(--bg-elevated)] p-4 shadow-sm">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--fg-muted)]">
              Store admin
            </p>
            <p className="mb-4 px-0 text-xs text-[var(--fg-muted)]">
              Simple tools to update your shop.
            </p>
            <nav className="grid gap-0.5">
              {primary.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "relative flex items-center gap-2.5 px-3 py-2.5 text-sm transition",
                      active
                        ? "bg-[var(--bg-soft)] font-semibold text-[var(--accent-deep)]"
                        : "text-[var(--fg-muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--fg)]"
                    )}
                  >
                    {active && (
                      <span className="absolute inset-y-1 left-0 w-0.5 bg-[var(--accent)]" />
                    )}
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </nav>

            <button
              type="button"
              className="mt-4 flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)]"
              onClick={() => setMoreOpen((v) => !v)}
            >
              More
              <ChevronDown
                className={cn("h-4 w-4 transition", moreOpen && "rotate-180")}
              />
            </button>
            {moreOpen && (
              <nav className="grid gap-0.5">
                {more.map(({ href, label, icon: Icon }) => {
                  const active = isActive(pathname, href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "relative flex items-center gap-2.5 px-3 py-2 text-sm transition",
                        active
                          ? "bg-[var(--bg-soft)] font-semibold text-[var(--accent-deep)]"
                          : "text-[var(--fg-muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--fg)]"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </Link>
                  );
                })}
              </nav>
            )}

            <Link
              href="/"
              className="mt-6 block border-t border-[var(--line)] pt-4 text-xs text-[var(--fg-muted)] hover:text-[var(--accent-deep)]"
            >
              ← Back to store
            </Link>
          </div>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
