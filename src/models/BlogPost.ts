import { Schema, models, model, Types } from "mongoose";

export interface IBlogPost {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverImage?: string;
  published: boolean;
  publishedAt?: Date;
}

const BlogPostSchema = new Schema<IBlogPost>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, default: "" },
    body: { type: String, default: "" },
    coverImage: String,
    published: { type: Boolean, default: false },
    publishedAt: Date,
  },
  { timestamps: true }
);

export const BlogPost = models.BlogPost || model<IBlogPost>("BlogPost", BlogPostSchema);
