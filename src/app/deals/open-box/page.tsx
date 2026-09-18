import { loadProducts } from "@/lib/catalog-query";
import { ProductCard } from "@/components/product/ProductCard";
import { mapColorOptions } from "@/lib/product-card";
import { ComingSoonEmpty } from "@/components/ui/ComingSoonEmpty";
import { AutoRetry, ClearAutoRetry } from "@/components/ui/AutoRetry";

export const dynamic = "force-dynamic";

export default async function OpenBoxPage() {
  let products;
  try {
    products = await loadProducts({ openBox: true }, 96);
  } catch (err) {
    console.error("open-box page failure", err);
    return (
      <AutoRetry
        title="Taking a moment…"
        message="We’re loading open-box gear. Retrying automatically."
        storageKey="deals-open-box"
      />
    );
  }

  return (
    <div className="container-gb py-12">
      <ClearAutoRetry storageKey="deals-open-box" />
      <h1 className="font-[family-name:var(--font-display)] text-4xl">
        Open box gear
      </h1>
      {products.length === 0 ? (
        <ComingSoonEmpty categoryName="Open box" />
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
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
