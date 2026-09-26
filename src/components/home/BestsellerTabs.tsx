"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { themedProductImage } from "@/lib/product-image";
import type { ProductCardData } from "@/components/product/ProductCard";
import { usePdpThemeOptional } from "@/components/product/PdpTheme";
import { PriceCutTag } from "@/components/ui/PriceCutTag";

type Tab = { id: string; label: string; href: string };

const SPOTLIGHT = 4;

function readBestsellersFill() {
  if (typeof document === "undefined") return "000000";
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--bestsellers-band-fill")
    .trim();
  return raw || "000000";
}

function ProductTile({
  product,
  fillHex,
  width,
  eager,
  compact,
  delay,
}: {
  product: ProductCardData;
  fillHex: string;
  width: number;
  eager?: boolean;
  compact?: boolean;
  delay: number;
}) {
  const raw = product.images?.[0] || "/placeholder-product.jpg";
  const src = themedProductImage(raw, fillHex, {
    width,
    bgRemoval: true,
    stage: true,
  });

  return (
    <Link
      href={`/products/${product.slug}`}
      aria-label={product.title}
      className={`bestseller-card group/stage flex h-full flex-col ${
        compact ? "w-[11rem] shrink-0 snap-start sm:w-[13rem]" : ""
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden">
        <Image
          src={src}
          alt={product.title}
          fill
          quality={75}
          sizes={compact ? "200px" : "(max-width: 640px) 46vw, 260px"}
          loading={eager ? "eager" : "lazy"}
          priority={Boolean(eager)}
          className="bestseller-img object-contain object-center"
        />
      </div>
      <div className="mt-4 h-px w-8 bg-[#ff8a9a] transition-[width] duration-300 group-hover/stage:w-14" />
      <p className="mt-3 line-clamp-2 min-h-[2.5em] text-left text-[13px] font-medium leading-snug text-white/90 sm:text-sm">
        {product.title}
      </p>
      <div className="mt-2">
        <PriceCutTag
          layout="compact"
          price={product.price}
          mrp={product.mrp ?? product.price}
          className="justify-start"
        />
      </div>
    </Link>
  );
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
    return productsByTab[active] || productsByTab[first] || [];
  }, [productsByTab, active, first]);

  const useRail = items.length > SPOTLIGHT + 2;
  const spotlight = useRail ? items.slice(0, SPOTLIGHT) : items;
  const more = useRail ? items.slice(SPOTLIGHT) : [];
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
        <div key={active}>
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:gap-x-8 lg:grid-cols-4">
            {spotlight.map((p, i) => (
              <ProductTile
                key={p._id}
                product={p}
                fillHex={fillHex}
                width={320}
                eager={i < 2}
                delay={i * 70}
              />
            ))}
          </div>

          {more.length > 0 && (
            <div className="mt-8">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-muted)]">
                  More in {activeTab?.label || "this category"}
                </p>
                <p className="text-[11px] text-[var(--fg-muted)]">Swipe</p>
              </div>
              <div className="bestseller-rail -mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
                <div className="flex w-max snap-x snap-mandatory gap-3">
                  {more.map((p, i) => (
                    <ProductTile
                      key={p._id}
                      product={p}
                      fillHex={fillHex}
                      width={220}
                      compact
                      delay={280 + i * 50}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
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
