import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { authErrorResponse, requireAdminPermission } from "@/lib/auth";
import { getSiteSettings, SiteSettings } from "@/models/SiteSettings";
import { PageContent } from "@/models/PageContent";

export async function GET() {
  try {
    await requireAdminPermission("website");
    await connectDB();
    const settings = await getSiteSettings();
    const pages = await PageContent.find().lean();
    return NextResponse.json({ settings, pages });
  } catch (e) {
    return authErrorResponse(e);
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdminPermission("website");
    const body = await req.json();
    await connectDB();

    if (body.settings) {
      const settings = await getSiteSettings();
      Object.assign(settings, body.settings);
      await settings.save();
    }

    if (body.page) {
      const page = z
        .object({
          key: z.string(),
          title: z.string(),
          body: z.string(),
        })
        .parse(body.page);
      await PageContent.findOneAndUpdate({ key: page.key }, page, {
        upsert: true,
        new: true,
      });
    }

    const settings = await SiteSettings.findOne();
    const pages = await PageContent.find().lean();
    return NextResponse.json({ settings, pages });
  } catch (e) {
    return authErrorResponse(e);
  }
}
