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
      <div className="mb-6 flex flex-wrap items-end gap-x-5 gap-y-2 border-b border-[var(--line)]">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            className={`-mb-px border-b-2 pb-2.5 text-sm font-medium transition ${
              active === t.id
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--fg-muted)] hover:text-[var(--fg)]"
            }`}
          >
            {t.label}
          </button>
        ))}
        {activeTab && (
          <Link
            href={activeTab.href}
            className="ml-auto pb-2.5 text-sm font-medium underline underline-offset-2 text-[var(--fg-muted)] hover:text-[var(--accent)]"
          >
            View all
          </Link>
        )}
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
