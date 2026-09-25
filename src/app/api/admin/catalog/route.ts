import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { authErrorResponse, requireAdminPermission } from "@/lib/auth";
import { Category } from "@/models/Category";
import { Brand } from "@/models/Brand";
import { slugify } from "@/lib/utils";
import { ensureCatalogCoreSubtypes } from "@/lib/ensure-catalog";

export async function GET() {
  try {
    await requireAdminPermission("catalog");
    await connectDB();
    await ensureCatalogCoreSubtypes();
    const [categories, brands] = await Promise.all([
      Category.find().sort({ sortOrder: 1, name: 1 }).lean(),
      Brand.find().sort({ name: 1 }).lean(),
    ]);
    return NextResponse.json({ categories, brands });
  } catch (e) {
    return authErrorResponse(e);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdminPermission("catalog");
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
      let slug = slugify(data.name);
      const exists = await Category.findOne({ slug }).lean();
      if (exists) {
        const suffix = data.parent
          ? String(data.parent).slice(-5)
          : String(Date.now()).slice(-5);
        slug = `${slug}-${suffix}`;
      }
      const category = await Category.create({
        ...data,
        parent: data.parent || null,
        slug,
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
    await requireAdminPermission("catalog");
    const body = await req.json();
    await connectDB();
    if (body.type === "category") {
      const category = await Category.findByIdAndUpdate(body.id, body.data, {
        returnDocument: "after",
      });
      return NextResponse.json({ category });
    }
    if (body.type === "brand") {
      const data = z
        .object({
          name: z.string().min(1).optional(),
          logo: z.string().optional(),
          description: z.string().optional(),
          isActive: z.boolean().optional(),
        })
        .parse(body.data ?? {});
      const brand = await Brand.findByIdAndUpdate(body.id, data, {
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
    await requireAdminPermission("catalog");
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
