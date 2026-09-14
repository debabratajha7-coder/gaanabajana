import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import {
  googleAuthUrl,
  googleConfigured,
  setOAuthStateCookie,
} from "@/lib/google-oauth";

export async function GET() {
  if (!googleConfigured()) {
    return NextResponse.redirect(
      new URL(
        "/login?error=google_not_configured",
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      )
    );
  }

  const state = randomBytes(24).toString("hex");
  const res = NextResponse.redirect(googleAuthUrl(state));
  setOAuthStateCookie(res, state);
  return res;
}
