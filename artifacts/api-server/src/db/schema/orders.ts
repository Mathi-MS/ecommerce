import mongoose, { Schema, type Document } from "mongoose";

export interface IOrderItem extends Document {
  orderId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
}

export interface IOrder extends Document {
  userId?: mongoose.Types.ObjectId;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentId?: string;
  razorpayOrderId?: string;
  referralCode?: string;
  createdAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: { type: String, default: "pending" },
    paymentStatus: { type: String, default: "pending" },
    paymentId: { type: String },
    razorpayOrderId: { type: String },
    referralCode: { type: String },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

const orderItemSchema = new Schema<IOrderItem>({
  orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  productName: { type: String, required: true },
  productImage: { type: String, default: "" },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
});

export const Order = mongoose.models.Order || mongoose.model<IOrder>("Order", orderSchema);
export const OrderItem = mongoose.models.OrderItem || mongoose.model<IOrderItem>("OrderItem", orderItemSchema);