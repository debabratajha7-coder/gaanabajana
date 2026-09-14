import { notFound } from "next/navigation";
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
  await connectDB();
  const product = await Product.findOne({ slug, isActive: true })
    .populate("brand", "name slug")
    .lean();
  if (!product) notFound();
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
