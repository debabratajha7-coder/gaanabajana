import { Category } from "@/models/Category";
import { slugify } from "@/lib/utils";

/**
 * When a main category is itself an instrument name (e.g. "Acoustic guitar"),
 * ensure a plain product subtype exists — not only Accessories / Semi variants.
 */
const ENSURE_RULES: { parentMatch: RegExp; subtypes: string[] }[] = [
  {
    parentMatch: /^acoustic\s*guitars?$/i,
    subtypes: [
      "Acoustic",
      "Semi Acoustic",
      "Electro Acoustic",
      "Acoustic Accessories",
    ],
  },
  {
    parentMatch: /^electric\s*guitars?$/i,
    subtypes: [
      "Electric Guitars",
      "Bass Guitars",
      "Guitar Accessories",
      "Guitar Pedals",
      "Guitar Amplifiers",
    ],
  },
  {
    parentMatch: /^guitars?$/i,
    subtypes: [
      "Acoustic Guitars",
      "Electric Guitars",
      "Electro Acoustic Guitars",
      "Classical Guitars",
      "Bass Guitars",
      "Guitar Accessories",
    ],
  },
];

async function uniqueSlug(base: string, parentId: string) {
  let slug = slugify(base);
  const clash = await Category.findOne({ slug }).lean();
  if (!clash) return slug;
  return `${slug}-${String(parentId).slice(-5)}`;
}

/** Idempotent — safe to call on every admin catalog load. */
export async function ensureCatalogCoreSubtypes() {
  const parents = await Category.find({
    $or: [{ parent: null }, { parent: { $exists: false } }],
    isActive: { $ne: false },
  }).lean();

  let created = 0;

  for (const parent of parents) {
    const rule = ENSURE_RULES.find((r) => r.parentMatch.test(parent.name));
    if (!rule) continue;

    const kids = await Category.find({ parent: parent._id }).lean();
    let sortOrder =
      kids.reduce((m, k) => Math.max(m, Number(k.sortOrder) || 0), -1) + 1;

    for (const name of rule.subtypes) {
      const exists = kids.some(
        (k) => k.name.trim().toLowerCase() === name.toLowerCase()
      );
      if (exists) continue;

      const slug = await uniqueSlug(name, String(parent._id));
      await Category.create({
        name,
        slug,
        parent: parent._id,
        sortOrder: sortOrder++,
        isActive: true,
      });
      created += 1;
    }
  }

  return { created };
}
