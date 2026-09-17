import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import {
  AdminPermission,
  hasAdminPermission,
} from "@/lib/permissions";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

const COOKIE_NAME = "gb_session";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "customer" | "admin";
  isSuperAdmin?: boolean;
  adminPermissions?: string[];
};

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(user: SessionUser) {
  // Plain array only — Mongoose DocumentArray cannot be cloned into SignJWT
  const adminPermissions = Array.from(user.adminPermissions || []).map(String);
  return new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
    isSuperAdmin: Boolean(user.isSuperAdmin),
    adminPermissions,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub || typeof payload.email !== "string") return null;
    return {
      id: payload.sub,
      email: payload.email,
      name: String(payload.name ?? ""),
      role: payload.role === "admin" ? "admin" : "customer",
      isSuperAdmin: Boolean(payload.isSuperAdmin),
      adminPermissions: Array.isArray(payload.adminPermissions)
        ? (payload.adminPermissions as string[])
        : [],
    };
  } catch {
    return null;
  }
}

export async function createChallengeToken(
  payload: Record<string, unknown>,
  expiresIn = "20m"
) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret());
}

export async function verifyChallengeToken<T extends Record<string, unknown>>(
  token: string
): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as T;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireUser() {
  const session = await getSession();
  if (!session) throw new AuthError("Unauthorized", 401);
  return session;
}

export async function requireAdmin() {
  const session = await requireUser();
  if (session.role !== "admin") throw new AuthError("Forbidden", 403);
  await connectDB();
  const user = await User.findById(session.id)
    .select("isActive isSuperAdmin adminPermissions role")
    .lean();
  if (!user || user.isActive === false) {
    throw new AuthError("Account disabled", 403);
  }
  return {
    ...session,
    isSuperAdmin: Boolean(user.isSuperAdmin),
    adminPermissions: (user.adminPermissions || []) as string[],
  };
}

export async function requireAdminPermission(permission: AdminPermission) {
  const session = await requireAdmin();
  if (
    !hasAdminPermission(
      {
        role: session.role,
        isSuperAdmin: session.isSuperAdmin,
        adminPermissions: session.adminPermissions,
      },
      permission
    )
  ) {
    throw new AuthError("You do not have access to this section", 403);
  }
  return session;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return NextResponse.json({ error: "Server error" }, { status: 500 });
}

export async function getSessionFromRequest(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function sessionFromUser(user: {
  _id: { toString(): string };
  email: string;
  name: string;
  role: "customer" | "admin";
  isSuperAdmin?: boolean;
  adminPermissions?: string[];
}): SessionUser {
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role,
    isSuperAdmin: Boolean(user.isSuperAdmin),
    adminPermissions: Array.from(user.adminPermissions || []).map(String),
  };
}

export { COOKIE_NAME };
