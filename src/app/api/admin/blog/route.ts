import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { authErrorResponse, requireAdmin } from "@/lib/auth";
import { BlogPost } from "@/models/BlogPost";
import { slugify } from "@/lib/utils";

export async function GET() {
  try {
    await requireAdmin();
    await connectDB();
    const posts = await BlogPost.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ posts });
  } catch (e) {
    return authErrorResponse(e);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = z
      .object({
        title: z.string(),
        excerpt: z.string().optional(),
        body: z.string(),
        coverImage: z.string().optional(),
        published: z.boolean().optional(),
      })
      .parse(await req.json());
    await connectDB();
    const post = await BlogPost.create({
      ...body,
      slug: slugify(body.title),
      publishedAt: body.published ? new Date() : undefined,
    });
    return NextResponse.json({ post });
  } catch (e) {
    return authErrorResponse(e);
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const body = z
      .object({
        id: z.string(),
        title: z.string().optional(),
        excerpt: z.string().optional(),
        body: z.string().optional(),
        coverImage: z.string().optional(),
        published: z.boolean().optional(),
      })
      .parse(await req.json());
    await connectDB();
    const { id, ...rest } = body;
    const post = await BlogPost.findByIdAndUpdate(
      id,
      {
        ...rest,
        ...(rest.published ? { publishedAt: new Date() } : {}),
      },
      { new: true }
    );
    return NextResponse.json({ post });
  } catch (e) {
    return authErrorResponse(e);
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdmin();
    const { id } = z.object({ id: z.string() }).parse(await req.json());
    await connectDB();
    await BlogPost.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return authErrorResponse(e);
  }
}
