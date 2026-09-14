import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { authErrorResponse, requireAdmin } from "@/lib/auth";
import { Category } from "@/models/Category";
import { Brand } from "@/models/Brand";
import { slugify } from "@/lib/utils";

export async function GET() {
  try {
    await requireAdmin();
    await connectDB();
    const [categories, brands] = await Promise.all([
      Category.find().sort({ sortOrder: 1 }).lean(),
      Brand.find().sort({ name: 1 }).lean(),
    ]);
    return NextResponse.json({ categories, brands });
  } catch (e) {
    return authErrorResponse(e);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    await connectDB();

    if (body.type === "category") {
      const data = z
        .object({
          name: z.string(),
          parent: z.string().nullable().optional(),
          sortOrder: z.number().optional(),
          description: z.string().optional(),
          image: z.string().optional(),
        })
        .parse(body);
      const category = await Category.create({
        ...data,
        slug: slugify(data.name),
      });
      return NextResponse.json({ category });
    }

    if (body.type === "brand") {
      const data = z
        .object({
          name: z.string(),
          logo: z.string().optional(),
          description: z.string().optional(),
        })
        .parse(body);
      const brand = await Brand.create({
        ...data,
        slug: slugify(data.name),
      });
      return NextResponse.json({ brand });
    }

    return NextResponse.json({ error: "type required" }, { status: 400 });
  } catch (e) {
    return authErrorResponse(e);
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    await connectDB();
    if (body.type === "category") {
      const category = await Category.findByIdAndUpdate(body.id, body.data, {
        returnDocument: "after",
      });
      return NextResponse.json({ category });
    }
    if (body.type === "brand") {
      const brand = await Brand.findByIdAndUpdate(body.id, body.data, {
        returnDocument: "after",
      });
      return NextResponse.json({ brand });
    }
    return NextResponse.json({ error: "type required" }, { status: 400 });
  } catch (e) {
    return authErrorResponse(e);
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdmin();
    const body = z
      .object({ type: z.enum(["category", "brand"]), id: z.string() })
      .parse(await req.json());
    await connectDB();
    if (body.type === "category") await Category.findByIdAndDelete(body.id);
    else await Brand.findByIdAndDelete(body.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return authErrorResponse(e);
  }
}
