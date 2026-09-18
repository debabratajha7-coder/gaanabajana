import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

/** Must stay Edge-safe — do not import @/lib/auth (mongoose/bcrypt). */
const COOKIE_NAME = "gb_session";

async function readAdminSession(token: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );
    if (payload.role !== "admin" || !payload.sub) return null;
    return { id: String(payload.sub), role: "admin" as const };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    const session = await readAdminSession(token);
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch (err) {
    console.error("admin middleware failed", err);
    // Fail open to the client layout auth check instead of a hard 500
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
