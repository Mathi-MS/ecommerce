import mongoose, { Schema, type Document } from "mongoose";

export interface ICartItem extends Document {
  sessionId?: string;
  userId?: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    sessionId: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, default: 1 },
  },
  { timestamps: true }
);

// Ensure either sessionId or userId is present
cartItemSchema.pre('save', function() {
  if (!this.sessionId && !this.userId) {
    throw new Error('Either sessionId or userId must be provided');
  }
});

export const CartItem = mongoose.models.CartItem || mongoose.model<ICartItem>("CartItem", cartItemSchema);
