import type { MetadataRoute } from "next";
import { withDbRetry } from "@/lib/db";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { Brand } from "@/models/Brand";
import { BlogPost } from "@/models/BlogPost";
import { getSiteUrl } from "@/lib/site-url";

/** Cache briefly so Google gets a fast response; short enough after catalog edits. */
export const revalidate = 600;

const SITE_URL = getSiteUrl();

const POLICY_SLUGS = [
  "shipping",
  "returns",
  "warranty",
  "privacy",
  "terms",
] as const;

/** Indexable static routes only — skip cart/auth noise. */
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
];

type LeanSlug = {
  _id?: unknown;
  slug: string;
  updatedAt?: Date;
  publishedAt?: Date;
};

type LeanProduct = LeanSlug & {
  brand?: unknown;
  categories?: unknown[];
};

function staticEntries(now: Date): MetadataRoute.Sitemap {
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

  return entries;
}

async function loadCatalogEntries(now: Date): Promise<MetadataRoute.Sitemap> {
  return withDbRetry("sitemap:catalog", async () => {
    const products = await Product.find({ isActive: true })
      .select("slug updatedAt brand categories")
      .lean<LeanProduct[]>();

    const categoryIds = new Set<string>();
    const brandIds = new Set<string>();
    for (const p of products) {
      for (const id of p.categories || []) {
        if (id) categoryIds.add(String(id));
      }
      if (p.brand) brandIds.add(String(p.brand));
    }

    const [categories, brands, posts] = await Promise.all([
      categoryIds.size
        ? Category.find({
            isActive: true,
            _id: { $in: [...categoryIds] },
          })
            .select("slug updatedAt")
            .lean<LeanSlug[]>()
        : Promise.resolve([] as LeanSlug[]),
      brandIds.size
        ? Brand.find({
            isActive: true,
            _id: { $in: [...brandIds] },
          })
            .select("slug updatedAt")
            .lean<LeanSlug[]>()
        : Promise.resolve([] as LeanSlug[]),
      BlogPost.find({ published: true })
        .select("slug updatedAt publishedAt")
        .lean<LeanSlug[]>(),
    ]);

    const entries: MetadataRoute.Sitemap = [];

    for (const p of products) {
      if (!p.slug) continue;
      entries.push({
        url: `${SITE_URL}/products/${p.slug}`,
        lastModified: p.updatedAt || now,
        changeFrequency: "weekly",
        priority: 0.9,
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

    return entries;
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries = staticEntries(now);

  try {
    entries.push(...(await loadCatalogEntries(now)));
  } catch (err) {
    // Always return a valid sitemap — never 500 Googlebots.
    console.error("[sitemap] Failed to load dynamic routes:", err);
  }

  return entries;
}
