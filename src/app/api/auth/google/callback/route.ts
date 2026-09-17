import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { createSessionToken, sessionFromUser, COOKIE_NAME } from "@/lib/auth";
import {
  STATE_COOKIE,
  clearOAuthStateCookie,
  googleConfigured,
  googleRedirectUri,
} from "@/lib/google-oauth";
import { User } from "@/models/User";

function appUrl(path: string) {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/$/,
    ""
  );
  return new URL(path, base);
}

export async function GET(req: NextRequest) {
  if (!googleConfigured()) {
    return NextResponse.redirect(appUrl("/login?error=google_not_configured"));
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const savedState = req.cookies.get(STATE_COOKIE)?.value;

  if (error) {
    return NextResponse.redirect(appUrl(`/login?error=${encodeURIComponent(error)}`));
  }

  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(appUrl("/login?error=invalid_oauth_state"));
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: googleRedirectUri(),
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      console.error("Google token exchange failed", await tokenRes.text());
      return NextResponse.redirect(appUrl("/login?error=google_token_failed"));
    }

    const tokens = (await tokenRes.json()) as { access_token?: string };
    if (!tokens.access_token) {
      return NextResponse.redirect(appUrl("/login?error=google_token_failed"));
    }

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!profileRes.ok) {
      return NextResponse.redirect(appUrl("/login?error=google_profile_failed"));
    }

    const profile = (await profileRes.json()) as {
      sub?: string;
      email?: string;
      name?: string;
      email_verified?: boolean;
    };

    if (!profile.sub || !profile.email || profile.email_verified === false) {
      return NextResponse.redirect(appUrl("/login?error=google_email_required"));
    }

    await connectDB();
    const email = profile.email.toLowerCase();
    let user = await User.findOne({
      $or: [{ googleId: profile.sub }, { email }],
    });

    if (!user) {
      user = await User.create({
        name: profile.name || email.split("@")[0],
        email,
        googleId: profile.sub,
        authProvider: "google",
        role: "customer",
        emailVerified: true,
        isActive: true,
      });
    } else {
      if (!user.googleId) user.googleId = profile.sub;
      if (!user.name && profile.name) user.name = profile.name;
      if (user.authProvider !== "google" && !user.passwordHash) {
        user.authProvider = "google";
      }
      user.emailVerified = true;
      await user.save();
    }

    const token = await createSessionToken(sessionFromUser(user));

    const dest = user.role === "admin" ? "/admin" : "/account";
    const res = NextResponse.redirect(appUrl(dest));
    clearOAuthStateCookie(res);
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.redirect(appUrl("/login?error=google_failed"));
  }
}
