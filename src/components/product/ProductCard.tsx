"use client";

import Link from "next/link";
import { useState, type MouseEvent } from "react";
import { motion } from "motion/react";
import { formatINR, discountPercent } from "@/lib/utils";
import type { ProductCardData } from "@/lib/product-card";

export type { ProductCardData, ProductColorOptionData } from "@/lib/product-card";

const MAX_SWATCHES = 4;

export function ProductCard({ product }: { product: ProductCardData }) {
  const colors = (product.colorOptions || []).filter((c) => c.name);
  const [selected, setSelected] = useState<number | null>(null);
  const save = discountPercent(product.price, product.mrp);

  const preview =
    selected !== null && colors[selected]?.images?.[0]
      ? colors[selected].images[0]
      : product.images?.[0] || "/placeholder-product.jpg";

  const visible = colors.slice(0, MAX_SWATCHES);
  const extra = Math.max(0, colors.length - MAX_SWATCHES);

  function onSwatchClick(e: MouseEvent, index: number) {
    e.preventDefault();
    e.stopPropagation();
    setSelected((cur) => (cur === index ? null : index));
  }

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <Link
        href={`/products/${product.slug}`}
        className="group block overflow-hidden border border-[var(--line)] bg-white transition duration-300 hover:border-[var(--line-strong)] hover:shadow-sm"
      >
        <div className="relative aspect-[4/5] overflow-hidden border-b border-[var(--line)] bg-[var(--bg-soft)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt={product.title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
            loading="lazy"
          />
          {save > 0 && (
            <span className="absolute left-2 top-2 rounded bg-[#1d4ed8] px-2 py-0.5 text-[10px] font-semibold text-white sm:text-xs">
              Save {save}%
            </span>
          )}
          {!!product.ratingCount && (
            <span className="absolute right-2 top-2 flex items-center gap-0.5 rounded bg-white/95 px-1.5 py-0.5 text-[10px] text-[var(--fg)] shadow-sm sm:text-xs">
              <span className="text-amber-500">★</span>
              {product.ratingAvg?.toFixed(1)}
              <span className="text-[var(--fg-muted)]">
                | ({product.ratingCount})
              </span>
            </span>
          )}
        </div>
        <div className="space-y-2 p-3 sm:p-4">
          {product.brandName && (
            <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--fg-muted)] sm:text-[11px]">
              {product.brandName}
            </p>
          )}
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-2 min-w-0 flex-1 text-[0.9rem] font-semibold leading-snug text-[var(--fg)] sm:text-[0.95rem]">
              {product.title}
            </h3>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold text-[var(--accent)] sm:text-[0.95rem]">
                {formatINR(product.price)}
              </p>
              {product.mrp > product.price && (
                <p className="text-xs text-[var(--fg-muted)] line-through">
                  {formatINR(product.mrp)}
                </p>
              )}
            </div>
          </div>

          {colors.length > 0 && (
            <div className="flex items-center gap-2 pt-0.5">
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
                    className={`relative h-5 w-5 shrink-0 rounded-full border transition sm:h-6 sm:w-6 ${
                      active
                        ? "ring-2 ring-[var(--fg)] ring-offset-2"
                        : "border-black/15 hover:ring-1 hover:ring-black/30"
                    }`}
                    style={{ backgroundColor: c.swatch || "#888" }}
                  />
                );
              })}
              {extra > 0 && (
                <span className="text-xs text-[var(--fg-muted)]">+{extra}</span>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
