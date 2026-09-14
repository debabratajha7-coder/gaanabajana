import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { authErrorResponse, requireUser } from "@/lib/auth";
import { User } from "@/models/User";

const addressSchema = z.object({
  label: z.string().default("Home"),
  fullName: z.string().min(2),
  phone: z.string().min(8),
  line1: z.string().min(3),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().min(5),
  country: z.string().default("India"),
  isDefault: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await requireUser();
    await connectDB();
    const user = await User.findById(session.id).select("addresses");
    return NextResponse.json({ addresses: user?.addresses || [] });
  } catch (e) {
    return authErrorResponse(e);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireUser();
    const body = addressSchema.parse(await req.json());
    await connectDB();
    const user = await User.findById(session.id);
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (body.isDefault) {
      user.addresses.forEach((a: { isDefault?: boolean }) => {
        a.isDefault = false;
      });
    }
    user.addresses.push(body);
    await user.save();
    return NextResponse.json({ addresses: user.addresses });
  } catch (e) {
    return authErrorResponse(e);
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireUser();
    const { addressId } = z.object({ addressId: z.string() }).parse(await req.json());
    await connectDB();
    await User.findByIdAndUpdate(session.id, {
      $pull: { addresses: { _id: addressId } },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return authErrorResponse(e);
  }
}
