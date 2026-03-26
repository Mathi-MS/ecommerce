import mongoose, { Schema, type Document } from "mongoose";

export interface IFaq extends Document {
  question: string;
  answer: string;
  order: number;
  createdAt: Date;
}

const faqSchema = new Schema<IFaq>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

export const Faq = mongoose.models.Faq || mongoose.model<IFaq>("Faq", faqSchema);