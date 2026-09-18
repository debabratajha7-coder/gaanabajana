import { connectDB } from "@/lib/db";
import { Brand } from "@/models/Brand";
import { Product } from "@/models/Product";
import { ProductCard } from "@/components/product/ProductCard";
import { mapColorOptions } from "@/lib/product-card";
import { ComingSoonEmpty } from "@/components/ui/ComingSoonEmpty";

export const dynamic = "force-dynamic";

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default async function BrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await connectDB();
  const brand = await Brand.findOne({ slug, isActive: true }).lean();
  const name = brand?.name || titleFromSlug(slug);
  const products = brand
    ? await Product.find({ brand: brand._id, isActive: true })
        .populate("brand", "name")
        .lean()
    : [];

  return (
    <div className="container-gb py-12">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">{name}</h1>
      {products.length === 0 ? (
        <ComingSoonEmpty
          title="Products coming soon"
          categoryName={name}
        />
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
