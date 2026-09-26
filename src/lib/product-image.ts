/**
 * Cloudinary helpers. Use bgRemoval: true for cutout product/category art
 * (homepage, PDP). Always pair with a tight width + q_auto:eco so LCP stays sane.
 */

const LEADING_TRANSFORM =
  /^(?:e_background_removal(?::[^/]+)?|e_trim(?::\d+)?|b_rgb:[0-9A-Fa-f]{6}|f_auto|f_jpg|f_png|q_auto(?::[^/]+)?|c_limit,[^/]+|c_lpad,[^/]+|c_pad,[^/]+|c_fit,[^/]+|w_\d+)\//;

function stripLeadingTransforms(pathAfterUpload: string) {
  let after = pathAfterUpload;
  while (LEADING_TRANSFORM.test(after)) {
    after = after.replace(LEADING_TRANSFORM, "");
  }
  return after;
}

export function themedProductImage(
  src: string,
  fillHex: string,
  opts?: { width?: number; bgRemoval?: boolean; stage?: boolean }
): string {
  if (!src) return src;

  const cleanHex = fillHex.replace(/^#/, "").toUpperCase();
  if (!/^[0-9A-F]{6}$/.test(cleanHex)) return src;

  const width = opts?.width ?? 640;
  const bgRemoval = opts?.bgRemoval === true;
  const stage = opts?.stage === true;

  try {
    const url = new URL(src, "https://res.cloudinary.com");
    if (!url.hostname.includes("cloudinary.com")) return src;

    const marker = "/upload/";
    const idx = url.pathname.indexOf(marker);
    if (idx === -1) return src;

    const before = url.pathname.slice(0, idx + marker.length);
    const after = stripLeadingTransforms(url.pathname.slice(idx + marker.length));

    let transform: string;
    if (bgRemoval && stage) {
      // Trim leftover canvas, then hang every subject from the same top line
      // in a shared 4:5 frame. Wide keyboards share a width; a bundled adaptor
      // hangs below instead of shoving the keyboard up.
      const frameW = width;
      const frameH = Math.round(width * 1.25);
      const limitW = Math.round(frameW * 0.92);
      const limitH = Math.round(frameH * 0.86);
      const drop = Math.max(8, Math.round(frameH * 0.06));
      transform = `e_background_removal/e_trim/c_limit,w_${limitW},h_${limitH}/c_lpad,w_${frameW},h_${frameH},b_rgb:${cleanHex},g_north,y_${drop}/f_auto/q_auto:eco/`;
    } else if (bgRemoval) {
      transform = `e_background_removal/b_rgb:${cleanHex}/f_auto/q_auto:eco/c_limit,w_${width}/`;
    } else {
      transform = `f_auto/q_auto:eco/c_limit,w_${width}/`;
    }
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
  if (!src || src.startsWith("/")) return src;
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
