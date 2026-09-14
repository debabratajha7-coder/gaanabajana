import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Category } from "@/models/Category";

export async function GET() {
  try {
    await connectDB();
    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Database unavailable",
        tip: "Set MONGODB_URI on Vercel and allow 0.0.0.0/0 in Atlas Network Access",
      },
      { status: 503 }
    );
  }
}
