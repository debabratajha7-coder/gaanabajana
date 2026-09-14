import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authErrorResponse, requireUser } from "@/lib/auth";
import { User } from "@/models/User";
import { z } from "zod";

export async function GET() {
  try {
    const session = await requireUser();
    await connectDB();
    const user = await User.findById(session.id).populate({
      path: "wishlist",
      populate: { path: "brand", select: "name slug" },
    });
    return NextResponse.json({ items: user?.wishlist || [] });
  } catch (e) {
    return authErrorResponse(e);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireUser();
    const { productId } = z.object({ productId: z.string() }).parse(await req.json());
    await connectDB();
    await User.findByIdAndUpdate(session.id, {
      $addToSet: { wishlist: productId },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return authErrorResponse(e);
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireUser();
    const { productId } = z.object({ productId: z.string() }).parse(await req.json());
    await connectDB();
    await User.findByIdAndUpdate(session.id, {
      $pull: { wishlist: productId },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return authErrorResponse(e);
  }
}
