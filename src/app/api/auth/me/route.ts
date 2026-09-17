import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ALL_ADMIN_PERMISSIONS } from "@/lib/permissions";
import { User } from "@/models/User";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null });
  await connectDB();
  const user = await User.findById(session.id)
    .select(
      "name email role phone wishlist addresses authProvider passwordHash isSuperAdmin adminPermissions phoneVerified emailVerified isActive"
    )
    .lean();
  if (!user || user.isActive === false) return NextResponse.json({ user: null });

  const isSuperAdmin = Boolean(user.isSuperAdmin);
  const adminPermissions = isSuperAdmin
    ? [...ALL_ADMIN_PERMISSIONS]
    : user.adminPermissions || [];

  return NextResponse.json({
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || "",
      authProvider: user.authProvider || "local",
      hasPassword: Boolean(user.passwordHash),
      isSuperAdmin,
      adminPermissions,
      phoneVerified: Boolean(user.phoneVerified),
      emailVerified: Boolean(user.emailVerified),
      wishlist: user.wishlist?.map(String) || [],
      addresses: user.addresses || [],
    },
  });
}
