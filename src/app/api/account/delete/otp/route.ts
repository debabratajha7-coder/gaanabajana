import { NextResponse } from "next/server";
import { z } from "zod";
import {
  authErrorResponse,
  requireUser,
} from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { issueOtpChallenge, maskEmail, maskPhone } from "@/lib/otp";
import { sendEmailOtp } from "@/lib/email";
import { sendSmsOtp } from "@/lib/twilio";
import { User } from "@/models/User";

const schema = z.object({
  channel: z.enum(["email", "phone"]),
});

export async function POST(req: Request) {
  try {
    const session = await requireUser();
    if (session.role === "admin") {
      return NextResponse.json(
        { error: "Admin accounts can’t be deleted here." },
        { status: 403 }
      );
    }

    const body = schema.parse(await req.json());
    await connectDB();
    const user = await User.findById(session.id);
    if (!user) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (body.channel === "phone") {
      if (!user.phone) {
        return NextResponse.json(
          { error: "No phone on this account" },
          { status: 400 }
        );
      }
      const { code, token: challengeToken } = await issueOtpChallenge({
        purpose: "account_delete",
        userId: String(user._id),
        channel: "phone",
      });
      const sent = await sendSmsOtp(user.phone, code);
      if (sent.skipped) {
        return NextResponse.json(
          { error: "Could not send SMS. Try email OTP." },
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
      return NextResponse.json({ error: "No email on this account" }, { status: 400 });
    }
    const { code, token: challengeToken } = await issueOtpChallenge({
      purpose: "account_delete",
      userId: String(user._id),
      channel: "email",
    });
    const sent = await sendEmailOtp(user.email, code);
    if (sent.skipped) {
      return NextResponse.json(
        { error: "Could not send email. Try phone OTP." },
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
    return authErrorResponse(error);
  }
}
