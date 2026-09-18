import Link from "next/link";
import { connectDB, isTransientDbError, resetDBCache } from "@/lib/db";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { ProductCard } from "@/components/product/ProductCard";
import { mapColorOptions } from "@/lib/product-card";
import { ComingSoonEmpty } from "@/components/ui/ComingSoonEmpty";
import { AutoRetry, ClearAutoRetry } from "@/components/ui/AutoRetry";
import { resolveCatalogCategoryIds } from "@/lib/catalog-scope";

export const dynamic = "force-dynamic";

async function loadCollection(slug: string) {
  await connectDB();
  const category = await Category.findOne({ slug, isActive: true }).lean();
  if (!category) {
    return { category: null as null, children: [] as [], products: [] as [] };
  }

  const children = await Category.find({
    parent: category._id,
    isActive: true,
  }).lean();
  const ids = await resolveCatalogCategoryIds(category);
  const products = await Product.find({
    isActive: true,
    categories: { $in: ids },
  })
    .populate("brand", "name")
    .sort({ createdAt: -1 })
    .lean();

  return { category, children, products };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let data: Awaited<ReturnType<typeof loadCollection>>;
  try {
    data = await loadCollection(slug);
  } catch (err) {
    if (isTransientDbError(err)) {
      try {
        resetDBCache();
        data = await loadCollection(slug);
      } catch (retryErr) {
        console.error("collection page transient failure", slug, retryErr);
        return (
          <AutoRetry
            title="Taking a moment…"
            message="We’re loading this collection. Retrying automatically."
            storageKey={`collection:${slug}`}
          />
        );
      }
    } else {
      console.error("collection page failure", slug, err);
      return (
        <AutoRetry
          title="Taking a moment…"
          message="We’re loading this collection. Retrying automatically."
          storageKey={`collection:${slug}`}
        />
      );
    }
  }

  const { category, children, products } = data;

  if (!category) {
    return (
      <div className="container-gb py-16 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          Collection not found
        </h1>
        <p className="mt-3 text-[var(--fg-muted)]">
          No category named “{slug}”.
        </p>
        <Link href="/" className="btn btn-primary mt-6">
          Home
        </Link>
      </div>
    );
  }

  return (
    <div className="container-gb py-10 sm:py-12">
      <ClearAutoRetry storageKey={`collection:${slug}`} />
      <p className="eyebrow">Collection</p>
      <h1 className="display mt-2 text-3xl sm:text-4xl md:text-5xl">
        {category.name}
      </h1>
      {category.description && (
        <p className="mt-3 max-w-2xl text-sm text-[var(--fg-muted)] sm:text-base">
          {category.description}
        </p>
      )}

      {children.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {children.map((c) => (
            <a
              key={String(c._id)}
              href={`/collections/${c.slug}`}
              className="rounded-full border border-[var(--line)] px-3.5 py-1.5 text-sm text-[var(--fg-muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              {c.name}
            </a>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <ComingSoonEmpty categoryName={category.name} />
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
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
                colorOptions: mapColorOptions(
                  p.colorOptions as
                    | { name?: string; swatch?: string; images?: string[] }[]
                    | undefined
                ),
                ratingAvg: p.ratingAvg,
                ratingCount: p.ratingCount,
                brandName:
                  p.brand && typeof p.brand === "object" && "name" in p.brand
                    ? String((p.brand as { name?: string }).name || "")
                    : null,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
