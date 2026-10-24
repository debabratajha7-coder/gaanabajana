/**
 * Cheap Cloudinary delivery only — resize / format / quality.
 * Never run e_background_removal or e_upscale here (those burn credits
 * on every page view). Bake AI once at upload via uploadProductImage().
 */

const LEADING_TRANSFORM =
  /^(?:if_[^/]+|e_upscale|e_sharpen(?::\d+)?|e_background_removal(?::[^/]+)?|e_trim(?::\d+)?|b_rgb:[0-9A-Fa-f]{6}(?:[0-9A-Fa-f]{2})?|b_auto(?::[^/]+)?|f_auto|f_jpg|f_png|f_webp|q_auto(?::[^/]+)?|c_limit,[^/]+|c_fill,[^/]+|c_lpad,[^/]+|c_pad,[^/]+|c_fit,[^/]+|g_[^/]+|w_\d+|h_\d+)\//;

function stripLeadingTransforms(pathAfterUpload: string) {
  let after = pathAfterUpload;
  while (LEADING_TRANSFORM.test(after)) {
    after = after.replace(LEADING_TRANSFORM, "");
  }
  return after;
}

function withCloudinaryTransform(
  src: string,
  transform: string
): string {
  if (!src || src.startsWith("/")) return src;
  try {
    const url = new URL(src, "https://res.cloudinary.com");
    if (!url.hostname.includes("cloudinary.com")) return src;

    const marker = "/upload/";
    const idx = url.pathname.indexOf(marker);
    if (idx === -1) return src;

    const before = url.pathname.slice(0, idx + marker.length);
    const after = stripLeadingTransforms(url.pathname.slice(idx + marker.length));
    url.pathname = `${before}${transform}${after}`;
    return url.toString();
  } catch {
    return src;
  }
}

/**
 * Editorial cover crop for cards / tiles (photos with real backgrounds).
 * Cheap: no AI.
 */
export function coverProductImage(
  src: string,
  opts?: { width?: number; height?: number }
): string {
  const width = opts?.width ?? 600;
  const height = opts?.height ?? Math.round(width * 1.25);
  return withCloudinaryTransform(
    src,
    `c_fill,g_auto,w_${width},h_${height}/f_auto/q_auto:good/`
  );
}

/**
 * Fit whole product in frame without cropping (cutouts or tall subjects).
 * Cheap: no AI. Pads with a soft neutral so uneven photos still look tidy.
 */
export function fittedProductImage(
  src: string,
  opts?: { width?: number; fillHex?: string }
): string {
  const width = opts?.width ?? 600;
  const height = Math.round(width * 1.25);
  const fill = (opts?.fillHex || "121212").replace(/^#/, "").toUpperCase();
  const pad =
    /^[0-9A-F]{6}$/.test(fill) ? `b_rgb:${fill}` : "b_auto:border";
  return withCloudinaryTransform(
    src,
    `c_pad,w_${width},h_${height},${pad},g_center/f_auto/q_auto:good/`
  );
}

/**
 * @deprecated Prefer coverProductImage / fittedProductImage.
 * Kept so older call sites keep compiling; ignores AI flags and only resizes.
 */
export function themedProductImage(
  src: string,
  fillHex: string,
  opts?: {
    width?: number;
    bgRemoval?: boolean;
    stage?: boolean;
    frameRatio?: number;
  }
): string {
  const width = opts?.width ?? 640;
  if (opts?.stage) {
    const ratio = opts.frameRatio ?? 1.25;
    return coverProductImage(src, {
      width,
      height: Math.round(width * ratio),
    });
  }
  return fittedProductImage(src, { width, fillHex });
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

    return withCloudinaryTransform(
      src,
      `f_auto/q_${quality}/c_limit,w_${width}/`
    );
  } catch {
    return src;
  }
}
