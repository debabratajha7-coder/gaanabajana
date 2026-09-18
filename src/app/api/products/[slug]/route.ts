import { NextResponse } from "next/server";
import { getProductBySlug } from "@/lib/products";
import { connectDB, isTransientDbError } from "@/lib/db";
import { Review } from "@/models/Review";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const product = await getProductBySlug(slug);
    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await connectDB();
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
        categories: ((product.categories || []) as Array<{
          name?: string;
          slug?: string;
        }>).map((c) => ({
          name: c.name,
          slug: c.slug,
        })),
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
  } catch (err) {
    console.error(
      "product api",
      isTransientDbError(err) ? "transient" : "error",
      slug,
      err
    );
    return NextResponse.json(
      { error: "Product temporarily unavailable" },
      { status: 503 }
    );
  }
}
