import { ProductCard } from "@/components/product/ProductCard";
import { connectDB } from "@/lib/db";
import { resolveProductEssentials } from "@/lib/product-essentials";
import { toPlain } from "@/lib/utils";
import { Review } from "@/models/Review";
import { Product } from "@/models/Product";
import type { Types } from "mongoose";

export async function ProductSecondary({
  productId,
}: {
  productId: string;
}) {
  try {
    await connectDB();
  } catch {
    return null;
  }

  let product: {
    _id: Types.ObjectId;
    brand?: Types.ObjectId | { _id?: Types.ObjectId } | null;
    essentials?: unknown[];
  } | null = null;

  try {
    product = await Product.findById(productId)
      .select("_id brand essentials")
      .lean();
  } catch {
    return null;
  }
  if (!product) return null;

  let essentials: Awaited<ReturnType<typeof resolveProductEssentials>> = [];
  let reviews: Array<{
    rating: number;
    title?: string;
    body: string;
    authorName?: string;
    user?: { name?: string } | null;
  }> = [];

  try {
    const [essentialDocs, reviewDocs] = await Promise.all([
      resolveProductEssentials(
        product as {
          _id: Types.ObjectId;
          brand?: Types.ObjectId | { _id?: Types.ObjectId } | null;
          essentials?: (Types.ObjectId | { _id?: Types.ObjectId } | string)[];
        },
        4
      ).catch(() => []),
      Review.find({ product: product._id, approved: true })
        .populate("user", "name")
        .sort({ createdAt: -1 })
        .limit(20)
        .lean()
        .catch(() => []),
    ]);
    essentials = essentialDocs;
    reviews = reviewDocs as typeof reviews;
  } catch {
    /* keep empty */
  }

  const plainEssentials = toPlain(essentials) || [];
  const plainReviews =
    toPlain(
      reviews.map((r) => {
        const user = r.user as { name?: string } | null;
        return {
          rating: r.rating,
          title: r.title,
          body: r.body,
          user: { name: r.authorName || user?.name || "Customer" },
        };
      })
    ) || [];

  return (
    <div className="fade-in-soft">
      {plainEssentials.length > 0 && (
        <section
          className="container-gb border-t py-10 sm:py-12"
          style={{ borderColor: "var(--pdp-border)" }}
        >
          <h2
            className="text-xl font-semibold sm:text-2xl"
            style={{ color: "var(--pdp-fg)" }}
          >
            Essentials
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--pdp-muted)" }}>
            Pair it with the gear most shoppers add next
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {plainEssentials.map((p) => (
              <ProductCard key={p._id} product={p} appearance="pdp" />
            ))}
          </div>
        </section>
      )}

      <div
        className="container-gb space-y-6 border-t py-10 sm:py-12"
        style={{ borderColor: "var(--pdp-border)" }}
      >
        <h2
          className="text-lg font-semibold sm:text-xl"
          style={{ color: "var(--pdp-fg)" }}
        >
          Reviews
        </h2>
        <div className="max-w-2xl space-y-3">
          {plainReviews.length === 0 && (
            <p className="text-sm" style={{ color: "var(--pdp-muted)" }}>
              No reviews yet.
            </p>
          )}
          {plainReviews.map((r, i) => (
            <div key={i} className="glass-panel p-4">
              <p className="text-sm text-[var(--accent)]">
                ★ {r.rating} · {r.user?.name || "Customer"}
              </p>
              {r.title && (
                <p
                  className="mt-1 font-medium"
                  style={{ color: "var(--pdp-fg)" }}
                >
                  {r.title}
                </p>
              )}
              <p className="mt-1 text-sm" style={{ color: "var(--pdp-muted)" }}>
                {r.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
