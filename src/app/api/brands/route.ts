import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Brand } from "@/models/Brand";

export async function GET() {
  await connectDB();
  const brands = await Brand.find({ isActive: true }).sort({ name: 1 }).lean();
  return NextResponse.json({ brands });
}
