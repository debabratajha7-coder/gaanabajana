/** Category cover images for home (by slug) — distinct instrument photos */
export const CATEGORY_IMAGES: Record<string, string> = {
  guitars:
    "https://images.unsplash.com/photo-1510915361894-db8b50135cf0?auto=format&fit=crop&w=900&q=80",
  "ukuleles-violins":
    "https://images.unsplash.com/photo-1612225330812-01a9c6b355ec?auto=format&fit=crop&w=900&q=80",
  "keyboards-pianos":
    "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=900&q=80",
  "studio-recording":
    "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=900&q=80",
  "drums-percussion":
    "https://images.unsplash.com/photo-1519892306165-0729e2e0d1a8?auto=format&fit=crop&w=900&q=80",
  "software-plugins":
    "https://images.unsplash.com/photo-1598653222333-8f9c9a52f0d3?auto=format&fit=crop&w=900&q=80",
  other:
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80",
  deals:
    "https://images.unsplash.com/photo-1514320291840-3092125dfe58?auto=format&fit=crop&w=900&q=80",
};

/**
 * Brand logos (by slug).
 * Wikimedia Commons wordmarks where available; others fall back to wordmark text in UI.
 */
export const BRAND_LOGOS: Record<string, string> = {
  fender:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Fender_guitars_logo.svg/320px-Fender_guitars_logo.svg.png",
  yamaha:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Yamaha_logo.svg/320px-Yamaha_logo.svg.png",
  ibanez:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Ibanez_logo.svg/320px-Ibanez_logo.svg.png",
  roland:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Roland_Corporation_logo.svg/320px-Roland_Corporation_logo.svg.png",
  casio:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Casio_logo.svg/320px-Casio_logo.svg.png",
  shure:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Shure_Logo.svg/320px-Shure_Logo.svg.png",
};

export function categoryImage(slug: string, fallback?: string) {
  return CATEGORY_IMAGES[slug] || fallback || CATEGORY_IMAGES.guitars;
}

export function brandLogo(slug: string) {
  return BRAND_LOGOS[slug] || null;
}
