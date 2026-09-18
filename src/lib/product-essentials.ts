import { Types } from "mongoose";
import { Product } from "@/models/Product";
import { mapColorOptions, type ProductCardData } from "@/lib/product-card";

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

function safeObjectIds(ids: string[]) {
  return ids
    .filter((id) => Types.ObjectId.isValid(id))
    .map((id) => new Types.ObjectId(id));
}

/**
 * Curated essentials first, then one lightweight auto-fill query
 * (same brand / accessory tags). Kept intentionally cheap for PDP.
 */
export async function resolveProductEssentials(
  product: {
    _id: Types.ObjectId | string;
    brand?: Types.ObjectId | { _id?: Types.ObjectId } | null;
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
    .filter((id) => id && id !== selfId && Types.ObjectId.isValid(id));

  const ordered: ProductCardData[] = [];
  const seen = new Set<string>([selfId]);

  if (curatedIds.length) {
    try {
      const curated = await Product.find({
        _id: { $in: safeObjectIds(curatedIds) },
        isActive: true,
      })
        .select(
          "title slug price mrp images colorOptions ratingAvg ratingCount onSale brand"
        )
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
    } catch (err) {
      console.error("essentials curated failed", err);
    }
  }

  const need = limit - ordered.length;
  if (need <= 0) return ordered;

  const brandId =
    product.brand && typeof product.brand === "object" && "_id" in product.brand
      ? product.brand._id
      : product.brand;

  try {
    const fill = await Product.find({
      _id: { $nin: safeObjectIds([...seen]) },
      isActive: true,
      $or: [
        { tags: { $in: ESSENTIAL_TAGS } },
        ...(brandId ? [{ brand: brandId }] : []),
      ],
    } as Record<string, unknown>)
      .select(
        "title slug price mrp images colorOptions ratingAvg ratingCount onSale brand tags"
      )
      .populate("brand", "name")
      .sort({ featured: -1, updatedAt: -1 })
      .limit(need)
      .lean();

    for (const p of fill) {
      const id = String(p._id);
      if (seen.has(id)) continue;
      seen.add(id);
      ordered.push(
        toCard({
          ...p,
          brand: p.brand as { name?: string } | null,
        })
      );
    }
  } catch (err) {
    console.error("essentials fill failed", err);
  }

  return ordered;
}
