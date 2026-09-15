/** Canonical store brand — use for UI wordmarks */
export const STORE_NAME = "Gaanbajna";
export const STORE_WORDMARK = "gaanbajna";

/** Normalize any old spelling from DB / cache */
export function brandWordmark(name?: string | null) {
  const raw = (name || STORE_NAME).trim().toLowerCase();
  if (raw === "gaanbajana" || raw.includes("gaanbajana")) return STORE_WORDMARK;
  return raw || STORE_WORDMARK;
}
