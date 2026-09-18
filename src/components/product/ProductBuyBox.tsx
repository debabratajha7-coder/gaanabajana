"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatINR, discountPercent } from "@/lib/utils";
import { useCart } from "@/components/providers/CartProvider";
import { useToast } from "@/components/ui/Toast";
import { ProductCard } from "@/components/product/ProductCard";
import type { ProductCardData } from "@/lib/product-card";
import {
  ChevronDown,
  ChevronUp,
  Heart,
  Truck,
} from "lucide-react";

type ColorOption = {
  name: string;
  swatch: string;
  images: string[];
};

type Product = {
  _id: string;
  title: string;
  slug: string;
  price: number;
  mrp: number;
  description: string;
  shortDescription?: string;
  images: string[];
  colorOptions?: ColorOption[];
  specs?: { label: string; value: string }[];
  stock: number;
  weightKg: number;
  ratingAvg: number;
  ratingCount: number;
  brand?: { name?: string; slug?: string } | null;
  categoryTrail?: { name: string; slug: string }[];
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

const THUMB_VISIBLE = 5;

export function ProductBuyBox({
  product,
  reviews,
  essentials = [],
}: {
  product: Product;
  reviews: {
    rating: number;
    title?: string;
    body: string;
    user?: { name?: string };
  }[];
  essentials?: ProductCardData[];
}) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const colors = useMemo(
    () => (product.colorOptions || []).filter((c) => c.name),
    [product.colorOptions]
  );
  const [selectedColor, setSelectedColor] = useState<number | null>(
    colors.length ? 0 : null
  );
  const [variantIdx, setVariantIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [thumbStart, setThumbStart] = useState(0);
  const [pincode, setPincode] = useState("");
  const [deliveryMsg, setDeliveryMsg] = useState<string | null>(null);

  const variant = product.variants[variantIdx] || {
    name: "Standard",
    price: product.price,
    mrp: product.mrp,
    stock: product.stock,
    sku: product.slug,
  };

  const selected = selectedColor !== null ? colors[selectedColor] : null;
  const gallery =
    selected?.images?.length
      ? selected.images
      : product.images.length
        ? product.images
        : [variant.image || "/placeholder-product.jpg"];

  const image = gallery[activeImage] || gallery[0];
  const save = discountPercent(variant.price, variant.mrp);
  const emiMonthly = Math.max(1, Math.round(variant.price / 12));
  const cartVariantName = selected
    ? selected.name
    : variant.name !== "Standard"
      ? variant.name
      : "";

  const visibleThumbs = gallery.slice(thumbStart, thumbStart + THUMB_VISIBLE);

  function selectColor(index: number) {
    setSelectedColor((cur) => (cur === index ? null : index));
    setActiveImage(0);
    setThumbStart(0);
  }

  function addToCart() {
    addItem(
      {
        productId: product._id,
        slug: product.slug,
        title: product.title,
        image,
        price: variant.price,
        mrp: variant.mrp,
        variantName: cartVariantName,
        sku: selected
          ? `${variant.sku}-${selected.name.toLowerCase().replace(/\s+/g, "-")}`
          : variant.sku,
        weightKg: product.weightKg,
      },
      qty
    );
    toast(selected ? `Added to cart · ${selected.name}` : "Added to cart");
  }

  function buyNow() {
    addToCart();
    window.location.href = "/checkout";
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

  function checkPincode() {
    const pin = pincode.trim();
    if (!/^\d{6}$/.test(pin)) {
      setDeliveryMsg("Enter a valid 6-digit pincode.");
      return;
    }
    setDeliveryMsg("Dispatches in 24–48 hours to " + pin + ".");
  }

  const trail = product.categoryTrail || [];

  return (
    <>
      <div className="container-gb pt-4 sm:pt-6">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--fg-muted)] sm:text-sm"
        >
          <Link href="/" className="hover:text-[var(--fg)]">
            Home
          </Link>
          {trail.map((c) => (
            <span key={c.slug} className="contents">
              <span aria-hidden>/</span>
              <Link
                href={`/collections/${c.slug}`}
                className="hover:text-[var(--fg)]"
              >
                {c.name}
              </Link>
            </span>
          ))}
          <span aria-hidden>/</span>
          <span className="line-clamp-1 text-[var(--fg)]">{product.title}</span>
        </nav>
      </div>

      <div className="container-gb grid gap-6 py-5 sm:gap-8 sm:py-8 lg:grid-cols-[72px_minmax(0,1.1fr)_minmax(300px,400px)] lg:items-start xl:grid-cols-[80px_minmax(0,1.15fr)_minmax(340px,420px)]">
        {/* Vertical thumbs (desktop) */}
        <div className="hidden lg:flex lg:flex-col lg:items-center lg:gap-2">
          {gallery.length > THUMB_VISIBLE && (
            <button
              type="button"
              aria-label="Previous images"
              disabled={thumbStart === 0}
              onClick={() => setThumbStart((s) => Math.max(0, s - 1))}
              className="flex h-8 w-8 items-center justify-center border border-[var(--line)] text-[var(--fg-muted)] transition hover:border-[var(--fg)] disabled:opacity-30"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
          )}
          <div className="flex flex-col gap-2">
            {visibleThumbs.map((img, i) => {
              const idx = thumbStart + i;
              return (
                <button
                  key={img + idx}
                  type="button"
                  onClick={() => setActiveImage(idx)}
                  className={`overflow-hidden border bg-white transition ${
                    activeImage === idx
                      ? "border-[var(--fg)]"
                      : "border-[var(--line)] opacity-80 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt=""
                    className="h-[68px] w-[68px] object-contain xl:h-[76px] xl:w-[76px]"
                  />
                </button>
              );
            })}
          </div>
          {gallery.length > THUMB_VISIBLE && (
            <button
              type="button"
              aria-label="Next images"
              disabled={thumbStart + THUMB_VISIBLE >= gallery.length}
              onClick={() =>
                setThumbStart((s) =>
                  Math.min(gallery.length - THUMB_VISIBLE, s + 1)
                )
              }
              className="flex h-8 w-8 items-center justify-center border border-[var(--line)] text-[var(--fg-muted)] transition hover:border-[var(--fg)] disabled:opacity-30"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Main image */}
        <div className="min-w-0 space-y-3">
          <div className="overflow-hidden border border-[var(--line)] bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={product.title}
              className="aspect-square w-full object-contain p-4 sm:p-8"
            />
          </div>
          {gallery.length > 1 && (
            <div className="scroll-row gap-2 lg:hidden">
              {gallery.map((img, i) => (
                <button
                  key={img + i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`shrink-0 overflow-hidden border transition ${
                    activeImage === i
                      ? "border-[var(--fg)]"
                      : "border-[var(--line)] opacity-80"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt=""
                    className="h-16 w-16 object-contain sm:h-20 sm:w-20"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Buy panel */}
        <div className="min-w-0 pb-28 lg:pb-8">
          {product.brand?.name && (
            <Link
              href={`/brands/${product.brand.slug}`}
              className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]"
            >
              {product.brand.name}
            </Link>
          )}
          <h1 className="mt-1.5 text-xl font-semibold leading-snug text-[var(--fg)] sm:text-2xl">
            {product.title}
            {selected ? ` - ${selected.name}` : ""}
            {variant.name !== "Standard" ? ` / ${variant.name}` : ""}
          </h1>
          <p className="mt-2 text-sm text-[var(--fg-muted)]">
            <span className="text-[var(--accent)]">★</span>{" "}
            {product.ratingAvg?.toFixed(2) || "0.0"}{" "}
            <span className="text-[var(--fg-muted)]">
              ({product.ratingCount || 0})
            </span>
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <span className="text-2xl font-semibold text-[var(--accent)] sm:text-[1.75rem]">
              {formatINR(variant.price)}
            </span>
            {variant.mrp > variant.price && (
              <span className="text-base text-[var(--fg-muted)] line-through">
                {formatINR(variant.mrp)}
              </span>
            )}
            {save > 0 && (
              <span className="rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-xs font-semibold text-white">
                {save}% OFF
              </span>
            )}
          </div>

          <div className="mt-4 border border-[color-mix(in_oklab,var(--accent)_22%,var(--line))] bg-[color-mix(in_oklab,var(--accent)_6%,white)] px-3.5 py-3 text-sm">
            <p className="font-medium text-[var(--fg)]">
              {formatINR(emiMonthly)}/month · EMI options available
            </p>
            <p className="mt-0.5 text-xs text-[var(--fg-muted)]">
              Approx. 12× EMI · confirm plans at checkout
            </p>
          </div>

          <p className="mt-4 text-xs text-[var(--fg-muted)]">
            SKU:{" "}
            <span className="font-medium text-[var(--fg)]">{variant.sku}</span>
          </p>

          {colors.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-sm text-[var(--fg)]">
                Color:{" "}
                <span className="font-medium">
                  {selected?.name || "Select"}
                </span>
              </p>
              <div className="flex flex-wrap items-center gap-2.5">
                {colors.map((c, i) => {
                  const active = selectedColor === i;
                  return (
                    <button
                      key={`${c.name}-${i}`}
                      type="button"
                      title={c.name}
                      aria-label={c.name}
                      aria-pressed={active}
                      onClick={() => selectColor(i)}
                      className={`h-9 w-9 rounded-full border-2 transition ${
                        active
                          ? "border-[var(--fg)]"
                          : "border-transparent ring-1 ring-black/15 hover:ring-black/35"
                      }`}
                      style={{ backgroundColor: c.swatch || "#888" }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {product.variants.length > 1 && (
            <div className="mt-5">
              <p className="mb-2 text-sm text-[var(--fg)]">
                Option:{" "}
                <span className="font-medium">{variant.name}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v, i) => (
                  <button
                    key={v.sku}
                    type="button"
                    onClick={() => setVariantIdx(i)}
                    className={`min-h-10 border px-3.5 py-1.5 text-sm transition ${
                      i === variantIdx
                        ? "border-[var(--fg)] bg-white font-medium"
                        : "border-[var(--line)] hover:border-[var(--line-strong)]"
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 space-y-3 border-t border-[var(--line)] pt-5">
            <p className="text-sm font-semibold text-[var(--fg)]">
              Shipping details
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter pincode for delivery estimate"
                value={pincode}
                onChange={(e) => {
                  setPincode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setDeliveryMsg(null);
                }}
                className="input min-w-0 flex-1 text-sm"
              />
              <button
                type="button"
                className="btn btn-ghost shrink-0 px-4 text-xs font-semibold uppercase tracking-wide"
                onClick={checkPincode}
              >
                Check
              </button>
            </div>
            {deliveryMsg && (
              <p
                className={`flex items-center gap-2 text-sm ${
                  deliveryMsg.startsWith("Enter")
                    ? "text-[var(--danger)]"
                    : "text-emerald-700"
                }`}
              >
                {!deliveryMsg.startsWith("Enter") && (
                  <Truck className="h-4 w-4 shrink-0" />
                )}
                {deliveryMsg}
              </p>
            )}
            {!deliveryMsg && (
              <p className="flex items-center gap-2 text-sm text-emerald-700">
                <Truck className="h-4 w-4 shrink-0" />
                Dispatches in 24–48 hours
              </p>
            )}
          </div>

          <div className="mt-6 hidden gap-2 lg:flex">
            <button
              type="button"
              className="btn btn-primary min-w-0 flex-1"
              onClick={addToCart}
            >
              Add to cart
            </button>
            <button
              type="button"
              className="btn btn-ghost min-w-0 flex-1 border border-[var(--fg)]"
              onClick={buyNow}
            >
              Buy it now
            </button>
          </div>
          <button
            type="button"
            className="mt-3 hidden items-center gap-2 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] lg:inline-flex"
            onClick={toggleWishlist}
          >
            <Heart className="h-4 w-4" /> Save to wishlist
          </button>

          {!!product.specs?.length && (
            <div className="mt-6 border-t border-[var(--line)] pt-5">
              <h2 className="text-sm font-semibold text-[var(--fg)]">Specs</h2>
              <dl className="mt-3 max-h-[28rem] divide-y divide-[var(--line)] overflow-y-auto border border-[var(--line)]">
                {product.specs.map((s) => (
                  <div
                    key={`${s.label}-${s.value}`}
                    className="grid grid-cols-2 gap-3 px-3 py-2 text-sm"
                  >
                    <dt className="text-[var(--fg-muted)]">{s.label}</dt>
                    <dd className="font-medium text-[var(--fg)]">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      {essentials.length > 0 && (
        <section className="container-gb border-t border-[var(--line)] py-10 sm:py-12">
          <h2 className="text-xl font-semibold text-[var(--fg)] sm:text-2xl">
            Essentials
          </h2>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">
            Pair it with the gear most shoppers add next
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {essentials.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

      <div className="container-gb space-y-10 border-t border-[var(--line)] py-10 sm:py-12">
        {product.shortDescription && (
          <p className="max-w-3xl text-base leading-relaxed text-[var(--fg-muted)]">
            {product.shortDescription}
          </p>
        )}

        {product.description && (
          <div
            className="prose-gb max-w-3xl"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        )}

        <div>
          <h2 className="text-lg font-semibold text-[var(--fg)] sm:text-xl">
            Reviews
          </h2>
          <div className="mt-4 max-w-2xl space-y-3">
            {reviews.length === 0 && (
              <p className="text-sm text-[var(--fg-muted)]">No reviews yet.</p>
            )}
            {reviews.map((r, i) => (
              <div key={i} className="border border-[var(--line)] p-4">
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

      {/* Sticky ATC — sits above mobile bottom nav; flush on desktop */}
      <div className="fixed inset-x-0 bottom-[calc(4.5rem+var(--safe-bottom))] z-40 border-t border-[var(--line)] bg-[color-mix(in_oklab,var(--bg)_94%,transparent)] px-3 py-2.5 backdrop-blur-xl lg:bottom-0 lg:px-6">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="hidden min-w-0 items-center gap-3 sm:flex">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt=""
              className="h-11 w-11 shrink-0 border border-[var(--line)] object-contain"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--fg)]">
                {product.title}
              </p>
              <p className="text-sm font-semibold text-[var(--accent)]">
                {formatINR(variant.price)}
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center border border-[var(--line)] sm:flex">
              <button
                type="button"
                className="px-2.5 py-2 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                ‹
              </button>
              <span className="min-w-[1.5rem] text-center text-sm font-medium">
                {qty}
              </span>
              <button
                type="button"
                className="px-2.5 py-2 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]"
                onClick={() =>
                  setQty((q) => Math.min(variant.stock || 99, q + 1))
                }
                aria-label="Increase quantity"
              >
                ›
              </button>
            </div>
            <button
              type="button"
              className="btn btn-ghost shrink-0 px-3 lg:hidden"
              onClick={toggleWishlist}
              aria-label="Wishlist"
            >
              <Heart className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="btn btn-primary shrink-0 whitespace-nowrap px-4 sm:px-6"
              onClick={addToCart}
            >
              Add to cart
            </button>
            <button
              type="button"
              className="btn btn-ghost hidden shrink-0 whitespace-nowrap border border-[var(--fg)] px-4 sm:inline-flex"
              onClick={buyNow}
            >
              Buy it now
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
