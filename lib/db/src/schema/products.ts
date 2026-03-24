import mongoose, { Schema, type Document } from "mongoose";

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  discountPrice?: number;
  categoryId?: mongoose.Types.ObjectId;
  images: string[];
  stock: number;
  featured: boolean;
  referralCode?: string;
  createdAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    shortDescription: { type: String, required: true },
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
    images: { type: [String], default: [] },
    stock: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    referralCode: { type: String },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

export const Product = mongoose.models.Product || mongoose.model<IProduct>("Product", productSchema);
