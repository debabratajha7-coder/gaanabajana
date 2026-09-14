import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { authErrorResponse, requireAdmin } from "@/lib/auth";
import { Product } from "@/models/Product";
import { Review } from "@/models/Review";
import { slugify } from "@/lib/utils";
import { refreshProductRating } from "@/lib/reviews";

const reviewDraftSchema = z.object({
  authorName: z.string().min(1).max(80),
  rating: z.number().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().min(3).max(2000),
});

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
  reviews: z.array(reviewDraftSchema).optional(),
});

async function attachAdminReviews(
  productId: string,
  drafts: z.infer<typeof reviewDraftSchema>[] | undefined
) {
  if (!drafts?.length) return;
  await Review.insertMany(
    drafts.map((d) => ({
      product: productId,
      authorName: d.authorName.trim(),
      rating: d.rating,
      title: d.title?.trim() || undefined,
      body: d.body.trim(),
      approved: true,
    }))
  );
  await refreshProductRating(productId);
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    await connectDB();
    const q = req.nextUrl.searchParams.get("q");
    const id = req.nextUrl.searchParams.get("id");

    if (id) {
      const [product, reviews] = await Promise.all([
        Product.findById(id)
          .populate("brand", "name")
          .populate("categories", "name parent")
          .lean(),
        Review.find({ product: id })
          .sort({ createdAt: -1 })
          .lean(),
      ]);
      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
      return NextResponse.json({
        product: {
          ...product,
          _id: String(product._id),
          brand: product.brand
            ? {
                _id: String((product.brand as { _id: unknown })._id),
                name: (product.brand as { name?: string }).name,
              }
            : null,
          categories: ((product.categories || []) as Array<{
            _id: unknown;
            name?: string;
            parent?: unknown;
          }>).map((c) => ({
            _id: String(c._id),
            name: c.name,
            parent: c.parent ? String(c.parent) : null,
          })),
        },
        reviews: reviews.map((r) => ({
          _id: String(r._id),
          authorName: r.authorName,
          rating: r.rating,
          title: r.title,
          body: r.body,
          approved: r.approved,
        })),
      });
    }

    const filter: Record<string, unknown> = {};
    if (q) filter.title = { $regex: q, $options: "i" };
    const items = await Product.find(filter)
      .populate("brand", "name")
      .populate("categories", "name")
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean();
    return NextResponse.json({
      items: items.map((p) => ({
        ...p,
        _id: String(p._id),
        brand: p.brand
          ? {
              _id: String((p.brand as { _id: unknown })._id),
              name: (p.brand as { name?: string }).name,
            }
          : null,
        categories: ((p.categories || []) as Array<{
          _id: unknown;
          name?: string;
        }>).map((c) => ({
          _id: String(c._id),
          name: c.name,
        })),
      })),
    });
  } catch (e) {
    return authErrorResponse(e);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = productSchema.parse(await req.json());
    await connectDB();
    const { reviews, ...rest } = body;
    const slug = rest.slug || slugify(rest.title);
    const product = await Product.create({
      ...rest,
      slug,
      ratingAvg: 0,
      ratingCount: 0,
      variants: rest.variants?.length
        ? rest.variants
        : [
            {
              sku: `${slug.slice(0, 12)}-std`,
              name: "Standard",
              price: rest.price,
              mrp: rest.mrp,
              stock: rest.stock ?? 0,
            },
          ],
    });
    await attachAdminReviews(String(product._id), reviews);
    const fresh = await Product.findById(product._id).lean();
    return NextResponse.json({ product: fresh });
  } catch (e) {
    return authErrorResponse(e);
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const body = productSchema.extend({ id: z.string() }).parse(await req.json());
    await connectDB();
    const { id, reviews, ...rest } = body;
    const product = await Product.findByIdAndUpdate(id, rest, {
      returnDocument: "after",
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    await attachAdminReviews(id, reviews);
    const fresh = await Product.findById(id).lean();
    return NextResponse.json({ product: fresh });
  } catch (e) {
    return authErrorResponse(e);
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdmin();
    const { id } = z.object({ id: z.string() }).parse(await req.json());
    await connectDB();
    await Promise.all([
      Product.findByIdAndDelete(id),
      Review.deleteMany({ product: id }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return authErrorResponse(e);
  }
}
