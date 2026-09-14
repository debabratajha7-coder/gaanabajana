"use client";

import { useState } from "react";
import { formatINR, discountPercent } from "@/lib/utils";
import { useCart } from "@/components/providers/CartProvider";
import { Heart } from "lucide-react";

type Product = {
  _id: string;
  title: string;
  slug: string;
  price: number;
  mrp: number;
  description: string;
  shortDescription?: string;
  images: string[];
  stock: number;
  weightKg: number;
  ratingAvg: number;
  ratingCount: number;
  brand?: { name?: string; slug?: string } | null;
  variants: {
    sku: string;
    name: string;
    color?: string;
    price: number;
    mrp: number;
    stock: number;
    image?: string;
  }[];
};

export function ProductBuyBox({
  product,
  reviews,
}: {
  product: Product;
  reviews: { rating: number; title?: string; body: string; user?: { name?: string } }[];
}) {
  const { addItem } = useCart();
  const [variantIdx, setVariantIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState("");
  const variant = product.variants[variantIdx] || {
    name: "Standard",
    price: product.price,
    mrp: product.mrp,
    stock: product.stock,
    sku: product.slug,
  };
  const image = variant.image || product.images[0];
  const save = discountPercent(variant.price, variant.mrp);

  async function toggleWishlist() {
    const res = await fetch("/api/account/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product._id }),
    });
    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }
    setMsg("Added to wishlist");
  }

  return (
    <div className="container-gb grid gap-10 py-10 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={product.title} className="aspect-square w-full object-cover" />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {product.images.map((img) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={img}
              src={img}
              alt=""
              className="aspect-square rounded-xl border border-[var(--line)] object-cover"
            />
          ))}
        </div>
      </div>

      <div>
        {product.brand?.name && (
          <a
            href={`/brands/${product.brand.slug}`}
            className="text-sm uppercase tracking-[0.16em] text-[var(--accent)]"
          >
            {product.brand.name}
          </a>
        )}
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl md:text-5xl">
          {product.title}
        </h1>
        <p className="mt-2 text-sm text-[var(--fg-muted)]">
          ★ {product.ratingAvg?.toFixed(1)} ({product.ratingCount} reviews)
        </p>
        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-3xl text-[var(--accent)]">{formatINR(variant.price)}</span>
          {variant.mrp > variant.price && (
            <span className="text-[var(--fg-muted)] line-through">
              {formatINR(variant.mrp)}
            </span>
          )}
          {save > 0 && (
            <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-xs font-semibold text-[#1a120a]">
              Save {save}%
            </span>
          )}
        </div>
        {product.shortDescription && (
          <p className="mt-4 text-[var(--fg-muted)]">{product.shortDescription}</p>
        )}

        {product.variants.length > 1 && (
          <div className="mt-6">
            <p className="mb-2 text-sm text-[var(--fg-muted)]">Variant</p>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v, i) => (
                <button
                  key={v.sku}
                  type="button"
                  onClick={() => setVariantIdx(i)}
                  className={`rounded-full border px-3 py-1.5 text-sm ${
                    i === variantIdx
                      ? "border-[var(--accent)] text-[var(--accent)]"
                      : "border-[var(--line)]"
                  }`}
                >
                  {v.name}
                  {v.color ? ` · ${v.color}` : ""}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={variant.stock}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value) || 1)}
            className="input w-24"
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              addItem(
                {
                  productId: product._id,
                  slug: product.slug,
                  title: product.title,
                  image,
                  price: variant.price,
                  mrp: variant.mrp,
                  variantName: variant.name,
                  sku: variant.sku,
                  weightKg: product.weightKg,
                },
                qty
              );
              setMsg("Added to cart");
            }}
          >
            Add to cart
          </button>
          <button type="button" className="btn btn-ghost" onClick={toggleWishlist}>
            <Heart className="h-4 w-4" /> Wishlist
          </button>
        </div>
        {msg && <p className="mt-3 text-sm text-[var(--success)]">{msg}</p>}

        <div
          className="prose-gb mt-10 border-t border-[var(--line)] pt-8"
          dangerouslySetInnerHTML={{ __html: product.description }}
        />

        <div className="mt-10">
          <h2 className="font-[family-name:var(--font-display)] text-2xl">Reviews</h2>
          <div className="mt-4 space-y-4">
            {reviews.length === 0 && (
              <p className="text-[var(--fg-muted)]">No approved reviews yet.</p>
            )}
            {reviews.map((r, i) => (
              <div key={i} className="rounded-xl border border-[var(--line)] p-4">
                <p className="text-sm text-[var(--accent)]">
                  ★ {r.rating} · {r.user?.name || "Customer"}
                </p>
                {r.title && <p className="mt-1 font-medium">{r.title}</p>}
                <p className="mt-1 text-[var(--fg-muted)]">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
