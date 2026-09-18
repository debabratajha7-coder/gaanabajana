import { NextResponse } from "next/server";
import { z } from "zod";
import { authErrorResponse, requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { consumeOtpChallenge, maskPhone } from "@/lib/otp";
import { User } from "@/models/User";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const schema = z.object({
  challengeToken: z.string().min(10),
  code: z.string().min(4).max(8),
});

export async function POST(req: Request) {
  try {
    const limited = rateLimit(`phone-confirm:${clientIp(req)}`, 10, 15 * 60_000);
    if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

    const session = await requireUser();
    const body = schema.parse(await req.json());

    const result = await consumeOtpChallenge<{
      userId?: string;
      phone?: string;
    }>(body.challengeToken, body.code, "change_phone");

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    if (!result.payload.userId || !result.payload.phone) {
      return NextResponse.json(
        { error: "Invalid or expired code" },
        { status: 400 }
      );
    }
    if (result.payload.userId !== session.id) {
      return NextResponse.json({ error: "Session mismatch" }, { status: 403 });
    }

    await connectDB();
    const user = await User.findById(session.id);
    if (!user || user.isActive === false) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const clash = await User.findOne({
      phone: result.payload.phone,
      _id: { $ne: user._id },
    });
    if (clash) {
      return NextResponse.json(
        { error: "Phone already in use" },
        { status: 400 }
      );
    }

    user.phone = result.payload.phone;
    user.phoneVerified = true;
    await user.save();

    return NextResponse.json({
      ok: true,
      phone: user.phone,
      maskedPhone: maskPhone(user.phone),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message },
        { status: 400 }
      );
    }
    return authErrorResponse(error);
  }
}
