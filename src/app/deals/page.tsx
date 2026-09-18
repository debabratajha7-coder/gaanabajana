import Link from "next/link";
import { loadProducts } from "@/lib/catalog-query";
import { ProductCard } from "@/components/product/ProductCard";
import { mapColorOptions } from "@/lib/product-card";
import { ComingSoonEmpty } from "@/components/ui/ComingSoonEmpty";
import { AutoRetry, ClearAutoRetry } from "@/components/ui/AutoRetry";

export const dynamic = "force-dynamic";

export default async function DealsPage() {
  let products;
  try {
    products = await loadProducts({ onSale: true });
  } catch (err) {
    console.error("deals page failure", err);
    return (
      <AutoRetry
        title="Taking a moment…"
        message="We’re loading deals. Retrying automatically."
        storageKey="deals"
      />
    );
  }

  return (
    <div className="container-gb py-12">
      <ClearAutoRetry storageKey="deals" />
      <h1 className="font-[family-name:var(--font-display)] text-4xl">Deals</h1>
      <div className="mt-4 flex gap-3 text-sm">
        <Link href="/deals/sale" className="text-[var(--accent)]">
          Sale
        </Link>
        <Link href="/deals/open-box" className="text-[var(--accent)]">
          Open box
        </Link>
      </div>
      {products.length === 0 ? (
        <ComingSoonEmpty categoryName="Deals" />
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
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
                onSale: true,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
