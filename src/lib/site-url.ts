/** Canonical public site origin (no trailing slash). */
export function getSiteUrl() {
  const raw = (
    process.env.NEXT_PUBLIC_APP_URL || "https://www.gaanabajana.com"
  )
    .trim()
    .replace(/\/$/, "");

  try {
    const u = new URL(raw);
    // Prefer www — apex redirects there and GSC was submitted on www.
    if (u.hostname === "gaanabajana.com") {
      u.hostname = "www.gaanabajana.com";
    }
    if (u.protocol !== "https:") u.protocol = "https:";
    return u.origin;
  } catch {
    return "https://www.gaanabajana.com";
  }
}
