"use client";

import { useEffect, useState } from "react";
import { ProductCard, ProductCardData } from "@/components/product/ProductCard";

type ApiProduct = {
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

export default function WishlistPage() {
  const [items, setItems] = useState<ProductCardData[]>([]);

  useEffect(() => {
    fetch("/api/account/wishlist")
      .then((r) => r.json())
      .then((d) =>
        setItems(
          (d.items || []).map((p: ApiProduct) => ({
            _id: String(p._id),
            title: p.title,
            slug: p.slug,
            price: p.price,
            mrp: p.mrp,
            images: p.images,
            ratingAvg: p.ratingAvg,
            ratingCount: p.ratingCount,
            brandName: p.brand?.name || null,
            onSale: p.onSale,
          }))
        )
      );
  }, []);

  return (
    <div className="container-gb py-12">
      <h1 className="display text-3xl sm:text-4xl">Wishlist</h1>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
      {items.length === 0 && (
        <p className="mt-6 text-[var(--fg-muted)]">Your wishlist is empty.</p>
      )}
    </div>
  );
}
