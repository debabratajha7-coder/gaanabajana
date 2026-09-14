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
      className="group block overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] transition hover:border-[color-mix(in_oklab,var(--accent)_50%,transparent)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[var(--bg-soft)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.images?.[0] || "/placeholder-product.jpg"}
          alt={product.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        {save > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-[var(--accent)] px-2.5 py-1 text-xs font-semibold text-[#1a120a]">
            Save {save}%
          </span>
        )}
      </div>
      <div className="space-y-1 p-4">
        {product.brand?.name && (
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--fg-muted)]">
            {product.brand.name}
          </p>
        )}
        <h3 className="line-clamp-2 font-[family-name:var(--font-display)] text-lg leading-snug">
          {product.title}
        </h3>
        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-[var(--accent)]">{formatINR(product.price)}</span>
          {product.mrp > product.price && (
            <span className="text-sm text-[var(--fg-muted)] line-through">
              {formatINR(product.mrp)}
            </span>
          )}
        </div>
        {!!product.ratingCount && (
          <p className={cn("text-xs text-[var(--fg-muted)]")}>
            ★ {product.ratingAvg?.toFixed(1)} ({product.ratingCount})
          </p>
        )}
      </div>
    </Link>
  );
}
