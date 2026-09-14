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
      <section className="relative min-h-[88vh] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={settings.heroImage}
          alt=""
          className="animate-hero-zoom absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/25" />
        <div className="container-gb relative flex min-h-[88vh] flex-col justify-end pb-16 pt-28 md:justify-center md:pb-0">
          <p className="animate-fade-up font-[family-name:var(--font-display)] text-5xl tracking-wide text-white md:text-7xl lg:text-8xl">
            Gaanbajana
          </p>
          <h1 className="animate-fade-up-delay mt-4 max-w-xl text-xl text-[var(--fg)] md:text-2xl">
            {settings.heroHeadline}
          </h1>
          <p className="animate-fade-up-delay mt-3 max-w-lg text-[var(--fg-muted)]">
            {settings.heroSubheadline}
          </p>
          <div className="animate-fade-up-delay mt-8">
            <Link href={settings.heroCtaHref} className="btn btn-primary">
              {settings.heroCtaLabel}
            </Link>
          </div>
        </div>
      </section>

      <section className="container-gb py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--fg-muted)]">
              Explore
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl">
              Shop by category
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {parents.slice(0, 8).map((c) => (
            <Link
              key={String(c._id)}
              href={`/collections/${c.slug}`}
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-[var(--line)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  c.image ||
                  "https://images.unsplash.com/photo-1510915361894-db8b50135cf0?auto=format&fit=crop&w=800&q=80"
                }
                alt={c.name}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <span className="absolute bottom-4 left-4 font-[family-name:var(--font-display)] text-xl">
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-[var(--bg-elevated)] py-16">
        <div className="container-gb">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl">
              Bestsellers
            </h2>
            <Link href="/collections/guitars" className="text-[var(--accent)]">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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

      <section className="container-gb py-16">
        <h2 className="mb-8 font-[family-name:var(--font-display)] text-3xl">
          Brands we stock
        </h2>
        <div className="flex flex-wrap gap-3">
          {brands.map((b) => (
            <Link
              key={String(b._id)}
              href={`/brands/${b.slug}`}
              className="rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--fg-muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              {b.name}
            </Link>
          ))}
        </div>
      </section>

      {posts.length > 0 && (
        <section className="border-t border-[var(--line)] py-16">
          <div className="container-gb">
            <div className="mb-8 flex items-end justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-3xl">
                From the blog
              </h2>
              <Link href="/blog" className="text-[var(--accent)]">
                All posts
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {posts.map((post) => (
                <Link
                  key={String(post._id)}
                  href={`/blog/${post.slug}`}
                  className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]"
                >
                  {post.coverImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.coverImage}
                      alt=""
                      className="aspect-[16/9] w-full object-cover"
                    />
                  )}
                  <div className="p-5">
                    <h3 className="font-[family-name:var(--font-display)] text-2xl">
                      {post.title}
                    </h3>
                    <p className="mt-2 text-[var(--fg-muted)]">{post.excerpt}</p>
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
