import { Schema, models, model, Types, type Model } from "mongoose";

export type ProductVariant = {
  sku: string;
  name: string;
  color?: string;
  price: number;
  mrp: number;
  stock: number;
  image?: string;
};

export type ProductColorOption = {
  name: string;
  swatch: string;
  images: string[];
};

export type ProductSpec = {
  label: string;
  value: string;
};

export interface IProduct {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  brand?: Types.ObjectId;
  categories: Types.ObjectId[];
  description: string;
  shortDescription?: string;
  images: string[];
  colorOptions: ProductColorOption[];
  specs: ProductSpec[];
  /** Curated “essentials” / frequently-bought-with products */
  essentials: Types.ObjectId[];
  variants: ProductVariant[];
  price: number;
  mrp: number;
  stock: number;
  weightKg: number;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
  tags: string[];
  featured: boolean;
  onSale: boolean;
  openBox: boolean;
  isActive: boolean;
  seoTitle?: string;
  seoDescription?: string;
  ratingAvg: number;
  ratingCount: number;
}

const VariantSchema = new Schema(
  {
    sku: { type: String, required: true },
    name: { type: String, required: true },
    color: String,
    price: { type: Number, required: true },
    mrp: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    image: String,
  },
  { _id: false }
);

const ColorOptionSchema = new Schema(
  {
    name: { type: String, required: true },
    swatch: { type: String, default: "#888888" },
    images: [{ type: String }],
  },
  { _id: false }
);

const SpecSchema = new Schema(
  {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    brand: { type: Schema.Types.ObjectId, ref: "Brand" },
    categories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    description: { type: String, default: "" },
    shortDescription: String,
    images: [{ type: String }],
    colorOptions: { type: [ColorOptionSchema], default: [] },
    specs: { type: [SpecSchema], default: [] },
    essentials: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    variants: [VariantSchema],
    price: { type: Number, required: true },
    mrp: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    weightKg: { type: Number, default: 1 },
    lengthCm: { type: Number, default: 40 },
    breadthCm: { type: Number, default: 20 },
    heightCm: { type: Number, default: 15 },
    tags: [String],
    featured: { type: Boolean, default: false },
    onSale: { type: Boolean, default: false },
    openBox: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    seoTitle: String,
    seoDescription: String,
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ProductSchema.index({ title: "text", tags: "text", shortDescription: "text" });

export const Product: Model<IProduct> =
  (models.Product as Model<IProduct>) ||
  model<IProduct>("Product", ProductSchema);
