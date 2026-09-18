import { connectDB, isTransientDbError, resetDBCache } from "@/lib/db";
import { Product } from "@/models/Product";

async function findActiveBySlug(slug: string) {
  return Product.findOne({ slug, isActive: true })
    .populate("brand", "name slug")
    .populate("categories", "name slug parent")
    .lean();
}

/**
 * Load a storefront product by slug.
 * Retries once after clearing the DB cache on transient Mongo errors.
 */
export async function getProductBySlug(slug: string) {
  await connectDB();
  try {
    return await findActiveBySlug(slug);
  } catch (err) {
    if (!isTransientDbError(err)) throw err;
    console.error("product lookup transient failure, retrying", slug, err);
    resetDBCache();
    await connectDB();
    return findActiveBySlug(slug);
  }
}
