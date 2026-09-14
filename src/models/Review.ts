import { Schema, models, model, Types } from "mongoose";

export interface IReview {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  user?: Types.ObjectId;
  /** Display name when admin writes a review without a real customer account */
  authorName?: string;
  rating: number;
  title?: string;
  body: string;
  approved: boolean;
}

const ReviewSchema = new Schema<IReview>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: false },
    authorName: { type: String, trim: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    title: String,
    body: { type: String, required: true },
    approved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One real-user review per product; admin-authored (no user) can be many
ReviewSchema.index(
  { product: 1, user: 1 },
  {
    unique: true,
    partialFilterExpression: { user: { $type: "objectId" } },
  }
);

export const Review = models.Review || model<IReview>("Review", ReviewSchema);
