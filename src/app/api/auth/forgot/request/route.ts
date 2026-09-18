import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import {
  issueOtpChallenge,
  maskEmail,
  maskPhone,
  normalizeIndianPhone,
} from "@/lib/otp";
import { sendEmailOtp } from "@/lib/email";
import { sendSmsOtp } from "@/lib/twilio";
import { User } from "@/models/User";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const schema = z.object({
  identifier: z.string().min(3),
  channel: z.enum(["email", "phone"]).optional(),
});

async function findUser(identifier: string) {
  const raw = identifier.trim();
  if (raw.includes("@")) {
    return User.findOne({ email: raw.toLowerCase() });
  }
  try {
    return User.findOne({ phone: normalizeIndianPhone(raw) });
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const limited = rateLimit(`forgot:${clientIp(req)}`, 5, 15 * 60_000);
    if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

    const body = schema.parse(await req.json());
    await connectDB();
    const user = await findUser(body.identifier);

    // Always look successful to avoid account enumeration
    const generic = {
      ok: true,
      message: "If an account exists, a reset code has been sent.",
    };

    if (!user || user.isActive === false || !user.passwordHash) {
      return NextResponse.json(generic);
    }

    const want =
      body.channel ||
      (body.identifier.includes("@")
        ? "email"
        : user.phone
          ? "phone"
          : "email");

    if (want === "phone") {
      if (!user.phone) {
        return NextResponse.json(
          { error: "No phone on this account. Try email reset." },
          { status: 400 }
        );
      }
      const { code, token: challengeToken } = await issueOtpChallenge({
        purpose: "password_reset",
        userId: String(user._id),
        channel: "phone",
      });
      const sent = await sendSmsOtp(user.phone, code);
      if (sent.skipped) {
        return NextResponse.json(
          { error: "Could not send SMS. Try email instead." },
          { status: 400 }
        );
      }
      return NextResponse.json({
        ok: true,
        challengeToken,
        channel: "phone",
        maskedTarget: maskPhone(user.phone),
      });
    }

    if (!user.email) {
      return NextResponse.json(
        { error: "No email on this account. Try phone reset." },
        { status: 400 }
      );
    }
    const { code, token: challengeToken } = await issueOtpChallenge({
      purpose: "password_reset",
      userId: String(user._id),
      channel: "email",
    });
    const sent = await sendEmailOtp(user.email, code);
    if (sent.skipped) {
      if (user.phone) {
        return NextResponse.json(
          { error: "Could not send email. Try phone OTP instead." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Could not send reset email right now." },
        { status: 400 }
      );
    }
    return NextResponse.json({
      ok: true,
      challengeToken,
      channel: "email",
      maskedTarget: maskEmail(user.email),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error("forgot request", error);
    return NextResponse.json({ error: "Could not start reset" }, { status: 500 });
  }
}
