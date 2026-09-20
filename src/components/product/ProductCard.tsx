"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { formatINR, discountPercent } from "@/lib/utils";
import { themedProductImage } from "@/lib/product-image";
import type { ProductCardData } from "@/lib/product-card";
import { usePdpThemeOptional } from "@/components/product/PdpTheme";

export type { ProductCardData, ProductColorOptionData } from "@/lib/product-card";

const MAX_SWATCHES = 4;

export function ProductCard({
  product,
  appearance = "storefront",
}: {
  product: ProductCardData;
  appearance?: "storefront" | "pdp";
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const pdp = usePdpThemeOptional();
  const colors = (product.colorOptions || []).filter((c) => c.name);
  const [selected, setSelected] = useState<number | null>(null);
  const [imgFailed, setImgFailed] = useState(false);
  const save = discountPercent(product.price, product.mrp);
  const isPdp = appearance === "pdp";

  const rawPreview =
    selected !== null && colors[selected]?.images?.[0]
      ? colors[selected].images[0]
      : product.images?.[0] || "/placeholder-product.jpg";

  const fillHex = pdp?.tokens.imgBg || "141414";
  const preview =
    isPdp && !imgFailed
      ? themedProductImage(rawPreview, fillHex)
      : rawPreview;

  const visible = colors.slice(0, MAX_SWATCHES);
  const extra = Math.max(0, colors.length - MAX_SWATCHES);

  function onSwatchClick(e: MouseEvent, index: number) {
    e.preventDefault();
    e.stopPropagation();
    setSelected((cur) => (cur === index ? null : index));
    setImgFailed(false);
  }

  const cardClass =
    "glass-panel group flex h-full flex-col overflow-hidden transition duration-300 hover:border-[var(--line-strong)]";

  return (
    <motion.div
      className="h-full"
      whileHover={reduce ? undefined : { y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        href={`/products/${product.slug}`}
        prefetch
        onPointerEnter={() => router.prefetch(`/products/${product.slug}`)}
        className={cardClass}
      >
        <div className="relative aspect-[4/5] shrink-0 overflow-hidden border-b border-[var(--line)] bg-[var(--bg-soft)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={preview}
            src={preview}
            alt={product.title}
            className={`h-full w-full transition duration-700 group-hover:scale-[1.03] ${
              isPdp ? "object-contain p-3" : "object-cover"
            }`}
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
          {save > 0 && (
            <span className="absolute left-2 top-2 rounded bg-[var(--accent)] px-2 py-0.5 text-[10px] font-semibold text-white sm:text-xs">
              Save {save}%
            </span>
          )}
          {!!product.ratingCount && (
            <span className="glass-chip absolute right-2 top-2 !rounded px-1.5 py-0.5 text-[10px] text-[var(--fg)] shadow-sm sm:text-xs">
              <span className="text-amber-500">★</span>
              {product.ratingAvg?.toFixed(1)}
              <span className="text-[var(--fg-muted)]">
                | ({product.ratingCount})
              </span>
            </span>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4">
          <p className="min-h-[1rem] truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-muted)] sm:min-h-[1.125rem] sm:text-[11px]">
            {product.brandName || "\u00A0"}
          </p>

          <h3 className="line-clamp-2 min-h-[2.5rem] text-[0.8125rem] font-semibold leading-snug text-[var(--fg)] sm:min-h-[2.75rem] sm:text-[0.9375rem]">
            {product.title}
          </h3>

          <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-0.5 pt-1">
            <p className="text-[0.9375rem] font-semibold tabular-nums text-[var(--price)] sm:text-base">
              {formatINR(product.price)}
            </p>
            {product.mrp > product.price ? (
              <p className="text-xs tabular-nums text-[var(--fg-muted)] line-through sm:text-[0.8125rem]">
                {formatINR(product.mrp)}
              </p>
            ) : null}
            {save > 0 ? (
              <p className="text-[10px] font-semibold text-[var(--accent)] sm:text-[11px]">
                {save}% off
              </p>
            ) : null}
          </div>

          {colors.length > 0 ? (
            <div className="flex min-h-[1.5rem] items-center gap-1.5 pt-0.5 sm:min-h-[1.75rem] sm:gap-2">
              {visible.map((c, i) => {
                const active = selected === i;
                return (
                  <button
                    key={`${c.name}-${i}`}
                    type="button"
                    title={c.name}
                    aria-label={`${c.name}${active ? " (selected — click to clear)" : ""}`}
                    aria-pressed={active}
                    onClick={(e) => onSwatchClick(e, i)}
                    className={`relative h-4 w-4 shrink-0 rounded-full border transition sm:h-5 sm:w-5 ${
                      active
                        ? "ring-2 ring-[var(--fg)] ring-offset-1 ring-offset-[var(--bg)] sm:ring-offset-2"
                        : "border-[color-mix(in_oklab,var(--fg)_20%,transparent)] hover:ring-1 hover:ring-[color-mix(in_oklab,var(--fg)_30%,transparent)]"
                    }`}
                    style={{ backgroundColor: c.swatch || "#888" }}
                  />
                );
              })}
              {extra > 0 ? (
                <span className="text-[10px] text-[var(--fg-muted)] sm:text-xs">
                  +{extra}
                </span>
              ) : null}
            </div>
          ) : (
            <div className="min-h-[1.5rem] sm:min-h-[1.75rem]" aria-hidden />
          )}
        </div>
      </Link>
    </motion.div>
  );
}
