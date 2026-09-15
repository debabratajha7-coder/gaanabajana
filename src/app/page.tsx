import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { Brand } from "@/models/Brand";
import { BlogPost } from "@/models/BlogPost";
import { getSiteSettings } from "@/models/SiteSettings";
import { ProductCard } from "@/components/product/ProductCard";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { HeroStage } from "@/components/home/HeroStage";
import { BrandLogoGrid } from "@/components/home/BrandLogoGrid";
import { categoryImage } from "@/lib/catalog-media";
import { filterPublicCategories } from "@/lib/public-catalog";

export const dynamic = "force-dynamic";

type LeanBrand = { name?: string; slug?: string } | null;

export default async function HomePage() {
  let settings;
  let featured: Awaited<ReturnType<typeof Product.find>> = [];
  let parents: Awaited<ReturnType<typeof Category.find>> = [];
  let brands: { _id: string; name: string; slug: string; logo?: string }[] = [];
  let posts: Awaited<ReturnType<typeof BlogPost.find>> = [];

  try {
    await connectDB();
    settings = await getSiteSettings();
    const [featuredDocs, parentDocs, brandDocs, postDocs] = await Promise.all([
      Product.find({ isActive: true, featured: true })
        .populate("brand", "name slug")
        .limit(8)
        .lean(),
      Category.find({ isActive: true, parent: null }).sort({ sortOrder: 1 }).lean(),
      Brand.find({ isActive: true }).sort({ name: 1 }).limit(24).lean(),
      BlogPost.find({ published: true }).sort({ publishedAt: -1 }).limit(2).lean(),
    ]);
    featured = featuredDocs;
    parents = parentDocs;
    posts = postDocs;
    brands = brandDocs.map((b) => ({
      _id: String(b._id),
      name: b.name,
      slug: b.slug,
      logo: b.logo || undefined,
    }));
  } catch {
    settings = {
      heroHeadline: "Find the instrument that finds your sound",
      heroSubheadline:
        "Guitars, keys, drums, and studio gear — curated for Indian musicians.",
      heroCtaLabel: "Shop bestsellers",
      heroCtaHref: "/collections/guitars",
      heroImage:
        "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=2000&q=80",
      storeName: "Gaanbajana",
      homeCategoriesEyebrow: "Explore",
      homeCategoriesTitle: "Shop by category",
      homeBestsellersEyebrow: "Curated",
      homeBestsellersTitle: "Bestsellers",
      homeBrandsEyebrow: "Trusted names",
      homeBrandsTitle: "Brands we stock",
      homeBlogEyebrow: "Learn",
      homeBlogTitle: "From the blog",
    };
  }

  const shopParents = filterPublicCategories(
    parents.map((c) => ({ ...c, slug: c.slug, name: c.name }))
  );

  return (
    <>
      <HeroStage
        image={settings.heroImage}
        storeName={settings.storeName || "Gaanbajana"}
        headline={settings.heroHeadline}
        subheadline={settings.heroSubheadline}
        ctaLabel={settings.heroCtaLabel}
        ctaHref={settings.heroCtaHref}
      />

      <section className="border-y border-[var(--line)]">
        <div className="container-gb section-gb">
          <Reveal>
            <SectionHeader
              eyebrow={settings.homeCategoriesEyebrow || "Explore"}
              title={settings.homeCategoriesTitle || "Shop by category"}
            />
          </Reveal>
          <Reveal delay={0.05}>
            <div className="grid grid-cols-2 border-l border-t border-[var(--line)] md:grid-cols-4">
              {shopParents.slice(0, 8).map((c) => (
                <Link
                  key={String(c._id)}
                  href={`/collections/${c.slug}`}
                  className="group relative aspect-[4/3] overflow-hidden border-b border-r border-[var(--line)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={categoryImage(c.slug, c.image)}
                    alt={c.name}
                    className="h-full w-full object-cover transition duration-[1.1s] ease-out group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent transition duration-500 group-hover:via-black/40" />
                  <span className="absolute bottom-3 left-3 display text-base transition duration-500 group-hover:-translate-y-0.5 sm:bottom-4 sm:left-4 sm:text-xl">
                    {c.name}
                  </span>
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--bg-elevated)_80%,transparent)]">
        <div className="container-gb section-gb">
          <Reveal>
            <SectionHeader
              eyebrow={settings.homeBestsellersEyebrow || "Curated"}
              title={settings.homeBestsellersTitle || "Bestsellers"}
              href="/collections/guitars"
            />
          </Reveal>
          <Reveal delay={0.06}>
            <div className="grid grid-cols-2 gap-0 border-l border-t border-[var(--line)] md:grid-cols-4">
              {featured.map((p) => {
                const brand = p.brand as LeanBrand;
                return (
                  <div
                    key={String(p._id)}
                    className="border-b border-r border-[var(--line)] [&_a]:border-0 [&_a]:rounded-none"
                  >
                    <ProductCard
                      product={{
                        _id: String(p._id),
                        title: p.title,
                        slug: p.slug,
                        price: p.price,
                        mrp: p.mrp,
                        images: p.images,
                        ratingAvg: p.ratingAvg,
                        ratingCount: p.ratingCount,
                        brandName: brand?.name || null,
                        onSale: p.onSale,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </Reveal>
          {featured.length === 0 && (
            <p className="text-center text-[var(--fg-muted)]">
              Products will appear here once the catalog is connected.
            </p>
          )}
        </div>
      </section>

      <section className="border-b border-[var(--line)]">
        <div className="container-gb section-gb">
          <Reveal>
            <SectionHeader
              eyebrow={settings.homeBrandsEyebrow || "Trusted names"}
              title={settings.homeBrandsTitle || "Brands we stock"}
            />
          </Reveal>
          <Reveal delay={0.05}>
            <BrandLogoGrid brands={brands} />
          </Reveal>
        </div>
      </section>

      {posts.length > 0 && (
        <section>
          <div className="container-gb section-gb">
            <Reveal>
              <SectionHeader
                eyebrow={settings.homeBlogEyebrow || "Learn"}
                title={settings.homeBlogTitle || "From the blog"}
                href="/blog"
              />
            </Reveal>
            <div className="grid border-l border-t border-[var(--line)] md:grid-cols-2">
              {posts.map((post, i) => (
                <Reveal key={String(post._id)} delay={i * 0.06}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group block overflow-hidden border-b border-r border-[var(--line)] bg-[var(--bg-elevated)] transition hover:bg-[var(--bg-soft)]"
                  >
                    {post.coverImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.coverImage}
                        alt=""
                        className="aspect-[16/9] w-full border-b border-[var(--line)] object-cover transition duration-700 group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                    )}
                    <div className="p-5">
                      <h3 className="display text-xl sm:text-2xl">{post.title}</h3>
                      <p className="mt-2 text-sm text-[var(--fg-muted)] sm:text-base">
                        {post.excerpt}
                      </p>
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
