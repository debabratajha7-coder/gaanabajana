import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();

/**
 * Wide open for indexing (client / GSC pressure).
 * Admin & APIs stay behind auth — no need to block crawlers here for now.
 * Tighten Disallow list later once Search Console shows the homepage as indexed.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
