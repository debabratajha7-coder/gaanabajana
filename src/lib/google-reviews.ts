/** Verified Google Maps reviews listing (The Guitar Shop / Gaana Bajana). */
export const DEFAULT_GOOGLE_REVIEWS_URL =
  "https://www.google.com/maps/place/The+Guitar+Shop/@26.6935643,88.3698145,17z/data=!4m8!3m7!1s0x39e44788b48f87db:0x964f23aa96f63640!8m2!3d26.6935643!4d88.3698145!9m1!1b1!16s%2Fg%2F11j32w9qgz";

/** Resolve the shop's Google reviews / Maps listing URL. */
export function resolveGoogleReviewsUrl({
  url,
}: {
  url?: string | null;
  storeName?: string | null;
  address?: string | null;
} = {}): string {
  const trimmed = url?.trim();
  if (trimmed) return trimmed;
  return DEFAULT_GOOGLE_REVIEWS_URL;
}
