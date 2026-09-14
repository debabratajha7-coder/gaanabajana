import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { authErrorResponse, requireUser } from "@/lib/auth";
import { Review } from "@/models/Review";
import { Product } from "@/models/Product";
import { refreshProductRating } from "@/lib/reviews";

export async function GET() {
  try {
    const session = await requireUser();
    await connectDB();
    const reviews = await Review.find({ user: session.id })
      .populate("product", "title slug images")
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ reviews });
  } catch (e) {
    return authErrorResponse(e);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireUser();
    const body = z
      .object({
        productId: z.string(),
        rating: z.number().min(1).max(5),
        title: z.string().optional(),
        body: z.string().min(5),
      })
      .parse(await req.json());
    await connectDB();

    const review = await Review.findOneAndUpdate(
      { product: body.productId, user: session.id },
      {
        product: body.productId,
        user: session.id,
        rating: body.rating,
        title: body.title,
        body: body.body,
        approved: false,
      },
      { upsert: true, new: true }
    );

    const approved = await Review.find({ product: body.productId, approved: true });
    if (approved.length) {
      await refreshProductRating(body.productId);
    } else {
      await Product.findByIdAndUpdate(body.productId, {
        ratingAvg: 0,
        ratingCount: 0,
      });
    }

    return NextResponse.json({ review });
  } catch (e) {
    return authErrorResponse(e);
  }
}
