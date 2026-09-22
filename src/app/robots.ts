import type { MetadataRoute } from "next";

const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://gaanabajana.com"
)
  .trim()
  .replace(/\/$/, "");

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
