import { Schema, models, model, Types } from "mongoose";

export interface IPageContent {
  _id: Types.ObjectId;
  key: string;
  title: string;
  body: string;
  meta?: Record<string, string>;
}

const PageContentSchema = new Schema<IPageContent>(
  {
    key: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    meta: { type: Map, of: String },
  },
  { timestamps: true }
);

export const PageContent =
  models.PageContent || model<IPageContent>("PageContent", PageContentSchema);
