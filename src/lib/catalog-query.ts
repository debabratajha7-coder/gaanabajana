import { withDbRetry } from "@/lib/db";
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
  return withDbRetry("catalog:loadProducts", async () => {
    return (await Product.find({ isActive: true, ...filter })
      .populate("brand", "name")
      .limit(limit)
      .lean()) as CatalogProduct[];
  });
}
