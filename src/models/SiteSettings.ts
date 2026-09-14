import { Schema, models, model, Types } from "mongoose";

export interface ISiteSettings {
  _id: Types.ObjectId;
  storeName: string;
  tagline: string;
  phone: string;
  email: string;
  whatsapp?: string;
  address?: string;
  freeShippingThreshold: number;
  shippingFee: number;
  heroHeadline: string;
  heroSubheadline: string;
  heroCtaLabel: string;
  heroCtaHref: string;
  heroImage: string;
  social: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    twitter?: string;
  };
  pickupLocationName: string;
}

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    storeName: { type: String, default: "Gaanbajana" },
    tagline: { type: String, default: "Musical instruments & audio gear for every stage" },
    phone: { type: String, default: "+91-98765-43210" },
    email: { type: String, default: "hello@gaanbajana.com" },
    whatsapp: String,
    address: String,
    freeShippingThreshold: { type: Number, default: 1000 },
    shippingFee: { type: Number, default: 99 },
    heroHeadline: {
      type: String,
      default: "Find the instrument that finds your sound",
    },
    heroSubheadline: {
      type: String,
      default: "Guitars, keys, drums, and studio gear — curated for Indian musicians.",
    },
    heroCtaLabel: { type: String, default: "Shop bestsellers" },
    heroCtaHref: { type: String, default: "/collections/bestsellers" },
    heroImage: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=2000&q=80",
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
  if (existing) return existing;
  return SiteSettings.create({});
}
