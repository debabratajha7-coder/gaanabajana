/**
 * Storefront visibility for product photos.
 * Old Cloudinary cloud is disabled — URLs there render as blank tiles.
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

/** True when the product has at least one image that can actually display. */
export function productHasStorefrontImage(product: {
  images?: unknown[] | null;
  colorOptions?: { images?: unknown[] | null }[] | null;
}): boolean {
  if (usableProductImages(product.images).length > 0) return true;
  return (product.colorOptions || []).some(
    (c) => usableProductImages(c.images).length > 0
  );
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

/**
 * Mongo filter: active products with a non-empty images array that is not
 * only pointing at the disabled Cloudinary cloud.
 */
export function storefrontImageFilter(): Record<string, unknown> {
  return {
    images: { $exists: true, $type: "array", $ne: [] },
    // At least one image URL that is not the dead cloud.
    $expr: {
      $gt: [
        {
          $size: {
            $filter: {
              input: { $ifNull: ["$images", []] },
              as: "img",
              cond: {
                $and: [
                  { $eq: [{ $type: "$$img" }, "string"] },
                  { $gt: [{ $strLenCP: "$$img" }, 0] },
                  {
                    $eq: [
                      {
                        $indexOfCP: ["$$img", DEAD_CLOUDINARY_HOST],
                      },
                      -1,
                    ],
                  },
                ],
              },
            },
          },
        },
        0,
      ],
    },
  };
}
