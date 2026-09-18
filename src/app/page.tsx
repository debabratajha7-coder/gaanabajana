import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { Brand } from "@/models/Brand";
import { BlogPost } from "@/models/BlogPost";
import { getSiteSettings } from "@/models/SiteSettings";
import type { ProductCardData } from "@/lib/product-card";
import { mapColorOptions } from "@/lib/product-card";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { HeroStage } from "@/components/home/HeroStage";
import { BrandLogoGrid } from "@/components/home/BrandLogoGrid";
import { CategoryCarousel } from "@/components/home/CategoryCarousel";
import { BestsellerTabs } from "@/components/home/BestsellerTabs";
import { WhyUsGrid } from "@/components/home/WhyUsGrid";
import { StatsStrip } from "@/components/home/StatsStrip";
import { filterPublicCategories } from "@/lib/public-catalog";

export const dynamic = "force-dynamic";

type LeanBrand = { name?: string; slug?: string } | null;

function toCard(p: {
  _id: unknown;
  title: string;
  slug: string;
  price: number;
  mrp: number;
  images?: string[];
  colorOptions?: { name?: string; swatch?: string; images?: string[] }[];
  ratingAvg?: number;
  ratingCount?: number;
  brand?: LeanBrand;
  onSale?: boolean;
}): ProductCardData {
  return {
    _id: String(p._id),
    title: p.title,
    slug: p.slug,
    price: p.price,
    mrp: p.mrp,
    images: p.images,
    colorOptions: mapColorOptions(p.colorOptions),
    ratingAvg: p.ratingAvg,
    ratingCount: p.ratingCount,
    brandName: p.brand?.name || null,
    onSale: p.onSale,
  };
}

export default async function HomePage() {
  let settings;
  let featured: Parameters<typeof toCard>[0][] = [];
  let parents: { _id: unknown; name: string; slug: string; image?: string }[] = [];
  let brands: { _id: string; name: string; slug: string; logo?: string }[] = [];
  let posts: {
    _id: unknown;
    title: string;
    slug: string;
    excerpt?: string;
    coverImage?: string;
    publishedAt?: Date;
  }[] = [];
  const productsByTab: Record<string, ProductCardData[]> = {};

  try {
    await connectDB();
    settings = await getSiteSettings();
    const [featuredDocs, parentDocs, brandDocs, postDocs] = await Promise.all([
      Product.find({ isActive: true, featured: true })
        .populate("brand", "name slug")
        .limit(24)
        .lean(),
      Category.find({ isActive: true, parent: null }).sort({ sortOrder: 1 }).lean(),
      Brand.find({ isActive: true }).sort({ name: 1 }).limit(24).lean(),
      BlogPost.find({ published: true }).sort({ publishedAt: -1 }).limit(3).lean(),
    ]);
    featured = featuredDocs as Parameters<typeof toCard>[0][];
    parents = parentDocs as typeof parents;
    posts = postDocs as typeof posts;
    brands = brandDocs.map((b) => ({
      _id: String(b._id),
      name: b.name,
      slug: b.slug,
      logo: b.logo || undefined,
    }));

    const shopParentsEarly = filterPublicCategories(
      parents.map((c) => ({ ...c, slug: c.slug, name: c.name }))
    ).slice(0, 5);

    await Promise.all(
      shopParentsEarly.map(async (cat) => {
        const kids = await Category.find({
          parent: cat._id,
          isActive: true,
        })
          .select("_id")
          .lean();
        const ids = [cat._id, ...kids.map((k) => k._id)];
        const docs = await Product.find({
          isActive: true,
          categories: { $in: ids },
        })
          .populate("brand", "name slug")
          .sort({ featured: -1, ratingCount: -1, updatedAt: -1 })
          .limit(8)
          .lean();
        productsByTab[String(cat._id)] = docs.map((p) =>
          toCard({ ...p, brand: p.brand as LeanBrand })
        );
      })
    );

  } catch {
    settings = {
      heroHeadline: "Find the instrument that finds your sound",
      heroSubheadline:
        "Guitars, keys, drums, and studio gear — curated for Indian musicians.",
      heroCtaLabel: "Shop bestsellers",
      heroCtaHref: "/collections/guitars",
      heroImage:
        "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=2000&q=80",
      storeName: "Gaana Bajana",
      homeCategoriesEyebrow: "Explore",
      homeCategoriesTitle: "Explore By Category",
      homeBestsellersEyebrow: "Curated",
      homeBestsellersTitle: "Best Sellers",
      homeBrandsEyebrow: "Trusted names",
      homeBrandsTitle: "Top Brands",
      homeBlogEyebrow: "Learn",
      homeBlogTitle: "Latest Stories",
      homeWhyTitle: "Why Gaana Bajana",
      homeWhyItems: [],
      homeStats: [],
    };
  }

  const shopParents = filterPublicCategories(
    parents.map((c) => ({ ...c, slug: c.slug, name: c.name }))
  );

  const tabs = shopParents.slice(0, 5).map((c) => ({
    id: String(c._id),
    label: c.name,
    href: `/collections/${c.slug}`,
  }));

  const whyItems = (settings.homeWhyItems || []).map(
    (i: { title: string; body: string }) => ({
      title: i.title,
      body: i.body,
    })
  );
  const stats = (settings.homeStats || []).map(
    (s: { value: string; label: string }) => ({
      value: s.value,
      label: s.label,
    })
  );

  return (
    <>
      <HeroStage
        image={settings.heroImage}
        storeName={settings.storeName || "Gaana Bajana"}
        headline={settings.heroHeadline}
        subheadline={settings.heroSubheadline}
        ctaLabel={settings.heroCtaLabel}
        ctaHref={settings.heroCtaHref}
      />

      <section className="bg-white">
        <div className="container-gb section-gb">
          <Reveal>
            <SectionHeader
              title={settings.homeCategoriesTitle || "Explore By Category"}
              centered
            />
          </Reveal>
          <Reveal delay={0.05}>
            <CategoryCarousel
              categories={shopParents.slice(0, 10).map((c) => ({
                _id: String(c._id),
                name: c.name,
                slug: c.slug,
                image: c.image,
              }))}
            />
          </Reveal>
        </div>
      </section>

      <section className="border-t border-[var(--line)] bg-[var(--bg-soft)]">
        <div className="container-gb section-gb">
          <Reveal>
            <SectionHeader
              title={settings.homeBestsellersTitle || "Best Sellers"}
              centered
            />
          </Reveal>
          <Reveal delay={0.05}>
            <BestsellerTabs tabs={tabs} productsByTab={productsByTab} />
          </Reveal>
          {!featured.length && !Object.values(productsByTab).some((a) => a.length) && (
            <p className="mt-6 text-center text-[var(--fg-muted)]">
              Products will appear here once the catalog is connected.
            </p>
          )}
        </div>
      </section>

      <WhyUsGrid
        title={settings.homeWhyTitle || "Why Gaana Bajana"}
        items={whyItems}
      />

      <section className="bg-white">
        <div className="container-gb section-gb">
          <Reveal>
            <SectionHeader
              title={settings.homeBrandsTitle || "Top Brands"}
              centered
            />
          </Reveal>
          <Reveal delay={0.05}>
            <BrandLogoGrid brands={brands} />
          </Reveal>
        </div>
      </section>

      <StatsStrip items={stats} />

      {posts.length > 0 && (
        <section className="bg-white">
          <div className="container-gb section-gb">
            <Reveal>
              <SectionHeader
                title={settings.homeBlogTitle || "Latest Stories"}
                href="/blog"
                centered
              />
            </Reveal>
            <div className="grid gap-4 md:grid-cols-2">
              {posts.map((post, i) => (
                <Reveal key={String(post._id)} delay={i * 0.06}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group flex flex-col overflow-hidden border border-[var(--line)] bg-white transition hover:shadow-sm sm:flex-row"
                  >
                    {post.coverImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.coverImage}
                        alt=""
                        className="aspect-[16/10] w-full object-cover sm:w-44 sm:shrink-0"
                        loading="lazy"
                      />
                    )}
                    <div className="flex flex-1 flex-col justify-center p-4 sm:p-5">
                      <h3 className="text-lg font-semibold leading-snug group-hover:text-[var(--accent)]">
                        {post.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm text-[var(--fg-muted)]">
                        {post.excerpt}
                      </p>
                      <span className="mt-3 text-sm font-medium underline underline-offset-2">
                        Read More
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
