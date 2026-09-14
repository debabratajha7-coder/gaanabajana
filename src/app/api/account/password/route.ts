import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import {
  authErrorResponse,
  hashPassword,
  requireUser,
  verifyPassword,
} from "@/lib/auth";
import { User } from "@/models/User";

const schema = z.object({
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const session = await requireUser();
    const body = schema.parse(await req.json());
    await connectDB();
    const user = await User.findById(session.id);
    if (!user) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (user.passwordHash) {
      if (!body.currentPassword) {
        return NextResponse.json(
          { error: "Current password is required" },
          { status: 400 }
        );
      }
      const ok = await verifyPassword(body.currentPassword, user.passwordHash);
      if (!ok) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }
    }

    user.passwordHash = await hashPassword(body.newPassword);
    if (!user.authProvider) user.authProvider = "local";
    await user.save();

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    }
    return authErrorResponse(e);
  }
}
