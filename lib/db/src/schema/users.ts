import mongoose, { Schema, type Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: string;
  isVerified: boolean;
  otp?: string;
  otpExpiry?: Date;
  otpAttempts: number;
  ssoProvider?: string;
  ssoId?: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    phone: { type: String },
    role: { type: String, default: "customer" },
    isVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpiry: { type: Date },
    otpAttempts: { type: Number, default: 0 },
    ssoProvider: { type: String },
    ssoId: { type: String },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

export const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);
