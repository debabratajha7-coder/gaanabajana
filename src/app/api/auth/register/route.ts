import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import {
  createSessionToken,
  hashPassword,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { User } from "@/models/User";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = registerSchema.parse(await req.json());
    await connectDB();
    const exists = await User.findOne({ email: body.email.toLowerCase() });
    if (exists) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }
    const user = await User.create({
      name: body.name,
      email: body.email.toLowerCase(),
      phone: body.phone,
      passwordHash: await hashPassword(body.password),
      role: "customer",
    });
    const token = await createSessionToken({
      id: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
    });
    await setSessionCookie(token);
    return NextResponse.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
