import { NextResponse } from "next/server";
import { z } from "zod";
import { createChallengeToken } from "@/lib/auth";
import { consumeOtpChallenge } from "@/lib/otp";

const schema = z.object({
  otpToken: z.string().min(10),
  code: z.string().min(4).max(8),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const result = await consumeOtpChallenge<{ phone?: string }>(
      body.otpToken,
      body.code,
      "signup_phone_otp"
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const phone = String(result.payload.phone || "");
    if (!phone) {
      return NextResponse.json({ error: "Invalid phone challenge" }, { status: 400 });
    }

    const challengeToken = await createChallengeToken({
      purpose: "signup_phone_verified",
      phone,
    });

    return NextResponse.json({ ok: true, challengeToken, phone });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Verification failed",
      },
      { status: 400 }
    );
  }
}
