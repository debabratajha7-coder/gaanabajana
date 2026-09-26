"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { themedProductImage } from "@/lib/product-image";
import type { ProductCardData } from "@/components/product/ProductCard";
import { usePdpThemeOptional } from "@/components/product/PdpTheme";
import { ScrollTiltedGrid } from "@/components/ui/scroll-tilted-grid";

type Tab = { id: string; label: string; href: string };

const MAX_PER_TAB = 6;

function readBestsellersFill() {
  if (typeof document === "undefined") return "000000";
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--bestsellers-band-fill")
    .trim();
  return raw || "000000";
}

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
  const [bandFill, setBandFill] = useState("000000");
  const listRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const sync = () => setBandFill(readBestsellersFill());
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => obs.disconnect();
  }, []);

  const fillHex =
    theme?.theme === "dark"
      ? "000000"
      : theme?.theme === "light"
        ? "000000"
        : bandFill;

  const items = useMemo(() => {
    const list = productsByTab[active] || productsByTab[first] || [];
    return list.slice(0, MAX_PER_TAB);
  }, [productsByTab, active, first]);

  const activeTab = tabs.find((t) => t.id === active) || tabs[0];

  useEffect(() => {
    const root = listRef.current;
    if (!root) return;
    const btn = root.querySelector<HTMLElement>(`[data-tab="${active}"]`);
    if (!btn) return;
    setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
    btn.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [active, tabs]);

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
      <div className="mb-6 flex items-end gap-4 sm:mb-8">
        <div className="min-w-0 flex-1">
          <div
            ref={listRef}
            className="relative overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div
              role="tablist"
              aria-label="Bestsellers categories"
              className="relative flex w-max items-stretch gap-0 border-b border-[color-mix(in_oklab,var(--fg)_14%,transparent)]"
            >
              {tabs.map((t) => {
                const on = active === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    data-tab={t.id}
                    onClick={() => setActive(t.id)}
                    className={`relative shrink-0 px-3.5 pb-2.5 pt-1 text-[13px] font-semibold tracking-[-0.01em] transition-colors sm:px-4 sm:text-[14px] ${
                      on
                        ? "text-[var(--fg)]"
                        : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
              <span
                aria-hidden
                className="pointer-events-none absolute bottom-0 h-[2px] rounded-full bg-[var(--accent)] transition-[left,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ left: indicator.left, width: indicator.width }}
              />
            </div>
          </div>
        </div>
        {activeTab && (
          <Link
            href={activeTab.href}
            className="mb-2 inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold tracking-wide text-[var(--fg-muted)] transition hover:text-[var(--accent)] sm:text-[13px]"
          >
            View all
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
        )}
      </div>

      {items.length ? (
        <ScrollTiltedGrid
          key={`${active}-${fillHex}`}
          images={images}
          variant="stage"
          smoothScroll={false}
          sectionPadding="0.35rem"
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
