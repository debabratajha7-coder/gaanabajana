/**
 * Cloudinary helpers for fast delivery.
 * Prefer optimizedRemoteImage / themedProductImage({ bgRemoval: false }) on list pages —
 * AI background removal is slow and often huge (Lighthouse “Improve image delivery”).
 */

export function themedProductImage(
  src: string,
  fillHex: string,
  opts?: { width?: number; bgRemoval?: boolean }
): string {
  if (!src) return src;

  const cleanHex = fillHex.replace(/^#/, "").toUpperCase();
  if (!/^[0-9A-F]{6}$/.test(cleanHex)) return src;

  const width = opts?.width ?? 640;
  const bgRemoval = opts?.bgRemoval === true;

  try {
    const url = new URL(src, "https://res.cloudinary.com");
    if (!url.hostname.includes("cloudinary.com")) return src;

    const marker = "/upload/";
    const idx = url.pathname.indexOf(marker);
    if (idx === -1) return src;

    const before = url.pathname.slice(0, idx + marker.length);
    let after = url.pathname.slice(idx + marker.length);

    after = after.replace(
      /^(?:[^/]*e_background_removal[^/]*\/)?(?:b_rgb:[0-9A-Fa-f]{6}\/)?(?:f_auto\/)?(?:q_auto(?::[^/]+)?\/)?(?:c_limit,w_\d+\/|w_\d+\/)?/,
      ""
    );

    const transform = bgRemoval
      ? `e_background_removal/b_rgb:${cleanHex}/f_auto/q_auto:eco/c_limit,w_${width}/`
      : `f_auto/q_auto:eco/c_limit,w_${width}/`;
    url.pathname = `${before}${transform}${after}`;
    return url.toString();
  } catch {
    return src;
  }
}

/** Lightweight Cloudinary / Unsplash resize (no AI). */
export function optimizedRemoteImage(
  src: string,
  opts?: { width?: number; quality?: string }
): string {
  if (!src) return src;
  const width = opts?.width ?? 1200;
  const quality = opts?.quality ?? "auto:eco";

  try {
    if (src.includes("images.unsplash.com")) {
      const url = new URL(src);
      url.searchParams.set("auto", "format");
      url.searchParams.set("fit", "crop");
      url.searchParams.set("w", String(width));
      url.searchParams.set("q", "70");
      return url.toString();
    }

    const url = new URL(src, "https://res.cloudinary.com");
    if (!url.hostname.includes("cloudinary.com")) return src;

    const marker = "/upload/";
    const idx = url.pathname.indexOf(marker);
    if (idx === -1) return src;

    const before = url.pathname.slice(0, idx + marker.length);
    let after = url.pathname.slice(idx + marker.length);
    after = after.replace(
      /^(?:[^/]*e_background_removal[^/]*\/)?(?:b_rgb:[0-9A-Fa-f]{6}\/)?(?:f_auto\/)?(?:q_auto(?::[^/]+)?\/)?(?:c_limit,w_\d+\/|w_\d+\/)?/,
      ""
    );
    url.pathname = `${before}f_auto/q_${quality}/c_limit,w_${width}/${after}`;
    return url.toString();
  } catch {
    return src;
  }
}
