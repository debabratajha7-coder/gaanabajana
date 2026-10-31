/**
 * Storefront image helpers.
 * Old Cloudinary cloud is disabled — URLs there never render.
 */
const DEAD_CLOUDINARY_HOST = "res.cloudinary.com/hjudwj5u/";

export function isUsableProductImageUrl(url: unknown): url is string {
  if (typeof url !== "string" || !url.trim()) return false;
  if (url.includes(DEAD_CLOUDINARY_HOST)) return false;
  return true;
}

/** Drop dead/blank URLs so cards never lead with a broken photo. */
export function usableProductImages(images?: unknown[] | null): string[] {
  return (images || []).filter(isUsableProductImageUrl);
}

/** Return a product-shaped object with only storefront-safe image URLs. */
export function withUsableProductImages<
  T extends {
    images?: unknown[] | null;
    colorOptions?: { images?: unknown[] | null; [key: string]: unknown }[] | null;
  },
>(product: T): T {
  return {
    ...product,
    images: usableProductImages(product.images),
    colorOptions: (product.colorOptions || []).map((c) => ({
      ...c,
      images: usableProductImages(c.images),
    })),
  };
}
