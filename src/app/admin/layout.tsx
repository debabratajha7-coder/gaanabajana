"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Tags,
  ImageIcon,
  FileText,
  Newspaper,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

const groups: {
  label: string;
  items: { href: string; label: string; icon: typeof LayoutDashboard }[];
}[] = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Commerce",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
      { href: "/admin/products", label: "Products", icon: Package },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/catalog", label: "Categories & Brands", icon: Tags },
      { href: "/admin/media", label: "Media", icon: ImageIcon },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/cms", label: "CMS / Texts", icon: FileText },
      { href: "/admin/blog", label: "Blog", icon: Newspaper },
    ],
  },
  {
    label: "Trust",
    items: [{ href: "/admin/reviews", label: "Reviews & Users", icon: Star }],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user?.role !== "admin") router.replace("/login");
        else setOk(true);
      });
  }, [router]);

  if (!ok) {
    return <div className="container-gb py-16">Checking admin access…</div>;
  }

  const flat = groups.flatMap((g) => g.items);

  return (
    <div className="border-t border-[var(--line)] bg-[var(--bg)]">
      <div className="container-gb py-6 lg:grid lg:grid-cols-[240px_1fr] lg:gap-10 lg:py-8">
        {/* Mobile chip nav */}
        <nav className="mb-6 flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {flat.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "shrink-0 border px-3 py-2 text-xs font-semibold tracking-wide",
                isActive(pathname, href)
                  ? "border-[var(--accent)] bg-[var(--bg-soft)] text-[var(--accent)]"
                  : "border-[var(--line)] text-[var(--fg-muted)]"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <aside className="hidden lg:block">
          <div className="sticky top-28 border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--fg-muted)]">
              Admin
            </p>
            <nav className="space-y-5">
              {groups.map((group) => (
                <div key={group.label}>
                  <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-muted)]">
                    {group.label}
                  </p>
                  <div className="grid gap-0.5">
                    {group.items.map(({ href, label, icon: Icon }) => {
                      const active = isActive(pathname, href);
                      return (
                        <Link
                          key={href}
                          href={href}
                          className={cn(
                            "relative flex items-center gap-2.5 px-3 py-2 text-sm transition",
                            active
                              ? "bg-[var(--bg-soft)] text-[var(--accent)]"
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
                  </div>
                </div>
              ))}
            </nav>
            <Link
              href="/"
              className="mt-6 block border-t border-[var(--line)] pt-4 text-xs text-[var(--fg-muted)] hover:text-[var(--accent)]"
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
