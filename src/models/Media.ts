import { Schema, models, model, Types } from "mongoose";

export interface IMedia {
  _id: Types.ObjectId;
  publicId: string;
  url: string;
  alt?: string;
  folder?: string;
  bytes?: number;
  format?: string;
}

const MediaSchema = new Schema<IMedia>(
  {
    publicId: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    alt: String,
    folder: String,
    bytes: Number,
    format: String,
  },
  { timestamps: true }
);

export const Media = models.Media || model<IMedia>("Media", MediaSchema);
