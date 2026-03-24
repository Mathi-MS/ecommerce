import mongoose from "mongoose";

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI must be set.");
}

let connected = false;

export async function connectDB() {
  if (connected) return;
  await mongoose.connect(process.env.MONGODB_URI!);
  connected = true;
}

export { mongoose };
export * from "./schema/index.js";
