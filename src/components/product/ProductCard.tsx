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
  brandName?: string | null;
  onSale?: boolean;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const save = discountPercent(product.price, product.mrp);
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <Link
        href={`/products/${product.slug}`}
        className="group block overflow-hidden border border-[var(--line)] bg-[var(--bg-elevated)] transition duration-300 hover:border-[var(--line-strong)]"
      >
        <div className="relative aspect-[4/5] overflow-hidden border-b border-[var(--line)] bg-[var(--bg-soft)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.images?.[0] || "/placeholder-product.jpg"}
            alt={product.title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
            loading="lazy"
          />
          {save > 0 && (
            <span className="absolute left-0 top-0 border-b border-r border-[var(--line)] bg-[var(--accent)] px-2.5 py-1 text-[10px] font-semibold text-[#1a120a] sm:text-xs">
              −{save}%
            </span>
          )}
        </div>
        <div className="space-y-1.5 p-3 sm:p-4">
          {product.brandName && (
            <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--fg-muted)] sm:text-[11px]">
              {product.brandName}
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
