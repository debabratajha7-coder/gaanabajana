import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { ProductCard } from "@/components/product/ProductCard";

export const dynamic = "force-dynamic";

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    await connectDB();
  } catch {
    return (
      <div className="container-gb py-16 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          Catalog temporarily unavailable
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-[var(--fg-muted)]">
          The database is not connected on this host yet. Add{" "}
          <code className="text-[var(--accent)]">MONGODB_URI</code> in Vercel
          env vars, allow Atlas access from anywhere (<code>0.0.0.0/0</code>),
          redeploy, then run <code>npm run seed</code> against that database.
        </p>
        <Link href="/api/health" className="btn btn-ghost mt-6">
          Check health
        </Link>
      </div>
    );
  }

  const category = await Category.findOne({ slug, isActive: true }).lean();
  if (!category) {
    return (
      <div className="container-gb py-16 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          Collection not found
        </h1>
        <p className="mt-3 text-[var(--fg-muted)]">
          No category named “{slug}”. Seed the database or create it in admin.
        </p>
        <Link href="/" className="btn btn-primary mt-6">
          Home
        </Link>
      </div>
    );
  }

  const children = await Category.find({ parent: category._id, isActive: true }).lean();
  const ids = [category._id, ...children.map((c) => c._id)];

  const products = await Product.find({
    isActive: true,
    categories: { $in: ids },
  })
    .populate("brand", "name")
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="container-gb py-10">
      <p className="text-sm uppercase tracking-[0.18em] text-[var(--fg-muted)]">
        Collection
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl md:text-5xl">
        {category.name}
      </h1>
      {category.description && (
        <p className="mt-3 max-w-2xl text-[var(--fg-muted)]">{category.description}</p>
      )}

      {children.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {children.map((c) => (
            <a
              key={String(c._id)}
              href={`/collections/${c.slug}`}
              className="rounded-full border border-[var(--line)] px-3 py-1.5 text-sm text-[var(--fg-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              {c.name}
            </a>
          ))}
        </div>
      )}

      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
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
            }}
          />
        ))}
      </div>
      {products.length === 0 && (
        <p className="mt-10 text-[var(--fg-muted)]">No products in this collection yet.</p>
      )}
    </div>
  );
}
