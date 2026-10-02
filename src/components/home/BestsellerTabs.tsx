"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Star } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { themedProductImage } from "@/lib/product-image";
import type { ProductCardData } from "@/components/product/ProductCard";
import { usePdpThemeOptional } from "@/components/product/PdpTheme";
import { discountPercent, formatINR } from "@/lib/utils";

type Tab = { id: string; label: string; href: string };

const GRID_COUNT = 4;

function readBestsellersFill() {
  if (typeof document === "undefined") return "000000";
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--bestsellers-band-fill")
    .trim();
  return raw || "000000";
}

function productImage(product: ProductCardData) {
  return product.images?.[0] || "/placeholder-product.jpg";
}

function RatingChip({ product }: { product: ProductCardData }) {
  if (!product.ratingCount || !product.ratingAvg) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white ring-1 ring-white/10 backdrop-blur-sm">
      <Star className="h-3 w-3 fill-[#ffc857] text-[#ffc857]" strokeWidth={0} />
      {product.ratingAvg.toFixed(1)}
    </span>
  );
}

function OffBadge({ off }: { off: number }) {
  if (off <= 0) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-[#ff8a9a] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#1a0a0d]">
      {off}% off
    </span>
  );
}

function PriceRow({ product, large }: { product: ProductCardData; large?: boolean }) {
  const mrp = product.mrp ?? product.price;
  const hasCut = mrp > product.price;
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span
        className={`font-semibold tabular-nums text-white ${
          large ? "text-2xl sm:text-3xl" : "text-sm sm:text-[15px]"
        }`}
      >
        {formatINR(product.price)}
      </span>
      {hasCut ? (
        <span
          className={`tabular-nums text-white/45 line-through ${
            large ? "text-base" : "text-[11px] sm:text-xs"
          }`}
        >
          {formatINR(mrp)}
        </span>
      ) : null}
    </div>
  );
}

function SpotlightCard({
  product,
  tabLabel,
}: {
  product: ProductCardData;
  tabLabel: string;
}) {
  const src = themedProductImage(productImage(product), "00000000", {
    width: 960,
    bgRemoval: true,
    stage: true,
    frameRatio: 0.8,
  });
  const mrp = product.mrp ?? product.price;
  const off = discountPercent(product.price, mrp);
  const save = mrp > product.price ? mrp - product.price : 0;
  const rating = product.ratingAvg && product.ratingCount ? product.ratingAvg : 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      aria-label={`${product.title} — #1 bestseller in ${tabLabel}`}
      className="bestseller-card group/stage relative grid overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0b0b0b] md:grid-cols-[1.05fr_1fr]"
    >
      <div className="relative aspect-[5/4] w-full sm:aspect-[16/10] md:aspect-auto md:min-h-[24rem] lg:min-h-[27rem]">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_55%,rgba(255,138,154,0.22),rgba(255,138,154,0.05)_55%,transparent_75%)]"
        />
        <Image
          src={src}
          alt={product.title}
          fill
          quality={75}
          sizes="(max-width: 768px) 92vw, 600px"
          className="bestseller-img object-contain object-center p-2 sm:p-4"
        />
        <div className="absolute left-3 top-3 flex items-center gap-2 sm:left-5 sm:top-5">
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-black">
            #1 Bestseller
          </span>
          <OffBadge off={off} />
        </div>
      </div>

      <div className="relative flex flex-col justify-center gap-3 border-t border-white/10 p-5 sm:p-8 md:border-l md:border-t-0 lg:p-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ff8a9a]">
          #1 Bestseller in {tabLabel}
        </p>
        {product.brandName ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
            {product.brandName}
          </p>
        ) : null}
        <h3 className="font-display text-2xl font-semibold leading-tight tracking-[-0.02em] text-white sm:text-3xl lg:text-[2.1rem]">
          {product.title}
        </h3>
        {rating ? (
          <div className="flex items-center gap-2 text-sm text-white/70">
            <span className="flex" aria-hidden>
              {[0, 1, 2, 3, 4].map((i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.round(rating)
                      ? "fill-[#ffc857] text-[#ffc857]"
                      : "fill-white/15 text-white/15"
                  }`}
                  strokeWidth={0}
                />
              ))}
            </span>
            <span>
              {rating.toFixed(1)} · {product.ratingCount} review
              {product.ratingCount === 1 ? "" : "s"}
            </span>
          </div>
        ) : null}
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <PriceRow product={product} large />
          {save > 0 ? (
            <span className="rounded-full bg-[#ff8a9a]/15 px-2.5 py-1 text-xs font-semibold text-[#ff8a9a] ring-1 ring-inset ring-[#ff8a9a]/30">
              You save {formatINR(save)}
            </span>
          ) : null}
        </div>
        <span className="mt-3 inline-flex w-fit items-center gap-2 rounded-full bg-[#ff8a9a] px-6 py-3 text-sm font-semibold text-[#1a0a0d] transition group-hover/stage:gap-3 group-hover/stage:bg-[#ffa3b0]">
          Shop now
          <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
        </span>
      </div>
    </Link>
  );
}

function ProductTile({
  product,
  fillHex,
  width,
  sizes,
  compact,
  delay,
}: {
  product: ProductCardData;
  fillHex: string;
  width: number;
  sizes: string;
  compact?: boolean;
  delay: number;
}) {
  const src = themedProductImage(productImage(product), fillHex, {
    width,
    bgRemoval: true,
    stage: true,
  });
  const off = discountPercent(product.price, product.mrp ?? product.price);

  return (
    <Link
      href={`/products/${product.slug}`}
      aria-label={product.title}
      className={`bestseller-card group/stage flex h-full flex-col ${
        compact ? "w-[42vw] max-w-[13rem] shrink-0 snap-start sm:w-[13rem]" : ""
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-black ring-1 ring-inset ring-white/[0.08] transition group-hover/stage:ring-[#ff8a9a]/40">
        <Image
          src={src}
          alt={product.title}
          fill
          quality={75}
          sizes={sizes}
          className="bestseller-img object-contain object-center"
        />
        <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-1 sm:inset-x-2.5 sm:top-2.5">
          <OffBadge off={off} />
          <RatingChip product={product} />
        </div>
        <span
          aria-hidden
          className="absolute bottom-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 backdrop-blur-sm transition duration-300 group-hover/stage:bg-[#ff8a9a] group-hover/stage:text-[#1a0a0d] [@media(hover:hover)]:translate-y-1 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/stage:translate-y-0 [@media(hover:hover)]:group-hover/stage:opacity-100"
        >
          <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
        </span>
      </div>
      {product.brandName ? (
        <p className="mt-3 truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-[#ff8a9a]/85">
          {product.brandName}
        </p>
      ) : (
        <span className="mt-3" />
      )}
      <p className="mt-1 line-clamp-2 min-h-[2.5em] text-left text-[13px] font-medium leading-snug text-white/90 sm:text-sm">
        {product.title}
      </p>
      <div className="mt-1.5">
        <PriceRow product={product} />
      </div>
    </Link>
  );
}

export function BestsellerTabs({
  tabs,
  productsByTab,
  countsByTab = {},
}: {
  tabs: Tab[];
  productsByTab: Record<string, ProductCardData[]>;
  countsByTab?: Record<string, number>;
}) {
  const first = tabs[0]?.id || "all";
  const [active, setActive] = useState(first);
  const theme = usePdpThemeOptional();
  const [bandFill, setBandFill] = useState("000000");
  const listRef = useRef<HTMLDivElement>(null);
  const userPicked = useRef(false);

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

  const spotlight = items[0];
  const grid = items.slice(1, 1 + GRID_COUNT);
  const more = items.slice(1 + GRID_COUNT);
  const activeTab = tabs.find((t) => t.id === active) || tabs[0];
  const total = Math.max(countsByTab[active] ?? 0, items.length);

  useEffect(() => {
    if (!userPicked.current) return;
    const root = listRef.current;
    const btn = root?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
    if (!root || !btn) return;
    root.scrollTo({
      left: btn.offsetLeft - (root.clientWidth - btn.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, [active]);

  if (!tabs.length) return null;

  return (
    <div>
      <div className="mb-6 flex items-center gap-4 sm:mb-8">
        <div
          ref={listRef}
          className="-mx-4 min-w-0 flex-1 overflow-x-auto overscroll-x-contain px-4 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          <div
            role="tablist"
            aria-label="Bestsellers categories"
            className="flex w-max items-center gap-2"
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
                  onClick={() => {
                    userPicked.current = true;
                    setActive(t.id);
                  }}
                  className={`min-h-10 shrink-0 rounded-full px-4 text-[13px] font-semibold tracking-[-0.01em] transition sm:px-5 sm:text-sm ${
                    on
                      ? "bg-[#ff8a9a] text-[#1a0a0d] shadow-[0_6px_24px_-8px_rgba(255,138,154,0.6)]"
                      : "bg-white/[0.04] text-white/70 ring-1 ring-inset ring-white/15 hover:text-white hover:ring-white/30"
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
            className="hidden shrink-0 items-center gap-1 text-[13px] font-semibold tracking-wide text-white/60 transition hover:text-[#ff8a9a] sm:inline-flex"
          >
            View all
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
        )}
      </div>

      {items.length && spotlight ? (
        <div key={active}>
          <SpotlightCard product={spotlight} tabLabel={activeTab?.label || ""} />

          {grid.length > 0 && (
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:mt-10 sm:gap-x-6 lg:grid-cols-4">
              {grid.map((p, i) => (
                <ProductTile
                  key={p._id}
                  product={p}
                  fillHex={fillHex}
                  width={720}
                  sizes="(max-width: 1024px) 46vw, 280px"
                  delay={120 + i * 70}
                />
              ))}
            </div>
          )}

          {more.length > 0 && (
            <div className="mt-10">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">
                  More in {activeTab?.label || "this category"}
                </p>
                <p className="text-[11px] text-white/45">Swipe →</p>
              </div>
              <div className="bestseller-rail -mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex w-max snap-x snap-mandatory gap-3 sm:gap-4">
                  {more.map((p, i) => (
                    <ProductTile
                      key={p._id}
                      product={p}
                      fillHex={fillHex}
                      width={480}
                      sizes="(max-width: 640px) 42vw, 208px"
                      compact
                      delay={400 + i * 50}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab && (
            <Link
              href={activeTab.href}
              className="group mt-10 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white ring-1 ring-inset ring-white/15 transition hover:bg-[#ff8a9a] hover:text-[#1a0a0d] hover:ring-transparent"
            >
              Shop all {activeTab.label}
              <span className="text-white/50 transition group-hover:text-[#1a0a0d]/70">
                ({total} item{total === 1 ? "" : "s"})
              </span>
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" strokeWidth={2.25} />
            </Link>
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
