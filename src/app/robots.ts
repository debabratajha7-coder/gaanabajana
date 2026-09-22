import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "Googlebot",
        allow: ["/", "/sitemap.xml"],
        disallow: ["/admin/", "/account/", "/api/", "/checkout/"],
      },
      {
        userAgent: "*",
        allow: ["/", "/sitemap.xml"],
        disallow: ["/admin/", "/account/", "/api/", "/checkout/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
