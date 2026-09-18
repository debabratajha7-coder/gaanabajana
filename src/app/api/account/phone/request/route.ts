import { NextResponse } from "next/server";
import { z } from "zod";
import {
  authErrorResponse,
  requireUser,
  verifyPassword,
} from "@/lib/auth";
import { connectDB } from "@/lib/db";
import {
  issueOtpChallenge,
  maskPhone,
  normalizeIndianPhone,
} from "@/lib/otp";
import { sendSmsOtp } from "@/lib/twilio";
import { User } from "@/models/User";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const schema = z.object({
  phone: z.string().min(10),
  currentPassword: z.string().min(1).optional(),
});

export async function POST(req: Request) {
  try {
    const limited = rateLimit(`phone-change:${clientIp(req)}`, 5, 15 * 60_000);
    if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

    const session = await requireUser();
    const body = schema.parse(await req.json());
    await connectDB();

    const user = await User.findById(session.id);
    if (!user || user.isActive === false) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Admins must confirm password before changing the 2FA number.
    if (user.role === "admin") {
      if (!user.passwordHash) {
        return NextResponse.json(
          { error: "Set a password before changing your OTP phone." },
          { status: 400 }
        );
      }
      if (!body.currentPassword) {
        return NextResponse.json(
          { error: "Current password is required" },
          { status: 400 }
        );
      }
      if (!(await verifyPassword(body.currentPassword, user.passwordHash))) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }
    }

    let phone: string;
    try {
      phone = normalizeIndianPhone(body.phone);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Invalid phone" },
        { status: 400 }
      );
    }

    if (user.phone === phone) {
      return NextResponse.json(
        { error: "That is already your phone number" },
        { status: 400 }
      );
    }

    const clash = await User.findOne({ phone, _id: { $ne: user._id } });
    if (clash) {
      return NextResponse.json(
        { error: "Phone already in use" },
        { status: 400 }
      );
    }

    const { code, token: challengeToken } = await issueOtpChallenge({
      purpose: "change_phone",
      userId: String(user._id),
      phone,
    });

    const sent = await sendSmsOtp(phone, code);
    if (sent.skipped) {
      return NextResponse.json(
        {
          error:
            "Could not send SMS to the new number. Check Twilio settings and try again.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      challengeToken,
      maskedPhone: maskPhone(phone),
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
