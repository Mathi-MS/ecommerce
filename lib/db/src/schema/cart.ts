import mongoose, { Schema, type Document } from "mongoose";

export interface ICartItem extends Document {
  sessionId: string;
  productId: mongoose.Types.ObjectId;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    sessionId: { type: String, required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export const CartItem = mongoose.models.CartItem || mongoose.model<ICartItem>("CartItem", cartItemSchema);
