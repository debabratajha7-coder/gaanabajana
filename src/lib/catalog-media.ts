/** Category cover images for home (by slug) — used when admin has not uploaded one yet */
export const CATEGORY_IMAGES: Record<string, string> = {
  guitars:
    "https://images.unsplash.com/photo-1556449895-a33c391ef329?auto=format&fit=crop&w=1200&q=80",
  "ukuleles-violins":
    "https://images.unsplash.com/photo-1612225330812-01a9c6b355ec?auto=format&fit=crop&w=1200&q=80",
  "keyboards-pianos":
    "https://images.unsplash.com/photo-1552422535-c45813c61732?auto=format&fit=crop&w=1200&q=80",
  "studio-recording":
    "/home/home-studio.jpg",
  "drums-percussion":
    "https://images.unsplash.com/photo-1571327073757-71d13c24de30?auto=format&fit=crop&w=1200&q=80",
  "software-plugins":
    "https://images.unsplash.com/photo-1598653222333-8f9c9a52f0d3?auto=format&fit=crop&w=1200&q=80",
  other:
    "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80",
  deals:
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80",
};

/** Prefer Cloudinary/admin-uploaded image, then curated fallback by slug */
export function categoryImage(slug: string, uploaded?: string | null) {
  if (uploaded) return uploaded;
  return CATEGORY_IMAGES[slug] || CATEGORY_IMAGES.guitars;
}
