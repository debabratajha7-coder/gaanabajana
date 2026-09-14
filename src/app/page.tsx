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
import { brandLogo, categoryImage } from "@/lib/catalog-media";

export const dynamic = "force-dynamic";

type LeanBrand = { name?: string; slug?: string } | null;

export default async function HomePage() {
  let settings;
  let featured: Awaited<ReturnType<typeof Product.find>> = [];
  let parents: Awaited<ReturnType<typeof Category.find>> = [];
  let brands: Awaited<ReturnType<typeof Brand.find>> = [];
  let posts: Awaited<ReturnType<typeof BlogPost.find>> = [];

  try {
    await connectDB();
    settings = await getSiteSettings();
    [featured, parents, brands, posts] = await Promise.all([
      Product.find({ isActive: true, featured: true })
        .populate("brand", "name slug")
        .limit(8)
        .lean(),
      Category.find({ isActive: true, parent: null }).sort({ sortOrder: 1 }).lean(),
      Brand.find({ isActive: true }).limit(10).lean(),
      BlogPost.find({ published: true }).sort({ publishedAt: -1 }).limit(2).lean(),
    ]);
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
    };
  }

  return (
    <>
      <section className="relative min-h-[100svh] overflow-hidden md:min-h-[92vh]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={settings.heroImage}
          alt=""
          className="animate-hero-zoom absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-black/55 to-black/25 md:bg-gradient-to-r md:from-[var(--bg)] md:via-black/60 md:to-transparent" />
        <div className="container-gb relative flex min-h-[100svh] flex-col justify-end pb-28 pt-28 md:min-h-[92vh] md:justify-center md:pb-10">
          <p className="animate-fade-up display text-[clamp(3rem,13vw,7.75rem)] tracking-[-0.03em] text-white">
            Gaanbajana
          </p>
          <h1 className="animate-fade-up-delay mt-5 max-w-xl text-lg text-[var(--fg)] sm:text-xl md:text-2xl">
            {settings.heroHeadline}
          </h1>
          <p className="animate-fade-up-delay-2 mt-3 max-w-md text-sm leading-relaxed text-[var(--fg-muted)] sm:text-base">
            {settings.heroSubheadline}
          </p>
          <div className="animate-fade-up-delay-2 mt-8 flex flex-wrap gap-3">
            <Link href={settings.heroCtaHref} className="btn btn-primary">
              {settings.heroCtaLabel}
            </Link>
            <Link href="/deals" className="btn btn-ghost">
              View deals
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--line)]">
        <div className="container-gb section-gb">
          <Reveal>
            <SectionHeader eyebrow="Explore" title="Shop by category" />
          </Reveal>
          <Reveal delay={0.05}>
            <div className="grid grid-cols-2 border-l border-t border-[var(--line)] md:grid-cols-4">
              {parents.slice(0, 8).map((c) => (
                <Link
                  key={String(c._id)}
                  href={`/collections/${c.slug}`}
                  className="group relative aspect-[4/3] overflow-hidden border-b border-r border-[var(--line)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={categoryImage(c.slug, c.image)}
                    alt={c.name}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/25 to-transparent" />
                  <span className="absolute bottom-3 left-3 display text-base sm:bottom-4 sm:left-4 sm:text-xl">
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
              eyebrow="Curated"
              title="Bestsellers"
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
            <SectionHeader eyebrow="Trusted names" title="Brands we stock" />
          </Reveal>
          <Reveal delay={0.05}>
            <div className="grid grid-cols-2 border-l border-t border-[var(--line)] sm:grid-cols-3 md:grid-cols-5">
              {brands.map((b) => {
                const slug = b.slug;
                const logo = brandLogo(slug);
                return (
                  <Link
                    key={String(b._id)}
                    href={`/brands/${slug}`}
                    className="flex aspect-[5/3] items-center justify-center border-b border-r border-[var(--line)] bg-[var(--bg-elevated)] px-4 transition hover:bg-[var(--bg-soft)]"
                    title={b.name}
                  >
                    {logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logo}
                        alt={b.name}
                        className="max-h-10 w-auto max-w-[70%] object-contain brightness-0 invert opacity-80 transition group-hover:opacity-100"
                        loading="lazy"
                      />
                    ) : (
                      <span className="display text-lg tracking-wide text-[var(--fg-muted)]">
                        {b.name}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>

      {posts.length > 0 && (
        <section>
          <div className="container-gb section-gb">
            <Reveal>
              <SectionHeader eyebrow="Learn" title="From the blog" href="/blog" />
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
