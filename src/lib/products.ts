import { withDbRetry } from "@/lib/db";
import { Product } from "@/models/Product";
import { withUsableProductImages } from "@/lib/product-media";

/**
 * Load a storefront product by slug (connect + retries for Atlas wakeups).
 */
export async function getProductBySlug(slug: string) {
  return withDbRetry(`product:${slug}`, async () => {
    const product = await Product.findOne({
      slug,
      isActive: true,
    })
      .populate("brand", "name slug")
      .populate("categories", "name slug parent")
      .lean();
    if (!product) return null;
    return withUsableProductImages(product);
  });
}
