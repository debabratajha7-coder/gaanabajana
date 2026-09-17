"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Package,
  Heart,
  Star,
  Shield,
  LayoutDashboard,
} from "lucide-react";
import { DeleteAccountControl } from "@/components/account/DeleteAccountControl";

const links = [
  {
    href: "/account/orders",
    label: "Orders",
    description: "Track shipments and view past purchases",
    icon: Package,
  },
  {
    href: "/account/addresses",
    label: "Addresses",
    description: "Delivery locations for checkout",
    icon: MapPin,
  },
  {
    href: "/account/wishlist",
    label: "Wishlist",
    description: "Instruments you saved for later",
    icon: Heart,
  },
  {
    href: "/account/reviews",
    label: "My reviews",
    description: "Ratings you have left on products",
    icon: Star,
  },
  {
    href: "/account/profile",
    label: "Profile & security",
    description: "Name, phone, and password",
    icon: Shield,
  },
] as const;

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(
    null
  );

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
      <p className="eyebrow">Your account</p>
      <h1 className="display mt-2 text-4xl sm:text-5xl">Hello, {user.name}</h1>
      <p className="mt-2 text-[var(--fg-muted)]">{user.email}</p>

      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.map(({ href, label, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex gap-4 border border-[var(--line)] bg-[var(--bg-elevated)] p-5 transition hover:border-[var(--accent)]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--line)] bg-[var(--bg-soft)] text-[var(--accent)] transition group-hover:border-[var(--accent)]">
              <Icon className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-semibold">{label}</span>
              <span className="mt-1 block text-sm text-[var(--fg-muted)]">
                {description}
              </span>
            </span>
          </Link>
        ))}
        {user.role === "admin" && (
          <Link
            href="/admin"
            className="group flex gap-4 border border-[var(--line)] bg-[var(--bg-elevated)] p-5 transition hover:border-[var(--accent)]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--line)] bg-[var(--bg-soft)] text-[var(--accent)]">
              <LayoutDashboard className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-semibold">Admin panel</span>
              <span className="mt-1 block text-sm text-[var(--fg-muted)]">
                Catalog, orders, and CMS
              </span>
            </span>
          </Link>
        )}
      </div>

      <div className="mt-10 flex items-center gap-4">
        <button type="button" className="btn btn-ghost" onClick={logout}>
          Log out
        </button>
      </div>

      {user.role !== "admin" && (
        <div className="mt-28 flex justify-end border-t border-[var(--line)]/60 pt-10">
          <DeleteAccountControl />
        </div>
      )}
    </div>
  );
}
