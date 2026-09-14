/** Categories we hide from the public shop UI */
const HIDDEN_CATEGORY_SLUGS = new Set(["software-plugins"]);

export function isPublicCategory(slug: string, name?: string) {
  if (HIDDEN_CATEGORY_SLUGS.has(slug)) return false;
  if (name && /software\s*&\s*plugins/i.test(name)) return false;
  return true;
}

export function filterPublicCategories<T extends { slug: string; name?: string }>(
  items: T[]
) {
  return items.filter((c) => isPublicCategory(c.slug, c.name));
}
