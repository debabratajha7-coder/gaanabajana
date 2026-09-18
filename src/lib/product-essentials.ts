import { Types } from "mongoose";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { mapColorOptions, type ProductCardData } from "@/lib/product-card";

const ACCESSORY_RE =
  /accessor|string|cable|pedal|tuner|strap|bag|case|capo|pick|stand|cable|amp|headphone/i;

const ESSENTIAL_TAGS = ["essential", "essentials", "accessory", "accessories"];

function toCard(
  p: {
    _id: Types.ObjectId | string;
    title: string;
    slug: string;
    price: number;
    mrp: number;
    images?: string[];
    colorOptions?: { name?: string; swatch?: string; images?: string[] }[];
    ratingAvg?: number;
    ratingCount?: number;
    onSale?: boolean;
    brand?: { name?: string } | null;
  }
): ProductCardData {
  return {
    _id: String(p._id),
    title: p.title,
    slug: p.slug,
    price: p.price,
    mrp: p.mrp,
    images: p.images || [],
    colorOptions: mapColorOptions(p.colorOptions),
    ratingAvg: p.ratingAvg,
    ratingCount: p.ratingCount,
    onSale: p.onSale,
    brandName: p.brand?.name || null,
  };
}

/**
 * Curated essentials first (admin picks), then auto-fill from
 * accessory categories / tags, then same brand.
 */
export async function resolveProductEssentials(
  product: {
    _id: Types.ObjectId | string;
    brand?: Types.ObjectId | { _id?: Types.ObjectId } | null;
    categories?: (Types.ObjectId | string)[];
    essentials?: (Types.ObjectId | { _id?: Types.ObjectId } | string)[];
  },
  limit = 4
): Promise<ProductCardData[]> {
  const selfId = String(product._id);
  const curatedIds = (product.essentials || [])
    .map((e) => {
      if (typeof e === "string") return e;
      if (e && typeof e === "object" && "_id" in e && e._id) return String(e._id);
      return String(e);
    })
    .filter((id) => id && id !== selfId);

  const ordered: ProductCardData[] = [];
  const seen = new Set<string>([selfId]);

  if (curatedIds.length) {
    const curated = await Product.find({
      _id: { $in: curatedIds },
      isActive: true,
    })
      .populate("brand", "name")
      .lean();
    const byId = new Map(curated.map((p) => [String(p._id), p]));
    for (const id of curatedIds) {
      const p = byId.get(id);
      if (!p || seen.has(id)) continue;
      seen.add(id);
      ordered.push(
        toCard({
          ...p,
          brand: p.brand as { name?: string } | null,
        })
      );
      if (ordered.length >= limit) return ordered;
    }
  }

  const need = limit - ordered.length;
  if (need <= 0) return ordered;

  const brandId =
    product.brand && typeof product.brand === "object" && "_id" in product.brand
      ? product.brand._id
      : product.brand;

  const accessoryCats = await Category.find({
    $or: [{ name: ACCESSORY_RE }, { slug: ACCESSORY_RE }],
    isActive: true,
  })
    .select("_id")
    .lean();
  const accessoryCatIds = accessoryCats.map((c) => c._id);

  const excludeIds = [...seen].map((id) => new Types.ObjectId(id));

  const candidates = await Product.find({
    _id: { $nin: excludeIds },
    isActive: true,
    $or: [
      { tags: { $in: ESSENTIAL_TAGS } },
      ...(accessoryCatIds.length
        ? [{ categories: { $in: accessoryCatIds } }]
        : []),
      ...(brandId ? [{ brand: brandId }] : []),
    ],
  } as Record<string, unknown>)
    .populate("brand", "name")
    .sort({ featured: -1, updatedAt: -1 })
    .limit(24)
    .lean();

  const score = (p: (typeof candidates)[number]) => {
    let s = 0;
    const tags = ((p.tags || []) as string[]).map((t: string) =>
      String(t).toLowerCase()
    );
    if (tags.some((t: string) => ESSENTIAL_TAGS.includes(t))) s += 4;
    const cats = ((p.categories || []) as unknown[]).map(String);
    if (cats.some((c: string) => accessoryCatIds.some((a) => String(a) === c)))
      s += 3;
    if (brandId && String(p.brand?._id || p.brand) === String(brandId)) s += 1;
    return s;
  };

  candidates.sort((a, b) => score(b) - score(a));

  for (const p of candidates) {
    const id = String(p._id);
    if (seen.has(id)) continue;
    seen.add(id);
    ordered.push(
      toCard({
        ...p,
        brand: p.brand as { name?: string } | null,
      })
    );
    if (ordered.length >= limit) break;
  }

  if (ordered.length < limit) {
    const more = await Product.find({
      _id: { $nin: [...seen].map((id) => new Types.ObjectId(id)) },
      isActive: true,
    } as Record<string, unknown>)
      .populate("brand", "name")
      .sort({ featured: -1, updatedAt: -1 })
      .limit(limit - ordered.length)
      .lean();
    for (const p of more) {
      ordered.push(
        toCard({
          ...p,
          brand: p.brand as { name?: string } | null,
        })
      );
    }
  }

  return ordered;
}
