"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { formatINR, discountPercent, cn } from "@/lib/utils";

export type ProductCardData = {
  _id: string;
  title: string;
  slug: string;
  price: number;
  mrp: number;
  images?: string[];
  ratingAvg?: number;
  ratingCount?: number;
  brand?: { name?: string } | null;
  onSale?: boolean;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const save = discountPercent(product.price, product.mrp);
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
      <Link
        href={`/products/${product.slug}`}
        className="group block overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] transition duration-300 hover:border-[color-mix(in_oklab,var(--accent)_45%,transparent)] hover:shadow-[0_18px_40px_rgba(0,0,0,0.28)]"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-[var(--bg-soft)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.images?.[0] || "/placeholder-product.jpg"}
            alt={product.title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
            loading="lazy"
          />
          {save > 0 && (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-semibold text-[#1a120a] sm:left-3 sm:top-3 sm:text-xs">
              −{save}%
            </span>
          )}
        </div>
        <div className="space-y-1.5 p-3 sm:p-4">
          {product.brand?.name && (
            <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--fg-muted)] sm:text-[11px]">
              {product.brand.name}
            </p>
          )}
          <h3 className="line-clamp-2 min-h-[2.5em] font-[family-name:var(--font-display)] text-[0.95rem] leading-snug sm:text-[1.05rem]">
            {product.title}
          </h3>
          <div className="flex flex-wrap items-baseline gap-1.5 pt-0.5">
            <span className="text-sm font-semibold text-[var(--accent)] sm:text-[0.95rem]">
              {formatINR(product.price)}
            </span>
            {product.mrp > product.price && (
              <span className="text-xs text-[var(--fg-muted)] line-through">
                {formatINR(product.mrp)}
              </span>
            )}
          </div>
          {!!product.ratingCount && (
            <p className={cn("text-[10px] text-[var(--fg-muted)] sm:text-xs")}>
              ★ {product.ratingAvg?.toFixed(1)} · {product.ratingCount}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
