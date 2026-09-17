import { Schema, models, model, Types } from "mongoose";

export type Address = {
  _id?: Types.ObjectId;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault?: boolean;
};

export type AdminPermissionKey =
  | "dashboard"
  | "products"
  | "orders"
  | "catalog"
  | "website"
  | "blog"
  | "reviews"
  | "media"
  | "users";

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  authProvider: "local" | "google";
  role: "customer" | "admin";
  isSuperAdmin?: boolean;
  adminPermissions?: AdminPermissionKey[];
  phone?: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  isActive?: boolean;
  wishlist: Types.ObjectId[];
  addresses: Address[];
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema(
  {
    label: { type: String, default: "Home" },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: "India" },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: false },
    googleId: { type: String, sparse: true, unique: true },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    isSuperAdmin: { type: Boolean, default: false },
    adminPermissions: { type: [String], default: [] },
    phone: { type: String, sparse: true, unique: true },
    phoneVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    wishlist: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    addresses: [AddressSchema],
  },
  { timestamps: true }
);

export const User = models.User || model<IUser>("User", UserSchema);
