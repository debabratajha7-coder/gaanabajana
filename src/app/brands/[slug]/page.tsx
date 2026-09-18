import { connectDB, isTransientDbError, resetDBCache } from "@/lib/db";
import { Brand } from "@/models/Brand";
import { Product } from "@/models/Product";
import { ProductCard } from "@/components/product/ProductCard";
import { mapColorOptions } from "@/lib/product-card";
import { ComingSoonEmpty } from "@/components/ui/ComingSoonEmpty";
import { AutoRetry, ClearAutoRetry } from "@/components/ui/AutoRetry";

export const dynamic = "force-dynamic";

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

async function loadBrand(slug: string) {
  await connectDB();
  const brand = await Brand.findOne({ slug, isActive: true }).lean();
  const products = brand
    ? await Product.find({ brand: brand._id, isActive: true })
        .populate("brand", "name")
        .lean()
    : [];
  return { brand, products };
}

export default async function BrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let data: Awaited<ReturnType<typeof loadBrand>>;
  try {
    data = await loadBrand(slug);
  } catch (err) {
    if (isTransientDbError(err)) {
      try {
        resetDBCache();
        data = await loadBrand(slug);
      } catch (retryErr) {
        console.error("brand page transient failure", slug, retryErr);
        return (
          <AutoRetry
            title="Taking a moment…"
            message="We’re loading this brand. Retrying automatically."
            storageKey={`brand:${slug}`}
          />
        );
      }
    } else {
      console.error("brand page failure", slug, err);
      return (
        <AutoRetry
          title="Taking a moment…"
          message="We’re loading this brand. Retrying automatically."
          storageKey={`brand:${slug}`}
        />
      );
    }
  }

  const { brand, products } = data;
  const name = brand?.name || titleFromSlug(slug);

  return (
    <div className="container-gb py-12">
      <ClearAutoRetry storageKey={`brand:${slug}`} />
      <h1 className="font-[family-name:var(--font-display)] text-4xl">{name}</h1>
      {products.length === 0 ? (
        <ComingSoonEmpty title="Products coming soon" categoryName={name} />
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
                brandName: name,
                ratingAvg: p.ratingAvg,
                ratingCount: p.ratingCount,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
