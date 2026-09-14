import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authErrorResponse, requireUser } from "@/lib/auth";
import { Order } from "@/models/Order";

export async function GET() {
  try {
    const session = await requireUser();
    await connectDB();
    const orders = await Order.find({ user: session.id }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ orders });
  } catch (e) {
    return authErrorResponse(e);
  }
}
