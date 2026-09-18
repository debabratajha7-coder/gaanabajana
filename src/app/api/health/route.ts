import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

export async function GET() {
  const mongoConfigured = Boolean(process.env.MONGODB_URI);
  const jwtConfigured = Boolean(process.env.JWT_SECRET);

  let mongoOk = false;

  if (mongoConfigured) {
    try {
      await connectDB();
      mongoOk = true;
    } catch {
      mongoOk = false;
    }
  }

  const ok = mongoOk && jwtConfigured;
  return NextResponse.json(
    {
      ok,
      mongoOk,
      jwtConfigured,
    },
    { status: ok ? 200 : 503 }
  );
}
