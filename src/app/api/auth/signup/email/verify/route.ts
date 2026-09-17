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

const schema = z.object({
  emailChallengeToken: z.string().min(10),
  code: z.string().min(4).max(8),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const result = await consumeOtpChallenge<{
      userId?: string;
      email?: string;
      phone?: string;
      name?: string;
      passwordHash?: string;
      purpose?: string;
    }>(body.emailChallengeToken, body.code, [
      "signup_email_pending",
      "login_email_pending",
    ]);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const challenge = result.payload;
    if (!challenge.email) {
      return NextResponse.json(
        { error: "Email verification expired. Try registering again." },
        { status: 400 }
      );
    }

    const email = String(challenge.email).toLowerCase();
    await connectDB();

    // Finish incomplete signup (user not created yet)
    if (challenge.purpose === "signup_email_pending" && challenge.passwordHash) {
      if (await User.findOne({ email, emailVerified: true })) {
        return NextResponse.json({ error: "Email already registered" }, { status: 400 });
      }
      await User.deleteMany({
        $or: [
          { email, emailVerified: { $ne: true } },
          ...(challenge.phone
            ? [{ phone: challenge.phone, emailVerified: { $ne: true } }]
            : []),
        ],
      });

      const user = await User.create({
        name: String(challenge.name || email.split("@")[0]),
        email,
        phone: challenge.phone ? String(challenge.phone) : undefined,
        phoneVerified: Boolean(challenge.phone),
        emailVerified: true,
        passwordHash: String(challenge.passwordHash),
        authProvider: "local",
        role: "customer",
        isActive: true,
      });

      await setSessionCookie(await createSessionToken(sessionFromUser(user)));
      return NextResponse.json({
        ok: true,
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }

    // Login / resume path: user already exists
    if (
      challenge.purpose === "signup_email_pending" ||
      challenge.purpose === "login_email_pending"
    ) {
      const user = challenge.userId
        ? await User.findById(challenge.userId)
        : await User.findOne({ email });
      if (!user) {
        return NextResponse.json({ error: "Account not found" }, { status: 404 });
      }

      user.emailVerified = true;
      await user.save();
      await setSessionCookie(await createSessionToken(sessionFromUser(user)));
      return NextResponse.json({
        ok: true,
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }

    return NextResponse.json(
      { error: "Email verification expired. Try registering again." },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }
}
