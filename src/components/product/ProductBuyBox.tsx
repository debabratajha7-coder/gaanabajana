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
    <>
    <div className="container-gb grid gap-6 py-6 sm:gap-10 sm:py-10 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={product.title} className="aspect-square w-full object-cover" />
        </div>
        <div className="scroll-row md:grid md:grid-cols-4 md:gap-2 md:overflow-visible">
          {product.images.map((img) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={img}
              src={img}
              alt=""
              className="aspect-square w-20 rounded-xl border border-[var(--line)] object-cover md:w-auto"
            />
          ))}
        </div>
      </div>

      <div className="pb-24 lg:pb-0">
        {product.brand?.name && (
          <a
            href={`/brands/${product.brand.slug}`}
            className="text-xs uppercase tracking-[0.16em] text-[var(--accent)] sm:text-sm"
          >
            {product.brand.name}
          </a>
        )}
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl sm:text-3xl md:text-5xl">
          {product.title}
        </h1>
        <p className="mt-2 text-sm text-[var(--fg-muted)]">
          ★ {product.ratingAvg?.toFixed(1)} ({product.ratingCount} reviews)
        </p>
        <div className="mt-4 flex flex-wrap items-baseline gap-2 sm:gap-3">
          <span className="text-2xl text-[var(--accent)] sm:text-3xl">{formatINR(variant.price)}</span>
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
          <p className="mt-4 text-sm text-[var(--fg-muted)] sm:text-base">{product.shortDescription}</p>
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
                  className={`min-h-10 rounded-full border px-3 py-1.5 text-sm ${
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

        <div className="mt-6 hidden items-center gap-3 lg:flex">
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
          className="prose-gb mt-8 border-t border-[var(--line)] pt-6 sm:mt-10 sm:pt-8"
          dangerouslySetInnerHTML={{ __html: product.description }}
        />

        <div className="mt-8 sm:mt-10">
          <h2 className="font-[family-name:var(--font-display)] text-xl sm:text-2xl">Reviews</h2>
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

    <div
      className="fixed inset-x-0 z-40 border-t border-[var(--line)] bg-[color-mix(in_oklab,var(--bg)_94%,transparent)] px-3 py-2 backdrop-blur-xl lg:hidden"
      style={{ bottom: "calc(4.25rem + var(--safe-bottom))" }}
    >
      <div className="mx-auto flex max-w-lg items-center gap-2">
        <button
          type="button"
          className="btn btn-ghost shrink-0 px-3"
          onClick={toggleWishlist}
          aria-label="Wishlist"
        >
          <Heart className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="btn btn-primary flex-1"
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
          Add · {formatINR(variant.price)}
        </button>
      </div>
    </div>
    </>
  );
}
