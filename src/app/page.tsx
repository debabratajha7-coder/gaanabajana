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

export const dynamic = "force-dynamic";

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
        .populate("brand", "name")
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

      <section className="container-gb section-gb">
        <Reveal>
          <SectionHeader eyebrow="Explore" title="Shop by category" />
        </Reveal>
        <Reveal delay={0.05}>
          <div className="scroll-row md:grid md:grid-cols-4 md:gap-4 md:overflow-visible">
            {parents.slice(0, 8).map((c) => (
              <Link
                key={String(c._id)}
                href={`/collections/${c.slug}`}
                className="group relative aspect-[4/3] w-[70vw] max-w-[260px] overflow-hidden rounded-2xl border border-[var(--line)] md:w-auto md:max-w-none"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    c.image ||
                    "https://images.unsplash.com/photo-1510915361894-db8b50135cf0?auto=format&fit=crop&w=800&q=80"
                  }
                  alt={c.name}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                <span className="absolute bottom-3.5 left-3.5 display text-lg sm:text-xl">
                  {c.name}
                </span>
              </Link>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="border-y border-[var(--line)] bg-[color-mix(in_oklab,var(--bg-elevated)_80%,transparent)]">
        <div className="container-gb section-gb">
          <Reveal>
            <SectionHeader
              eyebrow="Curated"
              title="Bestsellers"
              href="/collections/guitars"
            />
          </Reveal>
          <Reveal delay={0.06}>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
              {featured.map((p) => (
                <ProductCard
                  key={String(p._id)}
                  product={{
                    _id: String(p._id),
                    title: p.title,
                    slug: p.slug,
                    price: p.price,
                    mrp: p.mrp,
                    images: p.images,
                    ratingAvg: p.ratingAvg,
                    ratingCount: p.ratingCount,
                    brand: p.brand as { name?: string },
                    onSale: p.onSale,
                  }}
                />
              ))}
            </div>
          </Reveal>
          {featured.length === 0 && (
            <p className="text-center text-[var(--fg-muted)]">
              Products will appear here once the catalog is connected.
            </p>
          )}
        </div>
      </section>

      <section className="container-gb section-gb">
        <Reveal>
          <SectionHeader eyebrow="Trusted names" title="Brands we stock" />
        </Reveal>
        <Reveal delay={0.05}>
          <div className="scroll-row md:flex md:flex-wrap md:gap-3 md:overflow-visible">
            {brands.map((b) => (
              <Link
                key={String(b._id)}
                href={`/brands/${b.slug}`}
                className="rounded-full border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-2.5 text-sm text-[var(--fg-muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                {b.name}
              </Link>
            ))}
          </div>
        </Reveal>
      </section>

      {posts.length > 0 && (
        <section className="border-t border-[var(--line)]">
          <div className="container-gb section-gb">
            <Reveal>
              <SectionHeader eyebrow="Learn" title="From the blog" href="/blog" />
            </Reveal>
            <div className="grid gap-5 md:grid-cols-2">
              {posts.map((post, i) => (
                <Reveal key={String(post._id)} delay={i * 0.06}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group block overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] transition hover:border-[color-mix(in_oklab,var(--accent)_35%,transparent)]"
                  >
                    {post.coverImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.coverImage}
                        alt=""
                        className="aspect-[16/9] w-full object-cover transition duration-700 group-hover:scale-[1.03]"
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
