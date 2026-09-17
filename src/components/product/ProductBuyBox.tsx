"use client";

import { useState } from "react";
import { formatINR, discountPercent } from "@/lib/utils";
import { useCart } from "@/components/providers/CartProvider";
import { useToast } from "@/components/ui/Toast";
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
  const { toast } = useToast();
  const [variantIdx, setVariantIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const variant = product.variants[variantIdx] || {
    name: "Standard",
    price: product.price,
    mrp: product.mrp,
    stock: product.stock,
    sku: product.slug,
  };
  const gallery = product.images.length
    ? product.images
    : [variant.image || "/placeholder-product.jpg"];
  const image = variant.image || gallery[activeImage] || gallery[0];
  const save = discountPercent(variant.price, variant.mrp);

  function addToCart() {
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
    toast("Added to cart");
  }

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
    if (!res.ok) {
      toast("Could not update wishlist", "error");
      return;
    }
    toast("Saved to wishlist");
  }

  return (
    <>
      <div className="container-gb grid gap-8 py-6 sm:gap-12 sm:py-12 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={gallery[activeImage] || image}
              alt={product.title}
              className="aspect-square w-full object-cover"
            />
          </div>
          {gallery.length > 1 && (
            <div className="scroll-row md:grid md:grid-cols-4 md:gap-2 md:overflow-visible">
              {gallery.map((img, i) => (
                <button
                  key={img + i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`overflow-hidden rounded-xl border transition ${
                    activeImage === i
                      ? "border-[var(--accent)]"
                      : "border-[var(--line)] opacity-80 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt=""
                    className="aspect-square w-20 object-cover md:w-auto"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pb-28 lg:pb-0">
          {product.brand?.name && (
            <a
              href={`/brands/${product.brand.slug}`}
              className="eyebrow text-[var(--accent)]"
            >
              {product.brand.name}
            </a>
          )}
          <h1 className="display mt-2 text-2xl sm:text-3xl md:text-[2.75rem]">
            {product.title}
          </h1>
          <p className="mt-3 text-sm text-[var(--fg-muted)]">
            ★ {product.ratingAvg?.toFixed(1)} · {product.ratingCount} reviews
          </p>

          <div className="mt-5 flex flex-wrap items-baseline gap-2.5">
            <span className="text-2xl font-semibold text-[var(--accent)] sm:text-3xl">
              {formatINR(variant.price)}
            </span>
            {variant.mrp > variant.price && (
              <span className="text-[var(--fg-muted)] line-through">
                {formatINR(variant.mrp)}
              </span>
            )}
            {save > 0 && (
              <span className="rounded bg-[#1d4ed8] px-2 py-0.5 text-xs font-semibold text-white">
                Save {save}%
              </span>
            )}
          </div>

          {product.shortDescription && (
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-[var(--fg-muted)] sm:text-base">
              {product.shortDescription}
            </p>
          )}

          {product.variants.length > 1 && (
            <div className="mt-7">
              <p className="mb-2 text-sm text-[var(--fg-muted)]">Choose option</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v, i) => (
                  <button
                    key={v.sku}
                    type="button"
                    onClick={() => setVariantIdx(i)}
                    className={`min-h-10 rounded-full border px-3.5 py-1.5 text-sm transition ${
                      i === variantIdx
                        ? "border-[var(--accent)] text-[var(--accent)]"
                        : "border-[var(--line)] hover:border-[var(--line-strong)]"
                    }`}
                  >
                    {v.name}
                    {v.color ? ` · ${v.color}` : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-7 hidden items-center gap-3 lg:flex">
            <input
              type="number"
              min={1}
              max={variant.stock}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value) || 1)}
              className="input w-24 shrink-0"
            />
            <button
              type="button"
              className="btn btn-primary shrink-0 whitespace-nowrap px-6"
              onClick={addToCart}
            >
              Add to cart
            </button>
            <button
              type="button"
              className="btn btn-ghost shrink-0 whitespace-nowrap"
              onClick={toggleWishlist}
            >
              <Heart className="h-4 w-4" /> Save
            </button>
          </div>

          <div
            className="prose-gb mt-10 border-t border-[var(--line)] pt-8"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />

          <div className="mt-10">
            <h2 className="display text-xl sm:text-2xl">Reviews</h2>
            <div className="mt-4 space-y-3">
              {reviews.length === 0 && (
                <p className="text-sm text-[var(--fg-muted)]">No reviews yet.</p>
              )}
              {reviews.map((r, i) => (
                <div key={i} className="surface p-4">
                  <p className="text-sm text-[var(--accent)]">
                    ★ {r.rating} · {r.user?.name || "Customer"}
                  </p>
                  {r.title && <p className="mt-1 font-medium">{r.title}</p>}
                  <p className="mt-1 text-sm text-[var(--fg-muted)]">{r.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        className="fixed inset-x-0 z-40 border-t border-[var(--line)] bg-[color-mix(in_oklab,var(--bg)_94%,transparent)] px-3 py-2.5 backdrop-blur-xl lg:hidden"
        style={{ bottom: "calc(4.5rem + var(--safe-bottom))" }}
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
            className="btn btn-primary min-w-0 flex-1 whitespace-nowrap"
            onClick={addToCart}
          >
            Add to cart · {formatINR(variant.price)}
          </button>
        </div>
      </div>
    </>
  );
}
