import { NextResponse } from "next/server";
import { z } from "zod";
import {
  authErrorResponse,
  hashPassword,
  requireAdminPermission,
} from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ALL_ADMIN_PERMISSIONS } from "@/lib/permissions";
import { normalizeIndianPhone } from "@/lib/otp";
import { User } from "@/models/User";

function publicUser(u: {
  _id: { toString(): string };
  name: string;
  email: string;
  phone?: string;
  role: string;
  isSuperAdmin?: boolean;
  adminPermissions?: string[];
  phoneVerified?: boolean;
  emailVerified?: boolean;
  isActive?: boolean;
  createdAt?: Date;
}) {
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    phone: u.phone || "",
    role: u.role,
    isSuperAdmin: Boolean(u.isSuperAdmin),
    adminPermissions: u.adminPermissions || [],
    phoneVerified: Boolean(u.phoneVerified),
    emailVerified: Boolean(u.emailVerified),
    isActive: u.isActive !== false,
    createdAt: u.createdAt,
  };
}

export async function GET() {
  try {
    await requireAdminPermission("users");
    await connectDB();
    const users = await User.find()
      .select(
        "name email phone role isSuperAdmin adminPermissions phoneVerified emailVerified isActive createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ users: users.map(publicUser) });
  } catch (error) {
    return authErrorResponse(error);
  }
}

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  password: z.string().min(6),
  role: z.enum(["customer", "admin"]),
  adminPermissions: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await requireAdminPermission("users");
    const body = createSchema.parse(await req.json());
    await connectDB();

    const email = body.email.toLowerCase().trim();
    const phone = normalizeIndianPhone(body.phone);

    if (await User.findOne({ email })) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }
    if (await User.findOne({ phone })) {
      return NextResponse.json({ error: "Phone already in use" }, { status: 400 });
    }

    if (body.role === "admin" && !session.isSuperAdmin) {
      return NextResponse.json(
        { error: "Only the main admin can create staff accounts" },
        { status: 403 }
      );
    }

    const permissions =
      body.role === "admin"
        ? (body.adminPermissions || []).filter((p) =>
            (ALL_ADMIN_PERMISSIONS as readonly string[]).includes(p)
          )
        : [];

    const user = await User.create({
      name: body.name.trim(),
      email,
      phone,
      phoneVerified: true,
      emailVerified: true,
      passwordHash: await hashPassword(body.password),
      authProvider: "local",
      role: body.role,
      isSuperAdmin: false,
      adminPermissions: permissions,
      isActive: body.isActive !== false,
    });

    return NextResponse.json({ user: publicUser(user) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    return authErrorResponse(error);
  }
}

const patchSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  role: z.enum(["customer", "admin"]).optional(),
  adminPermissions: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

export async function PATCH(req: Request) {
  try {
    const session = await requireAdminPermission("users");
    const body = patchSchema.parse(await req.json());
    await connectDB();

    const user = await User.findById(body.id);
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (user.isSuperAdmin && session.id !== String(user._id)) {
      return NextResponse.json(
        { error: "Cannot modify the main admin account this way" },
        { status: 403 }
      );
    }

    if (body.role === "admin" && !session.isSuperAdmin && !user.isSuperAdmin) {
      // staff editing other staff roles blocked
      if (user.role !== "admin" || body.adminPermissions) {
        return NextResponse.json(
          { error: "Only the main admin can manage staff permissions" },
          { status: 403 }
        );
      }
    }

    if (body.name) user.name = body.name.trim();
    if (body.phone) {
      if (String(user._id) === session.id && user.role === "admin") {
        return NextResponse.json(
          {
            error:
              "Change your own OTP phone from Admin → Login & security (password + SMS verify).",
          },
          { status: 400 }
        );
      }
      const phone = normalizeIndianPhone(body.phone);
      const clash = await User.findOne({ phone, _id: { $ne: user._id } });
      if (clash) {
        return NextResponse.json({ error: "Phone already in use" }, { status: 400 });
      }
      user.phone = phone;
      user.phoneVerified = true;
    }
    if (typeof body.isActive === "boolean") {
      if (user.isSuperAdmin) {
        return NextResponse.json(
          { error: "Main admin cannot be disabled" },
          { status: 400 }
        );
      }
      user.isActive = body.isActive;
    }
    if (body.role && session.isSuperAdmin && !user.isSuperAdmin) {
      user.role = body.role;
      if (body.role === "customer") {
        user.adminPermissions = [];
        user.isSuperAdmin = false;
      }
    }
    if (body.adminPermissions && session.isSuperAdmin && !user.isSuperAdmin) {
      user.adminPermissions = body.adminPermissions.filter((p) =>
        (ALL_ADMIN_PERMISSIONS as readonly string[]).includes(p)
      ) as typeof user.adminPermissions;
      if (user.role !== "admin") user.role = "admin";
    }
    if (body.password) {
      user.passwordHash = await hashPassword(body.password);
    }

    await user.save();
    return NextResponse.json({ user: publicUser(user) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    return authErrorResponse(error);
  }
}

const deleteSchema = z.object({ id: z.string().min(1) });

export async function DELETE(req: Request) {
  try {
    const session = await requireAdminPermission("users");
    if (!session.isSuperAdmin) {
      return NextResponse.json(
        { error: "Only the main admin can delete users" },
        { status: 403 }
      );
    }
    const { id } = deleteSchema.parse(await req.json());
    await connectDB();
    const user = await User.findById(id);
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (user.isSuperAdmin || String(user._id) === session.id) {
      return NextResponse.json(
        { error: "Cannot delete the main admin" },
        { status: 400 }
      );
    }
    await user.deleteOne();
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    return authErrorResponse(error);
  }
}
