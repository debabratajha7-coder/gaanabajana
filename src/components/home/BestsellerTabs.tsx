"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProductCard, ProductCardData } from "@/components/product/ProductCard";

type Tab = { id: string; label: string; href: string };

export function BestsellerTabs({
  tabs,
  productsByTab,
}: {
  tabs: Tab[];
  productsByTab: Record<string, ProductCardData[]>;
}) {
  const first = tabs[0]?.id || "all";
  const [active, setActive] = useState(first);
  const items = useMemo(
    () => productsByTab[active] || productsByTab[first] || [],
    [productsByTab, active, first]
  );
  const activeTab = tabs.find((t) => t.id === active) || tabs[0];

  if (!tabs.length) return null;

  return (
    <div>
      <div className="mb-6 border-b border-[var(--line)]">
        <div className="flex items-end gap-1">
          <div className="min-w-0 flex-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max items-end gap-x-4 px-0.5 sm:gap-x-5">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActive(t.id)}
                  className={`-mb-px shrink-0 whitespace-nowrap border-b-2 pb-2.5 text-[13px] font-medium transition sm:text-sm ${
                    active === t.id
                      ? "border-[var(--accent)] text-[var(--accent)]"
                      : "border-transparent text-[var(--fg-muted)] hover:text-[var(--fg)]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          {activeTab && (
            <Link
              href={activeTab.href}
              className="shrink-0 whitespace-nowrap pb-2.5 pl-3 text-[13px] font-medium underline underline-offset-2 text-[var(--fg-muted)] hover:text-[var(--accent)] sm:text-sm"
            >
              View all
            </Link>
          )}
        </div>
      </div>

      {items.length ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {items.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-[var(--fg-muted)]">
          No products in this category yet.
        </p>
      )}
    </div>
  );
}
