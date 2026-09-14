import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { ProductCard } from "@/components/product/ProductCard";

export const dynamic = "force-dynamic";

export default async function DealsPage() {
  await connectDB();
  const products = await Product.find({ isActive: true, onSale: true })
    .populate("brand", "name")
    .limit(24)
    .lean();
  return (
    <div className="container-gb py-12">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">Deals</h1>
      <div className="mt-4 flex gap-3 text-sm">
        <Link href="/deals/sale" className="text-[var(--accent)]">
          Sale
        </Link>
        <Link href="/deals/open-box" className="text-[var(--accent)]">
          Open box
        </Link>
      </div>
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
              onSale: true,
            }}
          />
        ))}
      </div>
    </div>
  );
}
