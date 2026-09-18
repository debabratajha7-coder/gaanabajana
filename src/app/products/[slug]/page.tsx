import Link from "next/link";
import { Suspense } from "react";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { ProductBuyBox } from "@/components/product/ProductBuyBox";
import { ProductSecondary } from "@/components/product/ProductSecondary";
import { ProductSecondarySkeleton } from "@/components/ui/Skeleton";
import { sanitizeHtml } from "@/lib/sanitize";
import { toPlain } from "@/lib/utils";
import type { Types } from "mongoose";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    await connectDB();
  } catch {
    return (
      <div className="container-gb py-16 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          Product unavailable
        </h1>
        <p className="mt-3 text-[var(--fg-muted)]">
          Database is not connected on this host. Check{" "}
          <Link href="/api/health" className="text-[var(--accent)]">
            /api/health
          </Link>
          .
        </p>
      </div>
    );
  }

  let product;
  try {
    product = await Product.findOne({ slug, isActive: true })
      .populate("brand", "name slug")
      .populate("categories", "name slug parent")
      .lean();
  } catch (err) {
    console.error("product lookup failed", slug, err);
    return (
      <div className="container-gb py-16 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          Product temporarily unavailable
        </h1>
        <p className="mt-3 text-[var(--fg-muted)]">
          Please refresh in a moment.
        </p>
        <Link href="/" className="btn btn-primary mt-6">
          Home
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-gb py-16 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          Product not found
        </h1>
        <Link href="/" className="btn btn-primary mt-6">
          Home
        </Link>
      </div>
    );
  }

  const brand = product.brand as { name?: string; slug?: string } | null;
  const cats = (product.categories || []) as Array<{
    _id: Types.ObjectId;
    name?: string;
    slug?: string;
    parent?: Types.ObjectId | null;
  }>;

  let categoryTrail: { name: string; slug: string }[] = [];
  try {
    const child = cats.find((c) => c.parent);
    const parentFromList = cats.find((c) => !c.parent);
    if (child?.parent) {
      const parentDoc =
        parentFromList ||
        (await Category.findById(child.parent).select("name slug").lean());
      if (parentDoc?.name && parentDoc.slug) {
        categoryTrail.push({ name: parentDoc.name, slug: parentDoc.slug });
      }
      if (child.name && child.slug) {
        categoryTrail.push({ name: child.name, slug: child.slug });
      }
    } else if (parentFromList?.name && parentFromList.slug) {
      categoryTrail = [
        { name: parentFromList.name, slug: parentFromList.slug },
      ];
    } else if (cats[0]?.name && cats[0]?.slug) {
      categoryTrail = [{ name: cats[0].name, slug: cats[0].slug }];
    }
  } catch (err) {
    console.error("category trail failed", err);
  }

  const productId = String(product._id);

  return (
    <ProductBuyBox
      product={toPlain({
        _id: productId,
        title: product.title,
        slug: product.slug,
        price: product.price,
        mrp: product.mrp,
        description: sanitizeHtml(product.description || ""),
        shortDescription: product.shortDescription,
        images: product.images || [],
        colorOptions: ((product.colorOptions || []) as Array<{
          name?: string;
          swatch?: string;
          images?: string[] | undefined;
        }>)
          .filter((c) => c.name)
          .map((c) => ({
            name: String(c.name),
            swatch: c.swatch || "#888888",
            images: (c.images || []).filter(Boolean),
          })),
        specs: ((product.specs || []) as Array<{
          label?: string;
          value?: string;
        }>)
          .filter((s) => s.label && s.value)
          .map((s) => ({
            label: String(s.label),
            value: String(s.value),
          })),
        stock: product.stock,
        weightKg: product.weightKg,
        ratingAvg: product.ratingAvg,
        ratingCount: product.ratingCount,
        brand: brand ? { name: brand.name, slug: brand.slug } : null,
        categoryTrail,
        variants: ((product.variants || []) as Array<{
          sku: string;
          name: string;
          color?: string;
          price: number;
          mrp: number;
          stock: number;
          image?: string;
        }>).map((v) => ({
          sku: v.sku,
          name: v.name,
          color: v.color,
          price: v.price,
          mrp: v.mrp,
          stock: v.stock,
          image: v.image,
        })),
      })}
    >
      <Suspense fallback={<ProductSecondarySkeleton />}>
        <ProductSecondary productId={productId} />
      </Suspense>
    </ProductBuyBox>
  );
}
