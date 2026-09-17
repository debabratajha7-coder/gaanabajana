import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { authErrorResponse, requireAdminPermission } from "@/lib/auth";
import { Review } from "@/models/Review";
import { User } from "@/models/User";
import { refreshProductRating } from "@/lib/reviews";

export async function GET() {
  try {
    await requireAdminPermission("reviews");
    await connectDB();
    const [reviews, users] = await Promise.all([
      Review.find()
        .populate("product", "title slug")
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .limit(200)
        .lean(),
      User.find({
        role: "customer",
        email: { $not: /@gaanbajana\.demo$/i },
      })
        .select("name email phone createdAt")
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
    ]);
    return NextResponse.json({
      reviews: reviews.map((r) => ({
        ...r,
        _id: String(r._id),
        displayName:
          r.authorName ||
          (r.user as { name?: string } | null)?.name ||
          "Customer",
      })),
      users: users.map((u) => ({
        ...u,
        _id: String(u._id),
      })),
    });
  } catch (e) {
    return authErrorResponse(e);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdminPermission("reviews");
    const body = z
      .object({
        productId: z.string(),
        authorName: z.string().min(1).max(80),
        rating: z.number().min(1).max(5),
        title: z.string().max(120).optional(),
        body: z.string().min(3).max(2000),
        approved: z.boolean().optional(),
      })
      .parse(await req.json());
    await connectDB();
    const review = await Review.create({
      product: body.productId,
      authorName: body.authorName.trim(),
      rating: body.rating,
      title: body.title?.trim() || undefined,
      body: body.body.trim(),
      approved: body.approved ?? true,
    });
    await refreshProductRating(body.productId);
    return NextResponse.json({ review });
  } catch (e) {
    return authErrorResponse(e);
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdminPermission("reviews");
    const body = z
      .object({
        reviewId: z.string(),
        approved: z.boolean().optional(),
        authorName: z.string().min(1).max(80).optional(),
        rating: z.number().min(1).max(5).optional(),
        title: z.string().max(120).optional(),
        body: z.string().min(3).max(2000).optional(),
      })
      .parse(await req.json());
    await connectDB();
    const patch: Record<string, unknown> = {};
    if (typeof body.approved === "boolean") patch.approved = body.approved;
    if (body.authorName) patch.authorName = body.authorName.trim();
    if (body.rating) patch.rating = body.rating;
    if (body.title !== undefined) patch.title = body.title.trim() || undefined;
    if (body.body) patch.body = body.body.trim();

    const review = await Review.findByIdAndUpdate(body.reviewId, patch, {
      returnDocument: "after",
    });
    if (review) await refreshProductRating(String(review.product));
    return NextResponse.json({ review });
  } catch (e) {
    return authErrorResponse(e);
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdminPermission("reviews");
    const body = z
      .object({
        reviewId: z.string().optional(),
        clearAll: z.boolean().optional(),
      })
      .parse(await req.json());
    await connectDB();

    if (body.clearAll) {
      const products = await Review.distinct("product");
      await Review.deleteMany({});
      const { Product } = await import("@/models/Product");
      await Product.updateMany({}, { ratingAvg: 0, ratingCount: 0 });
      return NextResponse.json({ ok: true, cleared: products.length });
    }

    if (!body.reviewId) {
      return NextResponse.json({ error: "reviewId required" }, { status: 400 });
    }
    const review = await Review.findByIdAndDelete(body.reviewId);
    if (review) await refreshProductRating(String(review.product));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return authErrorResponse(e);
  }
}
