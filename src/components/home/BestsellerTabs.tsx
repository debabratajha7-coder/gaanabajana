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
        <div
          key={active}
          className="mx-auto grid w-full max-w-[720px] grid-cols-2 gap-x-3 gap-y-7 px-1.5 sm:gap-x-8 sm:gap-y-10 sm:px-2"
        >
          {items.map((p, i) => {
            const raw = p.images?.[0] || "/placeholder-product.jpg";
            const src = themedProductImage(raw, fillHex, {
              width: 360,
              bgRemoval: true,
            });
            return (
              <Link
                key={p._id}
                href={`/products/${p.slug}`}
                className="group/stage flex flex-col items-center text-center"
                aria-label={p.title}
              >
                <div className="relative flex h-[190px] w-full items-end justify-center sm:h-[280px]">
                  <Image
                    src={src}
                    alt={p.title}
                    width={360}
                    height={360}
                    className="max-h-full w-auto max-w-full object-contain transition duration-300 group-hover/stage:scale-[1.03]"
                    sizes="(max-width: 640px) 45vw, 320px"
                    quality={70}
                    loading={i < 2 ? "eager" : "lazy"}
                    priority={i < 2}
                  />
                </div>
                <div className="mt-2 flex flex-col items-center gap-1.5 sm:mt-3">
                  <span className="glass-chip max-w-full !rounded-lg px-2.5 py-1.5 text-left sm:!rounded-xl sm:px-3 sm:py-2">
                    <span className="line-clamp-2 text-[10px] font-semibold leading-snug text-[var(--fg)] sm:line-clamp-1 sm:text-xs">
                      {p.title}
                    </span>
                  </span>
                  <PriceCutTag
                    layout="inline"
                    price={p.price}
                    mrp={p.mrp ?? p.price}
                    className="justify-center text-[11px] sm:text-sm"
                  />
                </div>
              </Link>
            );
          })}
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
