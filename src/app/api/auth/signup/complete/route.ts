import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createSessionToken,
  hashPassword,
  sessionFromUser,
  setSessionCookie,
  verifyChallengeToken,
} from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { issueOtpChallenge, maskEmail, shouldExposeDevOtp } from "@/lib/otp";
import { sendEmailOtp } from "@/lib/email";
import { User } from "@/models/User";

const schema = z.object({
  challengeToken: z.string().min(10),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const challenge = await verifyChallengeToken<{
      purpose?: string;
      phone?: string;
    }>(body.challengeToken);

    if (!challenge || challenge.purpose !== "signup_phone_verified" || !challenge.phone) {
      return NextResponse.json(
        { error: "Phone verification expired. Start again." },
        { status: 400 }
      );
    }

    await connectDB();
    const email = body.email.toLowerCase().trim();
    const phone = String(challenge.phone);
    const name = body.name.trim();
    const passwordHash = await hashPassword(body.password);

    const emailOwner = await User.findOne({ email });
    if (emailOwner?.emailVerified) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }
    if (emailOwner && !emailOwner.emailVerified) {
      await emailOwner.deleteOne();
    }

    const phoneOwner = await User.findOne({ phone });
    if (phoneOwner?.emailVerified) {
      return NextResponse.json(
        { error: "This phone is already registered. Please login." },
        { status: 400 }
      );
    }
    if (phoneOwner && !phoneOwner.emailVerified) {
      await phoneOwner.deleteOne();
    }

    const { code, token: emailChallengeToken } = await issueOtpChallenge(
      {
        purpose: "signup_email_pending",
        phone,
        name,
        email,
        passwordHash,
      },
      "30m"
    );
    const sent = await sendEmailOtp(email, code);

    // No Resend configured — finish account now so users are never stranded
    if (sent.skipped) {
      const user = await User.create({
        name,
        email,
        phone,
        phoneVerified: true,
        emailVerified: true,
        passwordHash,
        authProvider: "local",
        role: "customer",
        isActive: true,
      });
      await setSessionCookie(await createSessionToken(sessionFromUser(user)));
      return NextResponse.json({
        ok: true,
        completed: true,
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role,
        },
        notice:
          "Email delivery is not configured yet, so your account was activated without an email code.",
      });
    }

    return NextResponse.json({
      ok: true,
      completed: false,
      emailChallengeToken,
      maskedEmail: maskEmail(email),
      ...(shouldExposeDevOtp() ? { devCode: code } : {}),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not continue signup",
      },
      { status: 500 }
    );
  }
}
