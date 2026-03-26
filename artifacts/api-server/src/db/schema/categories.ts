import mongoose, { Schema, type Document } from "mongoose";

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  createdAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    imageUrl: { type: String },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

export const Category = mongoose.models.Category || mongoose.model<ICategory>("Category", categorySchema);