import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { Brand } from "@/models/Brand";
import { BlogPost } from "@/models/BlogPost";
import { getSiteSettings } from "@/models/SiteSettings";
import { ProductCard } from "@/components/product/ProductCard";

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
      <section className="relative min-h-[100svh] overflow-hidden md:min-h-[88vh]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={settings.heroImage}
          alt=""
          className="animate-hero-zoom absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/65 to-black/25 md:bg-gradient-to-r md:from-black/85 md:via-black/55 md:to-black/20" />
        <div className="container-gb relative flex min-h-[100svh] flex-col justify-end pb-24 pt-24 md:min-h-[88vh] md:justify-center md:pb-0">
          <p className="animate-fade-up font-[family-name:var(--font-display)] text-[clamp(2.75rem,12vw,7.5rem)] leading-[0.95] tracking-wide text-white">
            Gaanbajana
          </p>
          <h1 className="animate-fade-up-delay mt-4 max-w-xl text-lg text-[var(--fg)] sm:text-xl md:text-2xl">
            {settings.heroHeadline}
          </h1>
          <p className="animate-fade-up-delay mt-3 max-w-lg text-sm text-[var(--fg-muted)] sm:text-base">
            {settings.heroSubheadline}
          </p>
          <div className="animate-fade-up-delay mt-7 flex flex-wrap gap-3">
            <Link href={settings.heroCtaHref} className="btn btn-primary">
              {settings.heroCtaLabel}
            </Link>
            <Link href="/deals" className="btn btn-ghost">
              View deals
            </Link>
          </div>
        </div>
      </section>

      <section className="container-gb py-12 sm:py-16">
        <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--fg-muted)] sm:text-sm">
              Explore
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl md:text-4xl">
              Shop by category
            </h2>
          </div>
        </div>
        <div className="scroll-row md:grid md:grid-cols-4 md:gap-4 md:overflow-visible">
          {parents.slice(0, 8).map((c) => (
            <Link
              key={String(c._id)}
              href={`/collections/${c.slug}`}
              className="group relative aspect-[4/3] w-[72vw] max-w-[280px] overflow-hidden rounded-2xl border border-[var(--line)] md:w-auto md:max-w-none"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  c.image ||
                  "https://images.unsplash.com/photo-1510915361894-db8b50135cf0?auto=format&fit=crop&w=800&q=80"
                }
                alt={c.name}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <span className="absolute bottom-3 left-3 font-[family-name:var(--font-display)] text-lg sm:bottom-4 sm:left-4 sm:text-xl">
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[color-mix(in_oklab,var(--bg-elevated)_85%,transparent)] py-12 backdrop-blur-sm sm:py-16">
        <div className="container-gb">
          <div className="mb-6 flex items-end justify-between gap-3 sm:mb-8">
            <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl md:text-4xl">
              Bestsellers
            </h2>
            <Link href="/collections/guitars" className="shrink-0 text-sm text-[var(--accent)]">
              View all
            </Link>
          </div>
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
        </div>
      </section>

      <section className="container-gb py-12 sm:py-16">
        <h2 className="mb-6 font-[family-name:var(--font-display)] text-2xl sm:mb-8 sm:text-3xl">
          Brands we stock
        </h2>
        <div className="scroll-row md:flex md:flex-wrap md:overflow-visible">
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
      </section>

      {posts.length > 0 && (
        <section className="border-t border-[var(--line)] py-12 sm:py-16">
          <div className="container-gb">
            <div className="mb-6 flex items-end justify-between sm:mb-8">
              <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl">
                From the blog
              </h2>
              <Link href="/blog" className="text-sm text-[var(--accent)]">
                All posts
              </Link>
            </div>
            <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
              {posts.map((post) => (
                <Link
                  key={String(post._id)}
                  href={`/blog/${post.slug}`}
                  className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] transition hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--accent)_40%,transparent)]"
                >
                  {post.coverImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.coverImage}
                      alt=""
                      className="aspect-[16/9] w-full object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="p-4 sm:p-5">
                    <h3 className="font-[family-name:var(--font-display)] text-xl sm:text-2xl">
                      {post.title}
                    </h3>
                    <p className="mt-2 text-sm text-[var(--fg-muted)] sm:text-base">
                      {post.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
