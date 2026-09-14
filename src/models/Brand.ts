import { Schema, models, model, Types } from "mongoose";

export interface IBrand {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  isActive: boolean;
}

const BrandSchema = new Schema<IBrand>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    logo: String,
    description: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Brand = models.Brand || model<IBrand>("Brand", BrandSchema);
