import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { ProductCard } from "@/components/product/ProductCard";

export const dynamic = "force-dynamic";

async function loadSaleProducts(filter: Record<string, unknown>) {
  try {
    await connectDB();
    return await Product.find({ isActive: true, ...filter })
      .populate("brand", "name")
      .limit(48)
      .lean();
  } catch {
    return null;
  }
}

function DbDown() {
  return (
    <div className="container-gb py-16 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-3xl">
        Catalog temporarily unavailable
      </h1>
      <p className="mt-3 text-[var(--fg-muted)]">
        Database not connected. See{" "}
        <Link href="/api/health" className="text-[var(--accent)]">
          /api/health
        </Link>
        .
      </p>
    </div>
  );
}

export default async function DealsPage() {
  const products = await loadSaleProducts({ onSale: true });
  if (!products) return <DbDown />;

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
              brandName:
              p.brand && typeof p.brand === "object" && "name" in p.brand
                ? String((p.brand as { name?: string }).name || "")
                : null,
              onSale: true,
            }}
          />
        ))}
      </div>
    </div>
  );
}
