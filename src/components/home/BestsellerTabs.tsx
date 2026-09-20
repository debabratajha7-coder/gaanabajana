"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { themedProductImage } from "@/lib/product-image";
import type { ProductCardData } from "@/components/product/ProductCard";
import { usePdpThemeOptional } from "@/components/product/PdpTheme";
import { ScrollTiltedGrid } from "@/components/ui/scroll-tilted-grid";

type Tab = { id: string; label: string; href: string };

const MAX_PER_TAB = 6;

export function BestsellerTabs({
  tabs,
  productsByTab,
}: {
  tabs: Tab[];
  productsByTab: Record<string, ProductCardData[]>;
}) {
  const first = tabs[0]?.id || "all";
  const [active, setActive] = useState(first);
  const theme = usePdpThemeOptional();
  const fillHex = theme?.theme === "dark" ? "0A0A0A" : "F7F5F3";

  const items = useMemo(() => {
    const list = productsByTab[active] || productsByTab[first] || [];
    return list.slice(0, MAX_PER_TAB);
  }, [productsByTab, active, first]);

  const activeTab = tabs.find((t) => t.id === active) || tabs[0];

  const images = useMemo(
    () =>
      items.map((p) => {
        const raw = p.images?.[0] || "/placeholder-product.jpg";
        return {
          src: themedProductImage(raw, fillHex),
          alt: p.title,
          href: `/products/${p.slug}`,
          title: p.title,
          priceValue: p.price,
          mrp: p.mrp,
        };
      }),
    [items, fillHex]
  );

  if (!tabs.length) return null;

  return (
    <div>
      <div className="mb-6 flex items-center gap-2 sm:mb-8 sm:gap-3">
        <div className="min-w-0 flex-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max items-center gap-1.5 px-0.5 sm:gap-2">
            {tabs.map((t) => {
              const on = active === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActive(t.id)}
                  className={`glass-chip shrink-0 whitespace-nowrap !rounded-full px-3.5 py-2 text-[12px] font-semibold transition sm:text-[13px] ${
                    on
                      ? "!border-[color-mix(in_oklab,var(--accent)_45%,var(--line))] !bg-[color-mix(in_oklab,var(--accent)_12%,var(--glass))] text-[var(--accent)]"
                      : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
        {activeTab && (
          <Link
            href={activeTab.href}
            className="glass-chip shrink-0 whitespace-nowrap !rounded-full px-3 py-2 text-[12px] font-medium text-[var(--fg-muted)] underline-offset-2 hover:text-[var(--accent)] hover:underline sm:text-[13px]"
          >
            View all
          </Link>
        )}
      </div>

      {items.length ? (
        <ScrollTiltedGrid
          key={`${active}-${fillHex}`}
          images={images}
          variant="stage"
          smoothScroll={false}
          sectionPadding="1.25rem"
          rounded="var(--radius-glass, 1rem)"
          maxTilt={48}
          maxBlur={4}
        />
      ) : (
        <div className="glass-panel px-4 py-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
            Coming soon
          </p>
          <p className="mt-2 text-sm font-medium text-[var(--fg)]">
            Products for {activeTab?.label || "this category"} are coming soon
          </p>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">
            We’re stocking this shelf — check back shortly.
          </p>
          {activeTab && (
            <Link
              href={activeTab.href}
              className="mt-4 inline-block text-sm font-medium underline underline-offset-2"
            >
              Open full category
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
