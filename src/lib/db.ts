import mongoose from "mongoose";

// Reuse the connection across hot reloads in dev and across serverless
// invocations so we don't open a new pool on every request.
let cached = (global as any).__mongoose;
if (!cached) {
  cached = (global as any).__mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  // Checked lazily, inside the function, instead of at module load time.
  // Next.js imports route modules during `next build` (page-data
  // collection) to inspect them, which would otherwise throw here before
  // any env var is available and before the route is ever actually
  // invoked — exactly what breaks a Vercel build without this being lazy.
  const MONGODB_URI = process.env.MONGODB_URI as string;
  if (!MONGODB_URI) {
    throw new Error("Set MONGODB_URI in your environment variables.");
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}