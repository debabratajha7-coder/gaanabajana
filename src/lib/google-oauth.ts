import { NextResponse } from "next/server";

const STATE_COOKIE = "gb_oauth_state";

export function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function googleRedirectUri() {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/$/,
    ""
  );
  return `${base}/api/auth/google/callback`;
}

export function googleAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: googleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function setOAuthStateCookie(res: NextResponse, state: string) {
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
}

export function clearOAuthStateCookie(res: NextResponse) {
  res.cookies.delete(STATE_COOKIE);
}

export { STATE_COOKIE };
