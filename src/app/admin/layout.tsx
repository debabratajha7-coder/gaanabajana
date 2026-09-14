"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  ["/admin", "Dashboard"],
  ["/admin/products", "Products"],
  ["/admin/orders", "Orders"],
  ["/admin/cms", "CMS / Texts"],
  ["/admin/media", "Media"],
  ["/admin/catalog", "Categories & Brands"],
  ["/admin/reviews", "Reviews & Users"],
  ["/admin/blog", "Blog"],
];

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

  return (
    <div className="border-t border-[var(--line)] bg-[var(--bg)]">
      <div className="container-gb grid gap-8 py-8 lg:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
          <p className="mb-3 text-xs uppercase tracking-[0.16em] text-[var(--fg-muted)]">
            Admin
          </p>
          <nav className="grid gap-1 text-sm">
            {links.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-2 ${
                  pathname === href
                    ? "bg-[var(--bg-soft)] text-[var(--accent)]"
                    : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
