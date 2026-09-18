import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createSessionToken,
  sessionFromUser,
  setSessionCookie,
} from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { consumeOtpChallenge } from "@/lib/otp";
import { User } from "@/models/User";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const schema = z.object({
  challengeToken: z.string().min(10),
  code: z.string().min(4).max(8),
});

export async function POST(req: Request) {
  try {
    const limited = rateLimit(`otp-verify:${clientIp(req)}`, 10, 15 * 60_000);
    if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

    const body = schema.parse(await req.json());
    const result = await consumeOtpChallenge<{ userId?: string }>(
      body.challengeToken,
      body.code,
      "admin_2fa_pending"
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    if (!result.payload.userId) {
      return NextResponse.json({ error: "Invalid login challenge" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(result.payload.userId);
    if (!user || user.role !== "admin" || user.isActive === false) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    user.phoneVerified = true;
    await user.save();
    await setSessionCookie(await createSessionToken(sessionFromUser(user)));

    return NextResponse.json({
      ok: true,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        isSuperAdmin: Boolean(user.isSuperAdmin),
      },
    });
  } catch (error) {
    console.error("admin otp", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "OTP verification failed",
      },
      { status: 400 }
    );
  }
}
