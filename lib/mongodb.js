import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in environment variables.");
}

// Reuse the connection across hot reloads in dev (Next.js fast refresh)
const cached = globalThis._mongooseCache ?? (globalThis._mongooseCache = { conn: null, promise: null });

export async function connectToDatabase() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands:   false,
      connectTimeoutMS: 10000,
      socketTimeoutMS:  45000,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
