import mongoose, { Schema, type Document } from "mongoose";

export interface IReferralCode extends Document {
  code: string;
  couponName: string;
  discountPercent: number;
  discountAmount?: number;
  isActive: boolean;
  usageCount: number;
  maxUsage?: number;
  productIds: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const referralCodeSchema = new Schema<IReferralCode>(
  {
    code: { type: String, required: true, unique: true },
    couponName: { type: String, required: true },
    discountPercent: { type: Number, required: true },
    discountAmount: { type: Number },
    isActive: { type: Boolean, default: true },
    usageCount: { type: Number, default: 0 },
    maxUsage: { type: Number },
    productIds: { type: [Schema.Types.ObjectId], ref: "Product", default: [] },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

export const ReferralCode = mongoose.models.ReferralCode || mongoose.model<IReferralCode>("ReferralCode", referralCodeSchema);