import { Schema, models, model, Types } from "mongoose";

export type OrderItem = {
  product: Types.ObjectId;
  title: string;
  slug: string;
  image?: string;
  variantName?: string;
  sku?: string;
  price: number;
  qty: number;
  weightKg: number;
};

export type OrderAddress = {
  fullName: string;
  phone: string;
  email: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

export interface IOrder {
  _id: Types.ObjectId;
  orderNumber: string;
  user?: Types.ObjectId;
  items: OrderItem[];
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  currency: string;
  paymentMethod: "prepaid";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  status:
    | "pending_payment"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  phonepeMerchantOrderId?: string;
  phonepeOrderId?: string;
  phonepeTransactionId?: string;
  shiprocketOrderId?: string;
  shiprocketShipmentId?: string;
  awb?: string;
  trackingUrl?: string;
  note?: string;
  timeline: { status: string; at: Date; note?: string }[];
}

const OrderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    title: String,
    slug: String,
    image: String,
    variantName: String,
    sku: String,
    price: Number,
    qty: Number,
    weightKg: Number,
  },
  { _id: false }
);

const AddressSchema = new Schema(
  {
    fullName: String,
    phone: String,
    email: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: "India" },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    items: [OrderItemSchema],
    shippingAddress: AddressSchema,
    billingAddress: AddressSchema,
    subtotal: Number,
    shippingFee: Number,
    discount: { type: Number, default: 0 },
    total: Number,
    currency: { type: String, default: "INR" },
    paymentMethod: { type: String, default: "prepaid" },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    status: {
      type: String,
      enum: [
        "pending_payment",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending_payment",
    },
    phonepeMerchantOrderId: String,
    phonepeOrderId: String,
    phonepeTransactionId: String,
    shiprocketOrderId: String,
    shiprocketShipmentId: String,
    awb: String,
    trackingUrl: String,
    note: String,
    timeline: [
      {
        status: String,
        at: { type: Date, default: Date.now },
        note: String,
      },
    ],
  },
  { timestamps: true }
);

export const Order = models.Order || model<IOrder>("Order", OrderSchema);
