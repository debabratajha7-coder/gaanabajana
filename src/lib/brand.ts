/** Canonical store brand — use for UI wordmarks */
export const STORE_NAME = "Gaana Bajana";
export const STORE_WORDMARK = "gaana bajana";

/** Normalize any old spelling from DB / cache */
export function brandWordmark(name?: string | null) {
  const raw = (name || STORE_NAME).trim().toLowerCase();
  const compact = raw.replace(/\s+/g, "");
  if (
    !raw ||
    compact === "gaanbajna" ||
    compact === "gaanbajana" ||
    compact === "gaanabajana" ||
    compact.includes("gaanbaj") ||
    compact.includes("gaanabaj")
  ) {
    return STORE_WORDMARK;
  }
  return raw;
}
