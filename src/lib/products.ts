import { withDbRetry } from "@/lib/db";
import { Product } from "@/models/Product";

/**
 * Load a storefront product by slug (connect + retries for Atlas wakeups).
 */
export async function getProductBySlug(slug: string) {
  return withDbRetry(`product:${slug}`, () =>
    Product.findOne({ slug, isActive: true })
      .populate("brand", "name slug")
      .populate("categories", "name slug parent")
      .lean()
  );
}
