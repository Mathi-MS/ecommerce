import mongoose, { Schema, type Document } from "mongoose";

export interface IBanner extends Document {
  title: string;
  subtitle?: string;
  description: string;
  imageUrl: string;
  button1Text?: string;
  button1Link?: string;
  button2Text?: string;
  button2Link?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
}

const bannerSchema = new Schema<IBanner>(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    button1Text: { type: String },
    button1Link: { type: String },
    button2Text: { type: String },
    button2Link: { type: String },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

export const Banner = mongoose.models.Banner || mongoose.model<IBanner>("Banner", bannerSchema);