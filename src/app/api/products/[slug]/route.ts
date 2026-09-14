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
  return NextResponse.json({ product, reviews });
}
