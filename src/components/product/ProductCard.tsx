import Link from "next/link";
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
    <Link
      href={`/products/${product.slug}`}
      className="group block overflow-hidden rounded-2xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--bg-elevated)_90%,transparent)] backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--accent)_55%,transparent)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[var(--bg-soft)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.images?.[0] || "/placeholder-product.jpg"}
          alt={product.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {save > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-semibold text-[#1a120a] sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-xs">
            Save {save}%
          </span>
        )}
      </div>
      <div className="space-y-1 p-3 sm:p-4">
        {product.brand?.name && (
          <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--fg-muted)] sm:text-xs">
            {product.brand.name}
          </p>
        )}
        <h3 className="line-clamp-2 font-[family-name:var(--font-display)] text-sm leading-snug sm:text-lg">
          {product.title}
        </h3>
        <div className="flex flex-wrap items-baseline gap-1.5 pt-1 sm:gap-2">
          <span className="text-sm text-[var(--accent)] sm:text-base">
            {formatINR(product.price)}
          </span>
          {product.mrp > product.price && (
            <span className="text-xs text-[var(--fg-muted)] line-through sm:text-sm">
              {formatINR(product.mrp)}
            </span>
          )}
        </div>
        {!!product.ratingCount && (
          <p className={cn("text-[10px] text-[var(--fg-muted)] sm:text-xs")}>
            ★ {product.ratingAvg?.toFixed(1)} ({product.ratingCount})
          </p>
        )}
      </div>
    </Link>
  );
}
