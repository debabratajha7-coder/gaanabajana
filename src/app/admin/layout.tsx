"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
  Users,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AdminPermission,
  hasAdminPermission,
  permissionForPath,
} from "@/lib/permissions";

type NavUser = {
  role: string;
  isSuperAdmin?: boolean;
  adminPermissions?: string[];
  name?: string;
};

const primary: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission: AdminPermission;
}[] = [
  { href: "/admin", label: "Home", icon: LayoutDashboard, permission: "dashboard" },
  { href: "/admin/products", label: "Add a product", icon: Package, permission: "products" },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag, permission: "orders" },
  {
    href: "/admin/shop-by-category",
    label: "Shop by category",
    icon: LayoutGrid,
    permission: "catalog",
  },
  { href: "/admin/brands", label: "Brands", icon: Tag, permission: "catalog" },
  { href: "/admin/website", label: "Site", icon: Palette, permission: "website" },
];

const more: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission: AdminPermission;
}[] = [
  { href: "/admin/blog", label: "Blog posts", icon: Newspaper, permission: "blog" },
  { href: "/admin/reviews", label: "Reviews", icon: Star, permission: "reviews" },
  { href: "/admin/media", label: "All photos", icon: Images, permission: "media" },
  { href: "/admin/users", label: "Users & staff", icon: Users, permission: "users" },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<NavUser | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.user?.role !== "admin") {
          router.replace("/login");
          return;
        }
        setUser(d.user);
      })
      .catch(() => {
        if (!cancelled) router.replace("/login");
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const allowedPrimary = useMemo(
    () =>
      primary.filter((item) =>
        user
          ? hasAdminPermission(
              {
                role: user.role,
                isSuperAdmin: user.isSuperAdmin,
                adminPermissions: user.adminPermissions,
              },
              item.permission
            )
          : false
      ),
    [user]
  );

  const allowedMore = useMemo(
    () =>
      more.filter((item) =>
        user
          ? hasAdminPermission(
              {
                role: user.role,
                isSuperAdmin: user.isSuperAdmin,
                adminPermissions: user.adminPermissions,
              },
              item.permission
            )
          : false
      ),
    [user]
  );

  useEffect(() => {
    if (allowedMore.some((m) => isActive(pathname, m.href))) setMoreOpen(true);
  }, [pathname, allowedMore]);

  useEffect(() => {
    if (!user) return;
    const needed = permissionForPath(pathname);
    if (
      needed &&
      !hasAdminPermission(
        {
          role: user.role,
          isSuperAdmin: user.isSuperAdmin,
          adminPermissions: user.adminPermissions,
        },
        needed
      )
    ) {
      const fallback = [...allowedPrimary, ...allowedMore][0]?.href || "/";
      router.replace(fallback);
    }
  }, [user, pathname, allowedPrimary, allowedMore, router]);

  if (!user) {
    return <div className="container-gb py-16">Checking admin access…</div>;
  }

  const chips = [...allowedPrimary, ...allowedMore];

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
          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="shrink-0 border border-[var(--line)] px-3 py-2 text-xs font-semibold tracking-wide text-[var(--fg-muted)]"
          >
            {loggingOut ? "…" : "Log out"}
          </button>
        </nav>

        <aside className="hidden lg:block">
          <div className="sticky top-28 border border-[var(--line)] bg-[var(--bg-elevated)] p-4 shadow-sm">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--fg-muted)]">
              Store admin
            </p>
            <p className="mb-1 text-sm font-medium text-[var(--fg)]">
              {user.name || "Admin"}
            </p>
            <p className="mb-4 text-xs text-[var(--fg-muted)]">
              {user.isSuperAdmin ? "Main admin · full control" : "Staff access"}
            </p>
            <nav className="grid gap-0.5">
              {allowedPrimary.map(({ href, label, icon: Icon }) => {
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

            {allowedMore.length > 0 && (
              <>
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
                    {allowedMore.map(({ href, label, icon: Icon }) => {
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
              </>
            )}

            <div className="mt-6 space-y-2 border-t border-[var(--line)] pt-4">
              <Link
                href="/"
                className="block text-xs text-[var(--fg-muted)] hover:text-[var(--accent-deep)]"
              >
                ← Back to store
              </Link>
              <button
                type="button"
                onClick={logout}
                disabled={loggingOut}
                className="flex w-full items-center gap-2 px-0 py-1.5 text-sm text-[var(--fg-muted)] transition hover:text-[var(--danger)] disabled:opacity-60"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {loggingOut ? "Signing out…" : "Log out"}
              </button>
            </div>
          </div>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
