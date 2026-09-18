import { connectDB, isTransientDbError, resetDBCache } from "@/lib/db";
import { Product } from "@/models/Product";

export type CatalogProduct = {
  _id: unknown;
  title: string;
  slug: string;
  price: number;
  mrp: number;
  images?: string[];
  colorOptions?: { name?: string; swatch?: string; images?: string[] }[];
  brand?: { name?: string } | null;
  ratingAvg?: number;
  ratingCount?: number;
  onSale?: boolean;
  openBox?: boolean;
};

export async function loadProducts(
  filter: Record<string, unknown>,
  limit = 48
): Promise<CatalogProduct[]> {
  const run = async () => {
    await connectDB();
    return (await Product.find({ isActive: true, ...filter })
      .populate("brand", "name")
      .limit(limit)
      .lean()) as CatalogProduct[];
  };

  try {
    return await run();
  } catch (err) {
    if (!isTransientDbError(err)) throw err;
    resetDBCache();
    return run();
  }
}
