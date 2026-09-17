import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyChallengeToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { issueOtpChallenge, maskEmail, maskPhone } from "@/lib/otp";
import { sendEmailOtp } from "@/lib/email";
import { sendSmsOtp } from "@/lib/twilio";
import { User } from "@/models/User";

const schema = z.object({
  pendingToken: z.string().min(10),
  channel: z.enum(["email", "phone"]),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const pending = await verifyChallengeToken<{
      purpose?: string;
      userId?: string;
    }>(body.pendingToken);

    if (!pending || pending.purpose !== "admin_2fa_choice" || !pending.userId) {
      return NextResponse.json(
        { error: "Session expired. Sign in again." },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findById(pending.userId);
    if (!user || user.role !== "admin" || user.isActive === false) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (body.channel === "phone") {
      if (!user.phone) {
        return NextResponse.json(
          { error: "No phone number on this account" },
          { status: 400 }
        );
      }
      const { code, token: challengeToken } = await issueOtpChallenge({
        purpose: "admin_2fa_pending",
        userId: String(user._id),
        channel: "phone",
      });
      const sent = await sendSmsOtp(user.phone, code);
      if (sent.skipped) {
        return NextResponse.json(
          { error: "Could not send SMS. Try email OTP instead." },
          { status: 400 }
        );
      }
      return NextResponse.json({
        ok: true,
        channel: "phone",
        challengeToken,
        maskedTarget: maskPhone(user.phone),
      });
    }

    if (!user.email) {
      return NextResponse.json(
        { error: "No email on this account" },
        { status: 400 }
      );
    }
    const { code, token: challengeToken } = await issueOtpChallenge({
      purpose: "admin_2fa_pending",
      userId: String(user._id),
      channel: "email",
    });
    const sent = await sendEmailOtp(user.email, code);
    if (sent.skipped) {
      return NextResponse.json(
        { error: "Could not send email. Try phone OTP instead." },
        { status: 400 }
      );
    }
    return NextResponse.json({
      ok: true,
      channel: "email",
      challengeToken,
      maskedTarget: maskEmail(user.email),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error("otp send", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not send code" },
      { status: 400 }
    );
  }
}
