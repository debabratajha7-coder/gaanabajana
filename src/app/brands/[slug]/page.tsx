import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Brand } from "@/models/Brand";
import { Product } from "@/models/Product";
import { ProductCard } from "@/components/product/ProductCard";

export const dynamic = "force-dynamic";

export default async function BrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await connectDB();
  const brand = await Brand.findOne({ slug, isActive: true }).lean();
  if (!brand) notFound();
  const products = await Product.find({ brand: brand._id, isActive: true })
    .populate("brand", "name")
    .lean();

  return (
    <div className="container-gb py-12">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">{brand.name}</h1>
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
              brand: { name: brand.name },
              ratingAvg: p.ratingAvg,
              ratingCount: p.ratingCount,
            }}
          />
        ))}
      </div>
    </div>
  );
}
