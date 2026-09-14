import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { authErrorResponse, requireUser } from "@/lib/auth";
import { User } from "@/models/User";

const schema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().max(20).optional(),
});

export async function PATCH(req: Request) {
  try {
    const session = await requireUser();
    const body = schema.parse(await req.json());
    await connectDB();
    const user = await User.findByIdAndUpdate(
      session.id,
      {
        name: body.name.trim(),
        phone: body.phone?.trim() || undefined,
      },
      { new: true }
    ).select("name email phone role authProvider");

    if (!user) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        authProvider: user.authProvider || "local",
      },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    }
    return authErrorResponse(e);
  }
}
