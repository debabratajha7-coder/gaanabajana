import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { authErrorResponse, requireAdmin } from "@/lib/auth";
import { Product } from "@/models/Product";
import { slugify } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    await connectDB();
    const q = req.nextUrl.searchParams.get("q");
    const filter: Record<string, unknown> = {};
    if (q) filter.title = { $regex: q, $options: "i" };
    const items = await Product.find(filter)
      .populate("brand", "name")
      .populate("categories", "name")
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean();
    return NextResponse.json({ items });
  } catch (e) {
    return authErrorResponse(e);
  }
}

const productSchema = z.object({
  title: z.string().min(2),
  slug: z.string().optional(),
  brand: z.string().optional(),
  categories: z.array(z.string()).optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  images: z.array(z.string()).optional(),
  price: z.number(),
  mrp: z.number(),
  stock: z.number().optional(),
  weightKg: z.number().optional(),
  lengthCm: z.number().optional(),
  breadthCm: z.number().optional(),
  heightCm: z.number().optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  onSale: z.boolean().optional(),
  openBox: z.boolean().optional(),
  isActive: z.boolean().optional(),
  variants: z
    .array(
      z.object({
        sku: z.string(),
        name: z.string(),
        color: z.string().optional(),
        price: z.number(),
        mrp: z.number(),
        stock: z.number(),
        image: z.string().optional(),
      })
    )
    .optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = productSchema.parse(await req.json());
    await connectDB();
    const slug = body.slug || slugify(body.title);
    const product = await Product.create({
      ...body,
      slug,
      variants: body.variants?.length
        ? body.variants
        : [
            {
              sku: `${slug.slice(0, 12)}-std`,
              name: "Standard",
              price: body.price,
              mrp: body.mrp,
              stock: body.stock ?? 0,
            },
          ],
    });
    return NextResponse.json({ product });
  } catch (e) {
    return authErrorResponse(e);
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const body = productSchema.extend({ id: z.string() }).parse(await req.json());
    await connectDB();
    const { id, ...rest } = body;
    const product = await Product.findByIdAndUpdate(id, rest, {
      returnDocument: "after",
    });
    return NextResponse.json({ product });
  } catch (e) {
    return authErrorResponse(e);
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdmin();
    const { id } = z.object({ id: z.string() }).parse(await req.json());
    await connectDB();
    await Product.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return authErrorResponse(e);
  }
}
