import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!MONGODB_URI) {
  console.error("MONGODB_URI or DATABASE_URL must be set.");
  throw new Error("MONGODB_URI or DATABASE_URL must be set.");
}

let connected = false;

export async function connectDB() {
  if (connected) return;
  
  try {
    await mongoose.connect(MONGODB_URI!, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    connected = true;
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

export { mongoose };
export * from "./schema/index.js";