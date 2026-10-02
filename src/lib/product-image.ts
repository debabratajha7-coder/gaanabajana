/**
 * Cloudinary helpers. Use bgRemoval: true for cutout product/category art
 * (homepage, PDP). Always pair with a tight width so LCP stays sane.
 */

/** AI upscale only when the source is too small for a retina tile. */
const UPSCALE_SMALL = "if_iw_lt_700/e_upscale/if_end/";
const SHARPEN = "e_sharpen:60/";

const LEADING_TRANSFORM =
  /^(?:if_[^/]+|e_upscale|e_sharpen(?::\d+)?|e_background_removal(?::[^/]+)?|e_trim(?::\d+)?|b_rgb:[0-9A-Fa-f]{6}(?:[0-9A-Fa-f]{2})?|f_auto|f_jpg|f_png|f_webp|q_auto(?::[^/]+)?|c_limit,[^/]+|c_lpad,[^/]+|c_pad,[^/]+|c_fit,[^/]+|w_\d+)\//;

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
  opts?: {
    width?: number;
    bgRemoval?: boolean;
    stage?: boolean;
    /** Stage frame height ÷ width; defaults to the 4:5 card. */
    frameRatio?: number;
  }
): string {
  if (!src) return src;

  const cleanHex = fillHex.replace(/^#/, "").toUpperCase();
  // 8-digit RGBA ("00000000") pads onto transparency.
  if (!/^[0-9A-F]{6}(?:[0-9A-F]{2})?$/.test(cleanHex)) return src;

  const width = opts?.width ?? 640;
  const bgRemoval = opts?.bgRemoval === true;
  const stage = opts?.stage === true;
  // next/image fetches upstream without an Accept header, so f_auto would hand
  // it a JPEG and drop the alpha channel.
  const format = cleanHex.length === 8 ? "f_webp" : "f_auto";

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
      // Trim leftover canvas, then center every subject in a shared 4:5 frame
      // so wide keyboards and tall guitars sit on the same midline.
      const frameW = width;
      const frameH = Math.round(width * (opts?.frameRatio ?? 1.25));
      const limitW = Math.round(frameW * 0.92);
      const limitH = Math.round(frameH * 0.86);
      transform = `${UPSCALE_SMALL}e_background_removal/e_trim/c_fit,w_${limitW},h_${limitH}/c_lpad,w_${frameW},h_${frameH},b_rgb:${cleanHex},g_center/${SHARPEN}${format}/q_auto:good/`;
    } else if (bgRemoval) {
      transform = `${UPSCALE_SMALL}e_background_removal/b_rgb:${cleanHex}/c_limit,w_${width}/${SHARPEN}${format}/q_auto:good/`;
    } else {
      transform = `f_auto/q_auto:eco/c_limit,w_${width}/`;
    }
    url.pathname = `${before}${transform}${after}`;
    return url.toString();
  } catch {
    return src;
  }
}

/**
 * Fit the whole product inside a 4:5 card (no AI). Trims the photo's empty
 * margin, scales it into the frame, and pads with the photo's own border colour
 * so wide keyboards and tall guitars both show edge to edge without cropping.
 */
export function fittedProductImage(src: string, opts?: { width?: number }): string {
  if (!src || src.startsWith("/")) return src;
  const width = opts?.width ?? 600;
  const height = Math.round(width * 1.25);
  const fitW = Math.round(width * 0.9);
  const fitH = Math.round(height * 0.8);

  try {
    const url = new URL(src, "https://res.cloudinary.com");
    if (!url.hostname.includes("cloudinary.com")) return src;

    const marker = "/upload/";
    const idx = url.pathname.indexOf(marker);
    if (idx === -1) return src;

    const before = url.pathname.slice(0, idx + marker.length);
    const after = stripLeadingTransforms(url.pathname.slice(idx + marker.length));
    url.pathname = `${before}${UPSCALE_SMALL}e_trim/c_fit,w_${fitW},h_${fitH}/c_lpad,w_${width},h_${height},b_auto:border/${SHARPEN}f_auto/q_auto:good/${after}`;
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
