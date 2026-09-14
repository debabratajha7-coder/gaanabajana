import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { Review } from "@/models/Review";
import { ProductBuyBox } from "@/components/product/ProductBuyBox";

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
    .limit(20)
    .lean();

  return (
    <ProductBuyBox
      product={{
        ...product,
        _id: String(product._id),
        brand: product.brand as { name?: string; slug?: string },
      }}
      reviews={reviews.map((r) => ({
        rating: r.rating,
        title: r.title,
        body: r.body,
        user: r.user as { name?: string },
      }))}
    />
  );
}
