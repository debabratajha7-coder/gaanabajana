/** Canonical public site origin (no trailing slash). */
export function getSiteUrl() {
  const raw = (
    process.env.NEXT_PUBLIC_APP_URL || "https://www.gaanabajana.com"
  )
    .trim()
    .replace(/\/$/, "");

  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();
    const isLocal =
      host === "localhost" || host === "127.0.0.1" || host.endsWith(".local");

    if (!isLocal) {
      if (host === "gaanabajana.com") {
        u.hostname = "www.gaanabajana.com";
      }
      u.protocol = "https:";
    }

    return u.origin;
  } catch {
    return "https://www.gaanabajana.com";
  }
}
