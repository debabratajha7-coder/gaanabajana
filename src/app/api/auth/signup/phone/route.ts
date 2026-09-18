import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import {
  issueOtpChallenge,
  normalizeIndianPhone,
  maskPhone,
  shouldExposeDevOtp,
} from "@/lib/otp";
import { sendSmsOtp } from "@/lib/twilio";
import { User } from "@/models/User";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const schema = z.object({
  phone: z.string().min(10),
});

export async function POST(req: Request) {
  try {
    const limited = rateLimit(`signup-phone:${clientIp(req)}`, 5, 15 * 60_000);
    if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

    const body = schema.parse(await req.json());
    const phone = normalizeIndianPhone(body.phone);
    await connectDB();

    const existing = await User.findOne({ phone });
    if (existing?.emailVerified) {
      return NextResponse.json(
        { error: "This phone is already registered. Please login." },
        { status: 400 }
      );
    }
    if (existing && !existing.emailVerified) {
      await existing.deleteOne();
    }

    const { code, token: otpToken } = await issueOtpChallenge({
      purpose: "signup_phone_otp",
      phone,
    });
    const sent = await sendSmsOtp(phone, code);
    const smsSent = !sent.skipped;

    return NextResponse.json({
      ok: true,
      phone,
      masked: maskPhone(phone),
      otpToken,
      smsSent,
      ...(smsSent || !shouldExposeDevOtp() ? {} : { devCode: code }),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not send OTP" },
      { status: 400 }
    );
  }
}
