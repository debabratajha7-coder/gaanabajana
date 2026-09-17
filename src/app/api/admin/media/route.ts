import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authErrorResponse, requireAdminPermission } from "@/lib/auth";
import { deleteMedia, isCloudinaryConfigured, uploadBuffer } from "@/lib/cloudinary";
import { Media } from "@/models/Media";
import { z } from "zod";

export async function GET() {
  try {
    await requireAdminPermission("media");
    await connectDB();
    const items = await Media.find().sort({ createdAt: -1 }).limit(100).lean();
    return NextResponse.json({
      items,
      configured: isCloudinaryConfigured(),
    });
  } catch (e) {
    return authErrorResponse(e);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdminPermission("media");
    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        { error: "Cloudinary not configured. Add CLOUDINARY_* keys." },
        { status: 503 }
      );
    }
    const form = await req.formData();
    const file = form.get("file");
    const alt = String(form.get("alt") || "");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadBuffer(buffer);
    await connectDB();
    const media = await Media.create({
      publicId: uploaded.public_id,
      url: uploaded.secure_url,
      alt,
      bytes: uploaded.bytes,
      format: uploaded.format,
      folder: "gaanabajana",
    });
    return NextResponse.json({ media });
  } catch (e) {
    return authErrorResponse(e);
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdminPermission("media");
    const { publicId } = z.object({ publicId: z.string() }).parse(await req.json());
    if (isCloudinaryConfigured()) {
      await deleteMedia(publicId);
    }
    await connectDB();
    await Media.findOneAndDelete({ publicId });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return authErrorResponse(e);
  }
}
