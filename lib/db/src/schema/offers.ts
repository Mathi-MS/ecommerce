import mongoose, { Schema, type Document } from "mongoose";

export interface IOffer extends Document {
  text: string;
  status: "active" | "inactive";
  createdAt: Date;
}

const offerSchema = new Schema<IOffer>(
  { text: { type: String, required: true }, status: { type: String, enum: ["active", "inactive"], default: "inactive" } },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

export const Offer = mongoose.models.Offer || mongoose.model<IOffer>("Offer", offerSchema);
