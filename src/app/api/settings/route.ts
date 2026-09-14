import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSiteSettings } from "@/models/SiteSettings";
import { PageContent } from "@/models/PageContent";

export async function GET() {
  await connectDB();
  const settings = await getSiteSettings();
  const pages = await PageContent.find().lean();
  return NextResponse.json({ settings, pages });
}
