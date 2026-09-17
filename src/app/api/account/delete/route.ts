import { NextResponse } from "next/server";
import { z } from "zod";
import {
  authErrorResponse,
  clearSessionCookie,
  requireUser,
  verifyPassword,
} from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { consumeOtpChallenge } from "@/lib/otp";
import { User } from "@/models/User";
import { Review } from "@/models/Review";
import { Order } from "@/models/Order";

const schema = z
  .object({
    reason: z.enum([
      "too_many_emails",
      "privacy",
      "not_using",
      "better_alternative",
      "other",
    ]),
    feedback: z.string().max(1000).optional(),
    confirmText: z.string(),
    password: z.string().optional(),
    challengeToken: z.string().optional(),
    code: z.string().min(4).max(8).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.confirmText.trim().toUpperCase() !== "DELETE") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Type DELETE to confirm",
        path: ["confirmText"],
      });
    }
    const hasPassword = Boolean(val.password?.trim());
    const hasOtp = Boolean(val.challengeToken && val.code);
    if (!hasPassword && !hasOtp) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter your password or verify with OTP",
        path: ["password"],
      });
    }
  });

export async function POST(req: Request) {
  try {
    const session = await requireUser();
    if (session.role === "admin") {
      return NextResponse.json(
        {
          error:
            "Admin accounts can’t be deleted here. Ask another main admin if needed.",
        },
        { status: 403 }
      );
    }

    const raw = await req.json();
    const body = schema.parse(raw);
    await connectDB();

    const user = await User.findById(session.id);
    if (!user) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (body.challengeToken && body.code) {
      const result = await consumeOtpChallenge<{ userId?: string }>(
        body.challengeToken,
        body.code,
        "account_delete"
      );
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      if (result.payload.userId !== String(user._id)) {
        return NextResponse.json({ error: "Invalid verification" }, { status: 400 });
      }
    } else {
      if (!user.passwordHash) {
        return NextResponse.json(
          { error: "Use email or phone OTP to confirm deletion." },
          { status: 400 }
        );
      }
      if (!(await verifyPassword(body.password || "", user.passwordHash))) {
        return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
      }
    }

    await Order.updateMany({ user: user._id }, { $unset: { user: 1 } });
    await Review.deleteMany({ user: user._id });

    console.log("[account deleted]", {
      userId: String(user._id),
      reason: body.reason,
      feedback: body.feedback?.slice(0, 200) || null,
    });

    await user.deleteOne();
    await clearSessionCookie();

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }
    return authErrorResponse(error);
  }
}
