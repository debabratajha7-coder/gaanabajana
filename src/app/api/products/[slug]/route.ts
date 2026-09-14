import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { Review } from "@/models/Review";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  await connectDB();
  const product = await Product.findOne({ slug, isActive: true })
    .populate("brand", "name slug")
    .populate("categories", "name slug")
    .lean();
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const reviews = await Review.find({ product: product._id, approved: true })
    .populate("user", "name")
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  return NextResponse.json({
    product: {
      ...product,
      _id: String(product._id),
      brand: product.brand
        ? {
            name: (product.brand as { name?: string }).name,
            slug: (product.brand as { slug?: string }).slug,
          }
        : null,
      categories: (product.categories || []).map((c) => {
        const cat = c as { name?: string; slug?: string };
        return { name: cat.name, slug: cat.slug };
      }),
    },
    reviews: reviews.map((r) => ({
      rating: r.rating,
      title: r.title,
      body: r.body,
      user: {
        name:
          r.authorName ||
          (r.user as { name?: string } | null)?.name ||
          "Customer",
      },
    })),
  });
}
