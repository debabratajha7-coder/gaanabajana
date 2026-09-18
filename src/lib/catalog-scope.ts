import { Types } from "mongoose";
import { Category } from "@/models/Category";

/** "Acoustic Guitars" / "acoustic-guitars" / "acoustic guitar" → acousticguitar */
export function normalizeCategoryKey(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "")
    .replace(/s$/g, "");
}

type CatLite = {
  _id: Types.ObjectId | string;
  name?: string;
  slug?: string;
  parent?: Types.ObjectId | string | null;
};

/**
 * Category + its subtypes, plus any other categories with the same
 * normalized name (e.g. top-level “acoustic guitar” ↔ “Acoustic Guitars”
 * under Guitars). Fixes empty Coming Soon when products live on a
 * differently parented but equivalently named subtype.
 */
export async function resolveCatalogCategoryIds(
  category: CatLite
): Promise<Types.ObjectId[]> {
  const all = (await Category.find({ isActive: true })
    .select("_id name slug parent")
    .lean()) as CatLite[];

  const byParent = new Map<string, CatLite[]>();
  for (const c of all) {
    const pid = c.parent ? String(c.parent) : "";
    const list = byParent.get(pid) || [];
    list.push(c);
    byParent.set(pid, list);
  }

  const key = normalizeCategoryKey(category.name || category.slug || "");
  const seedIds = new Set<string>([String(category._id)]);

  if (key) {
    for (const c of all) {
      const nameKey = normalizeCategoryKey(c.name || "");
      const slugKey = normalizeCategoryKey(c.slug || "");
      if (nameKey === key || slugKey === key) {
        seedIds.add(String(c._id));
      }
    }
  }

  const out = new Set<string>(seedIds);
  for (const id of seedIds) {
    for (const child of byParent.get(id) || []) {
      out.add(String(child._id));
    }
  }

  return [...out].map((id) => new Types.ObjectId(id));
}
