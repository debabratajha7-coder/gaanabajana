import { Schema, models, model, Types } from "mongoose";
import {
  DEFAULT_GOOGLE_REVIEWS_URL,
  resolveGoogleReviewsUrl,
} from "@/lib/google-reviews";

export type WhyItem = { title: string; body: string };
export type StatItem = { value: string; label: string };
export type HomeReviewItem = { quote: string; source?: string };

export interface ISiteSettings {
  _id: Types.ObjectId;
  storeName: string;
  tagline: string;
  phone: string;
  email: string;
  whatsapp?: string;
  address?: string;
  storeHours?: string;
  googleRatingLabel?: string;
  googleReviewsUrl?: string;
  freeShippingThreshold: number;
  shippingFee: number;
  heroHeadline: string;
  heroSubheadline: string;
  heroCtaLabel: string;
  heroCtaHref: string;
  heroImage: string;
  homeCategoriesEyebrow: string;
  homeCategoriesTitle: string;
  homeBestsellersEyebrow: string;
  homeBestsellersTitle: string;
  homeBestsellersSubtitle?: string;
  homeBrandsEyebrow: string;
  homeBrandsTitle: string;
  homeBlogEyebrow: string;
  homeBlogTitle: string;
  homeWhyTitle: string;
  homeWhyItems: WhyItem[];
  homeStats: StatItem[];
  homeReviewsTitle?: string;
  homeReviews: HomeReviewItem[];
  social: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    twitter?: string;
  };
  pickupLocationName: string;
}

const DEFAULT_WHY: WhyItem[] = [
  { title: "Fast, free shipping", body: "On most products across India" },
  { title: "Expert support", body: "Got a question? We’re here to help" },
  { title: "Manufacturer warranty", body: "So you can focus on the music" },
  { title: "Secure prepaid checkout", body: "Safe payments every time" },
  { title: "Curated gear", body: "Instruments checked before they ship" },
];

const DEFAULT_STATS: StatItem[] = [
  { value: "10k+", label: "Products" },
  { value: "1M+", label: "Orders inspired" },
  { value: "500K+", label: "Musicians served" },
  { value: "Pan-India", label: "Delivery" },
];

const DEFAULT_REVIEWS: HomeReviewItem[] = [
  {
    quote: "Nice service, good accessories quality — best.",
    source: "Google Review",
  },
  {
    quote: "Very cool experience and we got the things at a very suitable price.",
    source: "Google Review",
  },
  {
    quote: "Lovely place and the owner’s behavior is lovely.",
    source: "Google Review",
  },
];

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    storeName: { type: String, default: "Gaana Bajana" },
    tagline: {
      type: String,
      default: "Musical instruments & audio gear for every stage",
    },
    phone: { type: String, default: "+91 9563754563, +91 7679586321" },
    email: { type: String, default: "hello@gaanbajana.com" },
    whatsapp: String,
    address: {
      type: String,
      default:
        "M9VC F4C Medical More, Kawakhari, West Bengal, 734011, India",
    },
    storeHours: { type: String, default: "Open daily until 9:00 PM" },
    googleRatingLabel: { type: String, default: "4.8+ ★ Google" },
    googleReviewsUrl: { type: String, default: DEFAULT_GOOGLE_REVIEWS_URL },
    freeShippingThreshold: { type: Number, default: 1000 },
    shippingFee: { type: Number, default: 99 },
    heroHeadline: {
      type: String,
      default: "Find the instrument that finds your sound",
    },
    heroSubheadline: {
      type: String,
      default:
        "Guitars, keys, drums, and studio gear — curated for Indian musicians.",
    },
    heroCtaLabel: { type: String, default: "Shop bestsellers" },
    heroCtaHref: { type: String, default: "/collections/bestsellers" },
    heroImage: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=2000&q=80",
    },
    homeCategoriesEyebrow: { type: String, default: "Explore" },
    homeCategoriesTitle: { type: String, default: "Explore By Category" },
    homeBestsellersEyebrow: { type: String, default: "Curated" },
    homeBestsellersTitle: { type: String, default: "Best Sellers" },
    homeBestsellersSubtitle: {
      type: String,
      default: "",
    },
    homeBrandsEyebrow: { type: String, default: "Trusted names" },
    homeBrandsTitle: { type: String, default: "Top Brands" },
    homeBlogEyebrow: { type: String, default: "Learn" },
    homeBlogTitle: { type: String, default: "Latest Stories" },
    homeWhyTitle: { type: String, default: "Why Gaana Bajana" },
    homeWhyItems: {
      type: [
        {
          title: { type: String },
          body: { type: String },
        },
      ],
      default: DEFAULT_WHY,
    },
    homeStats: {
      type: [
        {
          value: { type: String },
          label: { type: String },
        },
      ],
      default: DEFAULT_STATS,
    },
    homeReviewsTitle: { type: String, default: "What musicians say" },
    homeReviews: {
      type: [
        {
          quote: { type: String },
          source: { type: String },
        },
      ],
      default: DEFAULT_REVIEWS,
    },
    social: {
      facebook: String,
      instagram: String,
      youtube: String,
      twitter: String,
    },
    pickupLocationName: { type: String, default: "Primary" },
  },
  { timestamps: true }
);

export const SiteSettings =
  models.SiteSettings || model<ISiteSettings>("SiteSettings", SiteSettingsSchema);

export async function getSiteSettings() {
  const existing = await SiteSettings.findOne();
  if (existing) {
    let dirty = false;
    if (!existing.homeWhyItems?.length) {
      existing.homeWhyItems = DEFAULT_WHY;
      dirty = true;
    }
    if (!existing.homeStats?.length) {
      existing.homeStats = DEFAULT_STATS;
      dirty = true;
    }
    if (!existing.homeReviews?.length) {
      existing.homeReviews = DEFAULT_REVIEWS;
      dirty = true;
    }
    if (!existing.storeHours) {
      existing.storeHours = "Open daily until 9:00 PM";
      dirty = true;
    }
    if (!existing.googleRatingLabel) {
      existing.googleRatingLabel = "4.8+ ★ Google";
      dirty = true;
    }
    if (!existing.homeReviewsTitle) {
      existing.homeReviewsTitle = "What musicians say";
      dirty = true;
    }
    if (!existing.googleReviewsUrl?.trim() ||
      existing.googleReviewsUrl.includes("/maps/search/")) {
      existing.googleReviewsUrl = resolveGoogleReviewsUrl();
      dirty = true;
    }
    if (dirty) await existing.save();
    return existing;
  }
  return SiteSettings.create({});
}
