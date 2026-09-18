import Link from "next/link";
import { Suspense } from "react";
import { connectDB, isTransientDbError } from "@/lib/db";
import { getProductBySlug } from "@/lib/products";
import { Category } from "@/models/Category";
import { ProductBuyBox } from "@/components/product/ProductBuyBox";
import { ProductSecondary } from "@/components/product/ProductSecondary";
import { ProductSecondarySkeleton } from "@/components/ui/Skeleton";
import { AutoRetry, ClearAutoRetry } from "@/components/ui/AutoRetry";
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

  let product;
  try {
    product = await getProductBySlug(slug);
  } catch (err) {
    const kind = isTransientDbError(err) ? "transient" : "fatal";
    console.error(`product page ${kind} failure`, slug, err);
    return (
      <AutoRetry
        title="Taking a moment…"
        message="We’re loading this product. Hang tight — retrying automatically."
        storageKey={`product:${slug}`}
      />
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
    await connectDB();
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
    <>
      <ClearAutoRetry storageKey={`product:${slug}`} />
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
    </>
  );
}
