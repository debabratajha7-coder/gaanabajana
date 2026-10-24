import Link from "next/link";
import { withDbRetry } from "@/lib/db";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { ProductCard } from "@/components/product/ProductCard";
import { mapColorOptions } from "@/lib/product-card";
import { ComingSoonEmpty } from "@/components/ui/ComingSoonEmpty";
import { AutoRetry, ClearAutoRetry } from "@/components/ui/AutoRetry";
import { resolveCatalogCategoryIds } from "@/lib/catalog-scope";

/** Cache HTML briefly so most visits skip a cold Mongo hit. */
export const revalidate = 60;

async function loadCollection(slug: string) {
  return withDbRetry(`collection:${slug}`, async () => {
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
  });
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
    console.error("collection page failure", slug, err);
    return (
      <AutoRetry
        title="Taking a moment…"
        message="We’re loading this collection. Retrying automatically."
        storageKey={`collection:${slug}`}
      />
    );
  }

  const { category, children, products } = data;

  if (!category) {
    return (
      <div className="container-gb py-10 sm:py-12">
        <p className="eyebrow">Collection</p>
        <h1 className="display mt-2 text-3xl sm:text-4xl">Coming soon</h1>
        <ComingSoonEmpty categoryName={slug.replace(/-/g, " ")} />
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
            <Link
              key={String(c._id)}
              href={`/collections/${c.slug}`}
              className="rounded-full border border-[var(--line)] px-3 py-1.5 text-sm hover:border-[var(--line-strong)]"
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <ComingSoonEmpty categoryName={category.name} />
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
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
                brandName:
                  (p.brand as { name?: string } | null | undefined)?.name ||
                  null,
                ratingAvg: p.ratingAvg,
                ratingCount: p.ratingCount,
                onSale: p.onSale,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
