import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";

export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q");
  const category = searchParams.get("category");
  const brand = searchParams.get("brand");
  const featured = searchParams.get("featured");
  const onSale = searchParams.get("onSale");
  const openBox = searchParams.get("openBox");
  const limit = Math.min(Number(searchParams.get("limit") || 24), 100);
  const page = Math.max(Number(searchParams.get("page") || 1), 1);

  const filter: Record<string, unknown> = { isActive: true };
  if (featured === "1") filter.featured = true;
  if (onSale === "1") filter.onSale = true;
  if (openBox === "1") filter.openBox = true;
  if (category) filter.categories = category;
  if (brand) filter.brand = brand;
  if (q) filter.$text = { $search: q };

  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate("brand", "name slug")
      .populate("categories", "name slug")
      .sort(q ? { score: { $meta: "textScore" } } : { createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return NextResponse.json({ items, total, page, limit });
}
