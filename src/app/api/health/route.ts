import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

export async function GET() {
  const mongoConfigured = Boolean(process.env.MONGODB_URI);
  const jwtConfigured = Boolean(process.env.JWT_SECRET);

  let mongoOk = false;
  let mongoError: string | null = null;

  if (mongoConfigured) {
    try {
      await connectDB();
      mongoOk = true;
    } catch (err) {
      mongoError =
        err instanceof Error ? err.message : "MongoDB connection failed";
    }
  } else {
    mongoError = "MONGODB_URI is not set on the host";
  }

  const ok = mongoOk && jwtConfigured;
  return NextResponse.json(
    {
      ok,
      mongoConfigured,
      mongoOk,
      mongoError,
      jwtConfigured,
      cloudinaryConfigured: Boolean(
        process.env.CLOUDINARY_CLOUD_NAME &&
          process.env.CLOUDINARY_API_KEY &&
          process.env.CLOUDINARY_API_SECRET
      ),
      tip: !mongoOk
        ? "Add MONGODB_URI + JWT_SECRET in Vercel → Settings → Environment Variables, allow 0.0.0.0/0 in Atlas Network Access, then Redeploy."
        : "Database connected.",
    },
    { status: ok ? 200 : 503 }
  );
}
