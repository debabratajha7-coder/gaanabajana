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
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
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
    const limited = rateLimit(`login:${clientIp(req)}`, 8, 15 * 60_000);
    if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

    const body = schema.parse(await req.json());
    const idKey = body.identifier.trim().toLowerCase().slice(0, 80);
    const idLimited = rateLimit(`login-id:${idKey}`, 10, 15 * 60_000);
    if (!idLimited.ok) return rateLimitResponse(idLimited.retryAfterSec);

    await connectDB();
    const user = await findUserByIdentifier(body.identifier);
    if (!user?.passwordHash) {
      return NextResponse.json(
        { error: "Invalid phone/email or password" },
        { status: 401 }
      );
    }
    if (user.isActive === false) {
      return NextResponse.json(
        { error: "This account is disabled" },
        { status: 403 }
      );
    }
    if (!(await verifyPassword(body.password, user.passwordHash))) {
      return NextResponse.json(
        { error: "Invalid phone/email or password" },
        { status: 401 }
      );
    }

    if (user.role === "admin") {
      // Seed OTP phone from ADMIN_PHONE only when the account has none.
      // Never overwrite a number the admin already set (any device / future changes).
      if (!user.phone) {
        const envPhone = (process.env.ADMIN_PHONE || "").replace(/\s/g, "");
        if (envPhone) {
          try {
            user.phone = normalizeIndianPhone(envPhone);
            user.phoneVerified = true;
            await user.save();
          } catch {
            /* ignore invalid ADMIN_PHONE */
          }
        }
      }

      const hasEmail = Boolean(user.email);
      const hasPhone = Boolean(user.phone);
      if (!hasEmail && !hasPhone) {
        return NextResponse.json(
          {
            error:
              "Admin accounts require a verified email or phone for two-factor login. Contact the store owner.",
          },
          { status: 403 }
        );
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
      return NextResponse.json(
        { error: error.issues[0]?.message },
        { status: 400 }
      );
    }
    console.error("login", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Login failed" },
      { status: 500 }
    );
  }
}
