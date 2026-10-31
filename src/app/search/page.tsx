import Link from "next/link";
import { withDbRetry } from "@/lib/db";
import { Product } from "@/models/Product";
import { ProductCard } from "@/components/product/ProductCard";
import { mapColorOptions } from "@/lib/product-card";
import {
  ClearSoftReload,
  SoftReloadSkeleton,
} from "@/components/ui/SoftReloadSkeleton";
import { storefrontImageFilter } from "@/lib/product-media";

export const revalidate = 30;

async function searchProducts(q: string) {
  return withDbRetry(`search:${q}`, () =>
    Product.find({
      isActive: true,
      ...storefrontImageFilter(),
      $or: [
        { title: { $regex: q, $options: "i" } },
        { tags: { $regex: q, $options: "i" } },
      ],
    })
      .populate("brand", "name")
      .limit(48)
      .lean()
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  let products: Awaited<ReturnType<typeof searchProducts>> = [];
  let dbFailed = false;

  if (q) {
    try {
      products = await searchProducts(q);
    } catch (err) {
      console.error("search page failure", err);
      dbFailed = true;
    }
  }

  if (dbFailed) {
    return (
      <SoftReloadSkeleton
        variant="grid"
        storageKey={`search:${q || ""}`}
      />
    );
  }

  return (
    <div className="container-gb py-12">
      <ClearSoftReload storageKey={`search:${q || ""}`} />
      <p className="eyebrow">Find gear</p>
      <h1 className="display mt-2 text-3xl sm:text-4xl">
        {q ? `Results for “${q}”` : "Search"}
      </h1>

      <form action="/search" className="mt-6 max-w-xl">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search instruments"
          className="input"
        />
      </form>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
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
                p.brand && typeof p.brand === "object" && "name" in p.brand
                  ? String((p.brand as { name?: string }).name || "")
                  : null,
              ratingAvg: p.ratingAvg,
              ratingCount: p.ratingCount,
            }}
          />
        ))}
      </div>

      {q && products.length === 0 && (
        <div className="mt-10 text-center">
          <p className="text-[var(--fg-muted)]">No results. Try another word.</p>
          <Link href="/collections/guitars" className="btn btn-primary mt-6">
            Browse guitars
          </Link>
        </div>
      )}

      {!q && (
        <p className="mt-8 text-[var(--fg-muted)]">
          Type a product name above, or{" "}
          <Link href="/collections/guitars" className="text-[var(--accent)]">
            browse categories
          </Link>
          .
        </p>
      )}
    </div>
  );
}
