import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { consumeOtpChallenge } from "@/lib/otp";
import { User } from "@/models/User";

const schema = z.object({
  challengeToken: z.string().min(10),
  code: z.string().min(4).max(8),
  newPassword: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const result = await consumeOtpChallenge<{ userId?: string }>(
      body.challengeToken,
      body.code,
      "password_reset"
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    if (!result.payload.userId) {
      return NextResponse.json({ error: "Invalid reset challenge" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(result.payload.userId);
    if (!user || user.isActive === false) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    user.passwordHash = await hashPassword(body.newPassword);
    if (!user.authProvider) user.authProvider = "local";
    await user.save();

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error("forgot reset", error);
    return NextResponse.json({ error: "Could not reset password" }, { status: 500 });
  }
}
