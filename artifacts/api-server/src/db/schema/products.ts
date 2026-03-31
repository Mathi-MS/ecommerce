import mongoose, { Schema, type Document } from "mongoose";

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  discountPrice?: number;
  categoryId?: mongoose.Types.ObjectId;
  categoryIds: mongoose.Types.ObjectId[];
  mainImage: string;
  images: string[];
  stock: number;
  order: number;
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
    categoryIds: { type: [Schema.Types.ObjectId], ref: "Category", default: [] },
    mainImage: { type: String, default: "" },
    images: { type: [String], default: [] },
    stock: { type: Number, default: 0 },
    order: { type: Number, default: 0 },

    referralCode: { type: String },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

export const Product = mongoose.models.Product || mongoose.model<IProduct>("Product", productSchema);