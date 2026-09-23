import { NextResponse } from "next/server";
import { z } from "zod";
import {
  issueOtpChallenge,
  maskPhone,
  normalizeIndianPhone,
  shouldExposeDevOtp,
} from "@/lib/otp";
import { isTwilioConfigured, sendSmsOtp } from "@/lib/twilio";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const schema = z.object({
  phone: z.string().min(8),
});

/** Send SMS OTP to verify phone before placing a COD order. */
export async function POST(req: Request) {
  try {
    const limited = rateLimit(`cod-otp:${clientIp(req)}`, 5, 15 * 60_000);
    if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

    if (!isTwilioConfigured()) {
      return NextResponse.json(
        {
          error:
            "Phone verification is temporarily unavailable. Please pay online with PhonePe, or try again later.",
          otpRequired: false,
        },
        { status: 503 }
      );
    }

    const body = schema.parse(await req.json());
    const phone = normalizeIndianPhone(body.phone);
    const { code, token: challengeToken } = await issueOtpChallenge({
      purpose: "cod_checkout",
      phone,
    });

    const sent = await sendSmsOtp(phone, code);
    if (sent.skipped) {
      return NextResponse.json(
        {
          error: "Could not send SMS. Check the number or pay online instead.",
          ...(shouldExposeDevOtp() ? { devCode: code, challengeToken } : {}),
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      challengeToken,
      maskedTarget: maskPhone(phone),
      otpRequired: true,
      ...(shouldExposeDevOtp() ? { devCode: code } : {}),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error("cod otp", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not send verification code",
      },
      { status: 400 }
    );
  }
}
