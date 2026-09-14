"use client";

import { useEffect, useState } from "react";
import { ProductCard, ProductCardData } from "@/components/product/ProductCard";

export default function WishlistPage() {
  const [items, setItems] = useState<ProductCardData[]>([]);

  useEffect(() => {
    fetch("/api/account/wishlist")
      .then((r) => r.json())
      .then((d) =>
        setItems(
          (d.items || []).map((p: ProductCardData & { _id: string }) => ({
            ...p,
            _id: String(p._id),
          }))
        )
      );
  }, []);

  return (
    <div className="container-gb py-12">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">Wishlist</h1>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
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
