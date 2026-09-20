/**
 * Rewrite Cloudinary delivery URLs with AI background removal
 * filled to a solid hex (no #) so product cutouts match PDP theme.
 */
export function themedProductImage(src: string, fillHex: string): string {
  if (!src) return src;

  const cleanHex = fillHex.replace(/^#/, "").toUpperCase();
  if (!/^[0-9A-F]{6}$/.test(cleanHex)) return src;

  try {
    const url = new URL(src, "https://res.cloudinary.com");
    if (!url.hostname.includes("cloudinary.com")) return src;

    // Already has our transform — replace fill color
    const marker = "/upload/";
    const idx = url.pathname.indexOf(marker);
    if (idx === -1) return src;

    const before = url.pathname.slice(0, idx + marker.length);
    let after = url.pathname.slice(idx + marker.length);

    // Strip previous e_background_removal / b_rgb segments we may have added
    after = after.replace(
      /^(?:[^/]*e_background_removal[^/]*\/)?(?:b_rgb:[0-9A-Fa-f]{6}\/)?/,
      ""
    );

    const transform = `e_background_removal/b_rgb:${cleanHex}/`;
    url.pathname = `${before}${transform}${after}`;
    return url.toString();
  } catch {
    return src;
  }
}
