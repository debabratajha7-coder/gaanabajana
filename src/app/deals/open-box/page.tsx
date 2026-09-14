import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { ProductCard } from "@/components/product/ProductCard";

export const dynamic = "force-dynamic";

export default async function OpenBoxPage() {
  await connectDB();
  const products = await Product.find({ isActive: true, openBox: true })
    .populate("brand", "name")
    .lean();
  return (
    <div className="container-gb py-12">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">Open box gear</h1>
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
              brand: p.brand as { name?: string },
            }}
          />
        ))}
      </div>
    </div>
  );
}
