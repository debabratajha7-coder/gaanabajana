"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingBag, User, Tag } from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/deals", label: "Deals", icon: Tag },
  { href: "/cart", label: "Cart", icon: ShoppingBag },
  { href: "/account", label: "Account", icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { count } = useCart();

  if (pathname.startsWith("/admin")) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--line)] bg-[color-mix(in_oklab,var(--bg)_92%,transparent)] backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <div className="mx-auto grid max-w-lg grid-cols-5 px-1 pt-1.5 pb-1.5">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] transition",
                active ? "text-[var(--accent)]" : "text-[var(--fg-muted)]"
              )}
            >
              <span className="relative">
                <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
                {href === "/cart" && count > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[9px] font-bold text-[#1a120a]">
                    {count}
                  </span>
                )}
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
