export type ProductColorOptionData = {
  name: string;
  swatch: string;
  images: string[];
};

export type ProductCardData = {
  _id: string;
  title: string;
  slug: string;
  price: number;
  mrp: number;
  images?: string[];
  colorOptions?: ProductColorOptionData[];
  ratingAvg?: number;
  ratingCount?: number;
  brandName?: string | null;
  onSale?: boolean;
};

/** Safe to call from Server Components */
export function mapColorOptions(
  raw?: { name?: string; swatch?: string; images?: string[] }[] | null
): ProductColorOptionData[] {
  return (raw || [])
    .filter((c) => c?.name)
    .map((c) => ({
      name: String(c.name),
      swatch: c.swatch || "#888888",
      images: (c.images || []).filter(Boolean),
    }));
}
