"use client";

import Link from "next/link";
import { useState } from "react";
import { ComingSoonDialog } from "@/components/ui/ComingSoonDialog";
import type { ShopLink } from "@/lib/shop-links";

export type { ShopLink };

export function FooterShopLinks({ links }: { links: ShopLink[] }) {
  const [soon, setSoon] = useState<ShopLink | null>(null);

  return (
    <>
      <div className="grid gap-2.5 text-sm">
        {links.map((link) =>
          link.empty ? (
            <button
              key={link.href}
              type="button"
              className="text-left hover:text-[var(--accent)]"
              onClick={() => setSoon(link)}
            >
              {link.label}
            </button>
          ) : (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-[var(--accent)]"
            >
              {link.label}
            </Link>
          )
        )}
      </div>

      <ComingSoonDialog
        open={Boolean(soon)}
        onClose={() => setSoon(null)}
        categoryName={soon?.name}
      />
    </>
  );
}
