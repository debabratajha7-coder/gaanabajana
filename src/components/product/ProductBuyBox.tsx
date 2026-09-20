"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { formatINR } from "@/lib/utils";
import { themedProductImage } from "@/lib/product-image";
import {
  buildAmbientPalette,
  extractImageColors,
} from "@/lib/extract-image-colors";
import { useCart } from "@/components/providers/CartProvider";
import { useToast } from "@/components/ui/Toast";
import {
  Heart,
  Minus,
  Plus,
  Truck,
} from "lucide-react";
import { AmbientMesh } from "@/components/ui/ambient-mesh";
import { AnnotatedText } from "@/components/ui/annotated-text";
import { PriceCutTag } from "@/components/ui/PriceCutTag";
import { Reveal } from "@/components/ui/Reveal";
import { GalleryThumbs } from "@/components/product/GalleryThumbs";
import {
  PdpThemeShell,
  usePdpTheme,
} from "@/components/product/PdpTheme";

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

const EASE = [0.22, 1, 0.36, 1] as const;

function ThemedImg({
  src,
  alt,
  className,
  fillHex,
  fetchPriority,
  style,
}: {
  src: string;
  alt: string;
  className?: string;
  fillHex: string;
  fetchPriority?: "high" | "low" | "auto";
  style?: CSSProperties;
}) {
  const [failed, setFailed] = useState(false);
  const themed = themedProductImage(src, fillHex);
  const finalSrc = failed ? src : themed;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={finalSrc}
      src={finalSrc}
      alt={alt}
      className={className}
      style={style}
      fetchPriority={fetchPriority}
      decoding="async"
      loading={fetchPriority === "high" ? undefined : "lazy"}
      onError={() => setFailed(true)}
    />
  );
}

function ProductBuyBoxInner({
  product,
  children,
}: {
  product: Product;
  children?: ReactNode;
}) {
  const { theme, tokens } = usePdpTheme();
  const { addItem } = useCart();
  const { toast } = useToast();
  const reduce = useReducedMotion() ?? false;
  const images = product.images ?? [];
  const variants = product.variants ?? [];
  const specs = product.specs ?? [];
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
  const [pincode, setPincode] = useState("");
  const [deliveryMsg, setDeliveryMsg] = useState<string | null>(null);

  const variant = variants[variantIdx] || {
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
      : images.length
        ? images
        : [variant.image || "/placeholder-product.jpg"];

  const image = gallery[activeImage] || gallery[0];
  const emiMonthly = Math.max(1, Math.round(variant.price / 12));
  const cartVariantName = selected
    ? selected.name
    : variant.name !== "Standard"
      ? variant.name
      : "";

  const fillHex = tokens.imgBg;
  const isDark = theme === "dark";

  const [palette, setPalette] = useState(() =>
    buildAmbientPalette([], colors[0]?.swatch)
  );

  useEffect(() => {
    let cancelled = false;
    const swatch =
      selectedColor !== null ? colors[selectedColor]?.swatch : colors[0]?.swatch;

    setPalette(buildAmbientPalette([], swatch));

    if (!image) return;

    extractImageColors(image, 4).then((extracted) => {
      if (cancelled) return;
      setPalette(buildAmbientPalette(extracted, swatch));
    });

    return () => {
      cancelled = true;
    };
  }, [image, selectedColor, colors]);

  function selectColor(index: number) {
    setSelectedColor((cur) => (cur === index ? null : index));
    setActiveImage(0);
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
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        aria-hidden
      >
        <AmbientMesh
          colors={palette}
          tone={isDark ? "dark" : "light"}
          className="h-full min-h-full"
        />
      </div>

      <div className="relative z-10">
        <div className="container-gb pt-4 sm:pt-6">
          <nav
            aria-label="Breadcrumb"
            className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-[var(--fg-muted)] sm:text-sm"
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

        <div className="container-gb grid grid-cols-[64px_minmax(0,1fr)] gap-3 py-5 sm:gap-4 sm:py-8 lg:grid-cols-[72px_minmax(0,1.1fr)_minmax(300px,400px)] lg:items-start lg:gap-6 xl:grid-cols-[80px_minmax(0,1.15fr)_minmax(340px,420px)]">
          <Reveal delay={0.04} className="min-h-0">
            <GalleryThumbs
              gallery={gallery}
              activeImage={activeImage}
              onSelect={setActiveImage}
              renderImg={(src, className) => (
                <ThemedImg src={src} alt="" fillHex={fillHex} className={className} />
              )}
            />
          </Reveal>

          <Reveal delay={0.08} className="min-w-0">
            <div className="glass-panel-strong relative overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${theme}-${image}`}
                  initial={
                    reduce ? false : { opacity: 0, scale: 0.97 }
                  }
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduce ? undefined : { opacity: 0, scale: 1.01 }}
                  transition={
                    reduce
                      ? { duration: 0 }
                      : { duration: 0.38, ease: EASE }
                  }
                >
                  <ThemedImg
                    src={image}
                    alt={product.title}
                    fillHex={fillHex}
                    fetchPriority="high"
                    className="aspect-square w-full object-contain p-4 sm:p-8"
                    style={{ backgroundColor: tokens.page }}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </Reveal>

          <Reveal delay={0.12} className="glass-panel-strong col-span-2 min-w-0 p-4 pb-28 sm:p-5 lg:col-span-1 lg:pb-5">
            {product.brand?.name && (
              <Link
                href={`/brands/${product.brand.slug}`}
                className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]"
              >
                {product.brand.name}
              </Link>
            )}
            <h1
              className="mt-1.5 text-xl font-semibold leading-snug sm:text-2xl"
              style={{ color: "var(--pdp-fg)" }}
            >
              {product.title}
              {selected ? ` - ${selected.name}` : ""}
              {variant.name !== "Standard" ? ` / ${variant.name}` : ""}
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--pdp-muted)" }}>
              <span className="text-[var(--accent)]">★</span>{" "}
              {product.ratingAvg?.toFixed(2) || "0.0"}{" "}
              <span className="opacity-80">({product.ratingCount || 0})</span>
            </p>

            <div className="mt-4">
              <PriceCutTag
                layout="inline"
                price={variant.price}
                mrp={variant.mrp}
              />
            </div>

            <div
              className="mt-4 border px-3.5 py-3 text-sm"
              style={{
                borderColor:
                  "color-mix(in oklab, var(--accent) 35%, transparent)",
                backgroundColor:
                  "color-mix(in oklab, var(--accent) 12%, var(--pdp-panel))",
              }}
            >
              <p className="font-medium" style={{ color: "var(--pdp-fg)" }}>
                {formatINR(emiMonthly)}/month · EMI options available
              </p>
              <p className="mt-0.5 text-xs" style={{ color: "var(--pdp-muted)" }}>
                Approx. 12× EMI · confirm plans at checkout
              </p>
            </div>

            <p className="mt-4 text-xs" style={{ color: "var(--pdp-muted)" }}>
              SKU:{" "}
              <span className="font-medium" style={{ color: "var(--pdp-fg)" }}>
                {variant.sku}
              </span>
            </p>

            {colors.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-sm" style={{ color: "var(--pdp-fg)" }}>
                  Color:{" "}
                  <span className="font-medium">
                    {selected?.name || "Select"}
                  </span>
                </p>
                <div className="flex flex-wrap items-center gap-2.5">
                  {colors.map((c, i) => {
                    const active = selectedColor === i;
                    return (
                      <motion.button
                        key={`${c.name}-${i}`}
                        type="button"
                        title={c.name}
                        aria-label={c.name}
                        aria-pressed={active}
                        onClick={() => selectColor(i)}
                        initial={false}
                        animate={{
                          scale: active ? 1.12 : 1,
                        }}
                        whileHover={reduce ? undefined : { scale: active ? 1.14 : 1.06 }}
                        transition={{ duration: 0.28, ease: EASE }}
                        className={`h-9 w-9 rounded-full border-2 transition ${
                          active
                            ? "border-[var(--pdp-fg)] shadow-[0_4px_14px_color-mix(in_oklab,var(--pdp-fg)_22%,transparent)]"
                            : "border-transparent ring-1 ring-[color-mix(in_oklab,var(--pdp-fg)_25%,transparent)]"
                        }`}
                        style={{ backgroundColor: c.swatch || "#888" }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {variants.length > 1 && (
              <div className="mt-5">
                <p className="mb-2 text-sm" style={{ color: "var(--pdp-fg)" }}>
                  Option: <span className="font-medium">{variant.name}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v, i) => (
                    <button
                      key={v.sku}
                      type="button"
                      onClick={() => setVariantIdx(i)}
                      className="min-h-10 border px-3.5 py-1.5 text-sm transition"
                      style={{
                        borderColor:
                          i === variantIdx
                            ? "var(--pdp-fg)"
                            : "var(--pdp-border)",
                        backgroundColor:
                          i === variantIdx
                            ? "color-mix(in oklab, var(--pdp-fg) 8%, transparent)"
                            : "transparent",
                        color: "var(--pdp-fg)",
                        fontWeight: i === variantIdx ? 600 : 400,
                      }}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div
              className="mt-6 space-y-3 border-t pt-5"
              style={{ borderColor: "var(--pdp-border)" }}
            >
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--pdp-fg)" }}
              >
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
                  style={{
                    borderColor: "var(--pdp-border)",
                    backgroundColor:
                      "color-mix(in oklab, var(--pdp-fg) 4%, transparent)",
                    color: "var(--pdp-fg)",
                  }}
                />
                <button
                  type="button"
                  className="btn btn-ghost shrink-0 bg-transparent px-4 text-xs font-semibold uppercase tracking-wide"
                  style={{
                    borderColor: "var(--pdp-border)",
                    color: "var(--pdp-fg)",
                  }}
                  onClick={checkPincode}
                >
                  Check
                </button>
              </div>
              {deliveryMsg && (
                <p
                  className={`flex items-center gap-2 text-sm ${
                    deliveryMsg.startsWith("Enter")
                      ? "text-red-400"
                      : isDark
                        ? "text-emerald-400"
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
                <p
                  className={`flex items-center gap-2 text-sm ${
                    isDark ? "text-emerald-400" : "text-emerald-700"
                  }`}
                >
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
                className="btn btn-ghost min-w-0 flex-1 border-2 bg-transparent"
                style={{
                  borderColor: "var(--pdp-fg)",
                  color: "var(--pdp-fg)",
                }}
                onClick={buyNow}
              >
                <AnnotatedText
                  variant="underline"
                  color="text-[var(--accent)]"
                  delay={0.4}
                  duration={0.75}
                >
                  Buy it now
                </AnnotatedText>
              </button>
            </div>
            <button
              type="button"
              className="mt-3 hidden items-center gap-2 text-sm lg:inline-flex"
              style={{ color: "var(--pdp-muted)" }}
              onClick={toggleWishlist}
            >
              <Heart className="h-4 w-4" /> Save to wishlist
            </button>

            {!!specs.length && (
              <div
                className="mt-6 border-t pt-5"
                style={{ borderColor: "var(--pdp-border)" }}
              >
                <h2
                  className="text-sm font-semibold"
                  style={{ color: "var(--pdp-fg)" }}
                >
                  Specs
                </h2>
                <dl
                  className="mt-3 max-h-[28rem] overflow-y-auto border"
                  style={{ borderColor: "var(--pdp-border)" }}
                >
                  {specs.map((s) => (
                    <div
                      key={`${s.label}-${s.value}`}
                      className="grid grid-cols-2 gap-3 border-b px-3 py-2 text-sm last:border-b-0"
                      style={{ borderColor: "var(--pdp-border)" }}
                    >
                      <dt style={{ color: "var(--pdp-muted)" }}>{s.label}</dt>
                      <dd
                        className="font-medium"
                        style={{ color: "var(--pdp-fg)" }}
                      >
                        {s.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </Reveal>
        </div>

        {(product.shortDescription || product.description) && (
          <div
            className="container-gb space-y-6 border-t py-10 sm:py-12"
            style={{ borderColor: "var(--pdp-border)" }}
          >
            {product.shortDescription && (
              <p className="glass-panel max-w-3xl p-4 text-base leading-relaxed text-[var(--pdp-muted)] sm:p-5">
                {product.shortDescription}
              </p>
            )}
            {product.description && (
              <div
                className="prose-gb glass-panel max-w-3xl p-4 sm:p-5 [&_h1]:text-[var(--pdp-fg)] [&_h2]:text-[var(--pdp-fg)] [&_h3]:text-[var(--pdp-fg)] [&_li]:text-[var(--pdp-muted)] [&_p]:text-[var(--pdp-muted)] [&_strong]:text-[var(--pdp-fg)]"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            )}
          </div>
        )}

        {children}
      </div>

      <div className="glass-bar fixed inset-x-0 bottom-[calc(4.5rem+var(--safe-bottom))] z-40 px-3 py-2.5 lg:bottom-0 lg:px-6">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="hidden min-w-0 items-center gap-3 sm:flex">
            <ThemedImg
              src={image}
              alt=""
              fillHex={fillHex}
              className="h-11 w-11 shrink-0 border object-contain"
              style={{
                borderColor: "var(--pdp-border)",
                backgroundColor: "var(--pdp-panel)",
              }}
            />
            <div className="min-w-0">
              <p
                className="truncate text-sm font-medium"
                style={{ color: "var(--pdp-fg)" }}
              >
                {product.title}
              </p>
              <p className="text-sm font-semibold text-[var(--price)]">
                {formatINR(variant.price)}
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div
              className="hidden items-center border sm:flex"
              style={{ borderColor: "var(--pdp-border)" }}
            >
              <button
                type="button"
                className="px-2.5 py-2 text-sm"
                style={{ color: "var(--pdp-muted)" }}
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span
                className="min-w-[1.5rem] text-center text-sm font-medium"
                style={{ color: "var(--pdp-fg)" }}
              >
                {qty}
              </span>
              <button
                type="button"
                className="px-2.5 py-2 text-sm"
                style={{ color: "var(--pdp-muted)" }}
                onClick={() =>
                  setQty((q) => Math.min(variant.stock || 99, q + 1))
                }
                aria-label="Increase quantity"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              type="button"
              className="btn btn-ghost shrink-0 bg-transparent px-3 lg:hidden"
              style={{
                borderColor: "var(--pdp-border)",
                color: "var(--pdp-fg)",
              }}
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
              className="btn btn-ghost hidden shrink-0 whitespace-nowrap border-2 bg-transparent px-4 sm:inline-flex"
              style={{
                borderColor: "var(--pdp-fg)",
                color: "var(--pdp-fg)",
              }}
              onClick={buyNow}
            >
              <AnnotatedText
                variant="underline"
                color="text-[var(--accent)]"
                delay={0.35}
                duration={0.7}
              >
                Buy it now
              </AnnotatedText>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export function ProductBuyBox({
  product,
  children,
}: {
  product: Product;
  children?: ReactNode;
}) {
  return (
    <PdpThemeShell>
      <ProductBuyBoxInner product={product}>{children}</ProductBuyBoxInner>
    </PdpThemeShell>
  );
}
