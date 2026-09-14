import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { Review } from "@/models/Review";
import { ProductBuyBox } from "@/components/product/ProductBuyBox";
import { toPlain } from "@/lib/utils";

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

  const product = await Product.findOne({ slug, isActive: true })
    .populate("brand", "name slug")
    .lean();
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

  const reviews = await Review.find({ product: product._id, approved: true })
    .populate("user", "name")
    .sort({ createdAt: -1 })
    .limit(40)
    .lean();

  const brand = product.brand as { name?: string; slug?: string } | null;

  return (
    <ProductBuyBox
      product={toPlain({
        _id: String(product._id),
        title: product.title,
        slug: product.slug,
        price: product.price,
        mrp: product.mrp,
        description: product.description,
        shortDescription: product.shortDescription,
        images: product.images || [],
        stock: product.stock,
        weightKg: product.weightKg,
        ratingAvg: product.ratingAvg,
        ratingCount: product.ratingCount,
        brand: brand
          ? { name: brand.name, slug: brand.slug }
          : null,
        variants: (product.variants || []).map((v) => ({
          sku: v.sku,
          name: v.name,
          color: v.color,
          price: v.price,
          mrp: v.mrp,
          stock: v.stock,
          image: v.image,
        })),
      })}
      reviews={toPlain(
        reviews.map((r) => {
          const user = r.user as { name?: string } | null;
          return {
            rating: r.rating,
            title: r.title,
            body: r.body,
            user: {
              name: r.authorName || user?.name || "Customer",
            },
          };
        })
      )}
    />
  );
}
