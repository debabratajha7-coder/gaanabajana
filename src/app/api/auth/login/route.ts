import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import {
  createChallengeToken,
  createSessionToken,
  sessionFromUser,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import {
  issueOtpChallenge,
  maskEmail,
  maskPhone,
  normalizeIndianPhone,
} from "@/lib/otp";
import { sendEmailOtp } from "@/lib/email";
import { User } from "@/models/User";
import { z } from "zod";

const schema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(1),
});

async function findUserByIdentifier(identifier: string) {
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
    const body = schema.parse(await req.json());
    await connectDB();
    const user = await findUserByIdentifier(body.identifier);
    if (!user?.passwordHash) {
      return NextResponse.json(
        { error: "Invalid phone/email or password" },
        { status: 401 }
      );
    }
    if (user.isActive === false) {
      return NextResponse.json({ error: "This account is disabled" }, { status: 403 });
    }
    if (!(await verifyPassword(body.password, user.passwordHash))) {
      return NextResponse.json(
        { error: "Invalid phone/email or password" },
        { status: 401 }
      );
    }

    // Admin: password OK → choose email or phone OTP (code not sent yet)
    if (user.role === "admin") {
      // Keep main admin phone in sync with ADMIN_PHONE from env (seed-only otherwise)
      const envPhone = (process.env.ADMIN_PHONE || "").replace(/\s/g, "");
      const envAdminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
      if (
        envPhone &&
        (user.isSuperAdmin ||
          (envAdminEmail && user.email?.toLowerCase() === envAdminEmail)) &&
        user.phone !== envPhone
      ) {
        user.phone = envPhone;
        user.phoneVerified = true;
        await user.save();
      }

      const hasEmail = Boolean(user.email);
      const hasPhone = Boolean(user.phone);
      if (!hasEmail && !hasPhone) {
        await setSessionCookie(await createSessionToken(sessionFromUser(user)));
        return NextResponse.json({
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isSuperAdmin: Boolean(user.isSuperAdmin),
          },
        });
      }

      const pendingToken = await createChallengeToken(
        {
          purpose: "admin_2fa_choice",
          userId: String(user._id),
        },
        "15m"
      );

      return NextResponse.json({
        requiresOtpChoice: true,
        pendingToken,
        channels: {
          ...(hasEmail ? { email: { masked: maskEmail(user.email) } } : {}),
          ...(hasPhone && user.phone
            ? { phone: { masked: maskPhone(user.phone) } }
            : {}),
        },
      });
    }

    if (!user.emailVerified && user.authProvider === "local") {
      const { code, token: emailChallengeToken } = await issueOtpChallenge({
        purpose: "login_email_pending",
        userId: String(user._id),
        email: user.email,
      });
      const sent = await sendEmailOtp(user.email, code);
      if (sent.skipped) {
        user.emailVerified = true;
        await user.save();
        await setSessionCookie(await createSessionToken(sessionFromUser(user)));
        return NextResponse.json({
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        });
      }
      return NextResponse.json({
        requiresEmailOtp: true,
        emailChallengeToken,
        maskedEmail: maskEmail(user.email),
      });
    }

    await setSessionCookie(await createSessionToken(sessionFromUser(user)));
    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error("login", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Login failed" },
      { status: 500 }
    );
  }
}
