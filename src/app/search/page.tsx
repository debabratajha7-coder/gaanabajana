import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { ProductCard } from "@/components/product/ProductCard";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  await connectDB();
  let products: Awaited<ReturnType<typeof Product.find>> = [];
  if (q) {
    products = await Product.find({
      isActive: true,
      $or: [
        { title: { $regex: q, $options: "i" } },
        { tags: { $regex: q, $options: "i" } },
      ],
    })
      .populate("brand", "name")
      .limit(48)
      .lean();
  }

  return (
    <div className="container-gb py-12">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">
        Search{q ? `: ${q}` : ""}
      </h1>
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
              ratingAvg: p.ratingAvg,
              ratingCount: p.ratingCount,
            }}
          />
        ))}
      </div>
      {q && products.length === 0 && (
        <p className="mt-6 text-[var(--fg-muted)]">No results found.</p>
      )}
    </div>
  );
}
