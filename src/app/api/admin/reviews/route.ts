import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { authErrorResponse, requireAdmin } from "@/lib/auth";
import { Review } from "@/models/Review";
import { Product } from "@/models/Product";
import { User } from "@/models/User";

export async function GET() {
  try {
    await requireAdmin();
    await connectDB();
    const [reviews, users] = await Promise.all([
      Review.find()
        .populate("product", "title slug")
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      User.find({ role: "customer" })
        .select("name email phone createdAt")
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
    ]);
    return NextResponse.json({ reviews, users });
  } catch (e) {
    return authErrorResponse(e);
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const body = z
      .object({
        reviewId: z.string(),
        approved: z.boolean(),
      })
      .parse(await req.json());
    await connectDB();
    const review = await Review.findByIdAndUpdate(
      body.reviewId,
      { approved: body.approved },
      { new: true }
    );
    if (review) {
      const approved = await Review.find({
        product: review.product,
        approved: true,
      });
      const avg = approved.length
        ? approved.reduce((s, r) => s + r.rating, 0) / approved.length
        : 0;
      await Product.findByIdAndUpdate(review.product, {
        ratingAvg: Math.round(avg * 100) / 100,
        ratingCount: approved.length,
      });
    }
    return NextResponse.json({ review });
  } catch (e) {
    return authErrorResponse(e);
  }
}
