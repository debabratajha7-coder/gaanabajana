import { withDbRetry } from "@/lib/db";
import { Product } from "@/models/Product";
import {
  productHasStorefrontImage,
  storefrontImageFilter,
  withUsableProductImages,
} from "@/lib/product-media";

/**
 * Load a storefront product by slug (connect + retries for Atlas wakeups).
 * Products without usable images are treated as unavailable.
 */
export async function getProductBySlug(slug: string) {
  return withDbRetry(`product:${slug}`, async () => {
    const product = await Product.findOne({
      slug,
      isActive: true,
      ...storefrontImageFilter(),
    })
      .populate("brand", "name slug")
      .populate("categories", "name slug parent")
      .lean();
    if (!product || !productHasStorefrontImage(product)) return null;
    return withUsableProductImages(product);
  });
}
