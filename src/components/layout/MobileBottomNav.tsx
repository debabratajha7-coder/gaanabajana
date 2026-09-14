"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingBag, User, Tag } from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";
import { CartBadge } from "@/components/ui/CartBadge";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

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
      className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 border-t border-[var(--line)] bg-[color-mix(in_oklab,var(--bg)_94%,transparent)] backdrop-blur-2xl lg:hidden"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <div className="mx-auto grid max-w-lg grid-cols-5 px-1.5 pt-1.5 pb-1.5">
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
                "relative flex flex-col items-center gap-0.5 rounded-2xl px-1 py-2 text-[10px] transition",
                active ? "text-[var(--accent)]" : "text-[var(--fg-muted)]"
              )}
            >
              {active && (
                <motion.span
                  layoutId="mobile-nav-pill"
                  className="absolute inset-x-1 inset-y-0.5 rounded-2xl bg-[var(--bg-soft)]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-[1]">
                <Icon className="mx-auto h-5 w-5" strokeWidth={active ? 2.35 : 1.75} />
                {href === "/cart" && <CartBadge count={count} />}
              </span>
              <span className="relative z-[1]">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
