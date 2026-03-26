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
    phone: { type: String, sparse: true }, // sparse index allows multiple null values
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

// Create sparse index for phone to allow multiple null values but ensure uniqueness for non-null values
userSchema.index({ phone: 1 }, { sparse: true, unique: true });

// Migration function to fix existing database
async function migratePhoneIndex() {
  try {
    const db = mongoose.connection.db;
    if (!db) return;
    
    // Drop existing phone index if it exists
    try {
      await db.collection('users').dropIndex('phone_1');
      console.log('Dropped existing phone index');
    } catch (error) {
      // Index might not exist, that's okay
      console.log('No existing phone index to drop');
    }
    
    // Create new sparse unique index
    await db.collection('users').createIndex(
      { phone: 1 }, 
      { sparse: true, unique: true, name: 'phone_1_sparse' }
    );
    console.log('Created sparse phone index');
  } catch (error) {
    console.error('Phone index migration failed:', error);
  }
}

// Run migration when model is created
if (mongoose.connection.readyState === 1) {
  migratePhoneIndex();
} else {
  mongoose.connection.once('open', migratePhoneIndex);
}

export const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);