"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { mapColorOptions, type ProductCardData } from "@/lib/product-card";

type ApiProduct = {
  _id: string;
  title: string;
  slug: string;
  price: number;
  mrp: number;
  images?: string[];
  colorOptions?: { name?: string; swatch?: string; images?: string[] }[];
  ratingAvg?: number;
  ratingCount?: number;
  brand?: { name?: string } | null;
  onSale?: boolean;
};

export default function WishlistPage() {
  const [items, setItems] = useState<ProductCardData[]>([]);
  const [removing, setRemoving] = useState<string | null>(null);

  function load() {
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
            colorOptions: mapColorOptions(p.colorOptions),
            ratingAvg: p.ratingAvg,
            ratingCount: p.ratingCount,
            brandName: p.brand?.name || null,
            onSale: p.onSale,
          }))
        )
      );
  }

  useEffect(load, []);

  async function remove(productId: string) {
    setRemoving(productId);
    await fetch("/api/account/wishlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    setItems((prev) => prev.filter((p) => p._id !== productId));
    setRemoving(null);
  }

  return (
    <div className="container-gb py-12">
      <h1 className="display text-3xl sm:text-4xl">Wishlist</h1>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {items.map((p) => (
          <div key={p._id} className="relative">
            <ProductCard product={p} />
            <button
              type="button"
              className="btn btn-ghost btn-sm mt-2 w-full"
              disabled={removing === p._id}
              onClick={() => remove(p._id)}
            >
              {removing === p._id ? "Removing…" : "Remove"}
            </button>
          </div>
        ))}
      </div>
      {items.length === 0 && (
        <p className="mt-6 text-[var(--fg-muted)]">Your wishlist is empty.</p>
      )}
    </div>
  );
}
