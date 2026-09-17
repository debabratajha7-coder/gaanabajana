import { connectDB } from "@/lib/db";
import { Category } from "@/models/Category";
import { getSiteSettings } from "@/models/SiteSettings";
import { filterPublicCategories } from "@/lib/public-catalog";

export async function getLayoutData() {
  try {
    await connectDB();
    const [categories, settings] = await Promise.all([
      Category.find({ isActive: true }).sort({ sortOrder: 1 }).lean(),
      getSiteSettings(),
    ]);
    const publicCats = filterPublicCategories(
      categories.map((c) => ({
        _id: String(c._id),
        name: c.name,
        slug: c.slug,
        parent: c.parent ? String(c.parent) : null,
      }))
    );
    const publicIds = new Set(publicCats.map((c) => c._id));
    const categoriesForNav = publicCats.filter(
      (c) => !c.parent || publicIds.has(c.parent)
    );

    return {
      categories: categoriesForNav,
      settings: {
        storeName: settings.storeName,
        tagline: settings.tagline,
        phone: settings.phone,
        email: settings.email,
        address: settings.address,
        heroHeadline: settings.heroHeadline,
        heroSubheadline: settings.heroSubheadline,
        heroCtaLabel: settings.heroCtaLabel,
        heroCtaHref: settings.heroCtaHref,
        heroImage: settings.heroImage,
        freeShippingThreshold: settings.freeShippingThreshold,
        shippingFee: settings.shippingFee,
        social: {
          facebook: settings.social?.facebook ?? "",
          instagram: settings.social?.instagram ?? "",
          youtube: settings.social?.youtube ?? "",
          twitter: settings.social?.twitter ?? "",
        },
      },
    };
  } catch {
    return {
      categories: [],
      settings: {
        storeName: "Gaana Bajana",
        tagline: "Musical instruments & audio gear for every stage",
        phone: "+91 9563754563, +91 7679586321",
        email: "hello@gaanbajana.com",
        address: "M9VC F4C Medical More, Kawakhari, West Bengal, 734011, India",
        heroHeadline: "Find the instrument that finds your sound",
        heroSubheadline:
          "Guitars, keys, drums, and studio gear — curated for Indian musicians.",
        heroCtaLabel: "Shop bestsellers",
        heroCtaHref: "/collections/guitars",
        heroImage:
          "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=2000&q=80",
        freeShippingThreshold: 1000,
        shippingFee: 99,
        social: {},
      },
    };
  }
}
