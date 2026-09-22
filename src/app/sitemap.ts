import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { Brand } from "@/models/Brand";
import { BlogPost } from "@/models/BlogPost";

export const dynamic = "force-dynamic";

const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://gaanabajana.com"
).replace(/\/$/, "");

const POLICY_SLUGS = [
  "shipping",
  "returns",
  "warranty",
  "privacy",
  "terms",
] as const;

/** Public static routes (excludes admin, account, checkout). */
const STATIC_ROUTES: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.7 },
  { path: "/faqs", changeFrequency: "monthly", priority: 0.6 },
  { path: "/stores", changeFrequency: "monthly", priority: 0.7 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.7 },
  { path: "/deals", changeFrequency: "daily", priority: 0.8 },
  { path: "/deals/sale", changeFrequency: "daily", priority: 0.75 },
  { path: "/deals/open-box", changeFrequency: "daily", priority: 0.75 },
  { path: "/track-order", changeFrequency: "monthly", priority: 0.4 },
  { path: "/cart", changeFrequency: "weekly", priority: 0.3 },
  { path: "/login", changeFrequency: "yearly", priority: 0.2 },
  { path: "/register", changeFrequency: "yearly", priority: 0.2 },
];

type LeanSlug = {
  slug: string;
  updatedAt?: Date;
  publishedAt?: Date;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path === "/" ? "" : route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  for (const slug of POLICY_SLUGS) {
    entries.push({
      url: `${SITE_URL}/policies/${slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  try {
    await connectDB();

    const [products, categories, brands, posts] = await Promise.all([
      Product.find({ isActive: true })
        .select("slug updatedAt")
        .lean<LeanSlug[]>(),
      Category.find({ isActive: true })
        .select("slug updatedAt")
        .lean<LeanSlug[]>(),
      Brand.find({ isActive: true })
        .select("slug updatedAt")
        .lean<LeanSlug[]>(),
      BlogPost.find({ published: true })
        .select("slug updatedAt publishedAt")
        .lean<LeanSlug[]>(),
    ]);

    for (const p of products) {
      if (!p.slug) continue;
      entries.push({
        url: `${SITE_URL}/products/${p.slug}`,
        lastModified: p.updatedAt || now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    for (const c of categories) {
      if (!c.slug) continue;
      entries.push({
        url: `${SITE_URL}/collections/${c.slug}`,
        lastModified: c.updatedAt || now,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    for (const b of brands) {
      if (!b.slug) continue;
      entries.push({
        url: `${SITE_URL}/brands/${b.slug}`,
        lastModified: b.updatedAt || now,
        changeFrequency: "weekly",
        priority: 0.65,
      });
    }

    for (const post of posts) {
      if (!post.slug) continue;
      entries.push({
        url: `${SITE_URL}/blog/${post.slug}`,
        lastModified: post.updatedAt || post.publishedAt || now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  } catch (err) {
    console.error("[sitemap] Failed to load dynamic routes:", err);
  }

  return entries;
}
