import mongoose from "mongoose";

// Reuse the connection across hot reloads in dev (Next.js fast refresh)
const cached = globalThis._mongooseCache ?? (globalThis._mongooseCache = { conn: null, promise: null });

function getMongoConnectionString() {
  return process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGODB_URL || process.env.MONGO_URL || null;
}

function getMongoDatabaseName() {
  return process.env.MONGODB_DB || process.env.MONGO_DB || undefined;
}

export async function connectToDatabase() {
  const uri = getMongoConnectionString();

  // Graceful failure — never throw at module level (breaks Next.js build)
  if (!uri) {
    console.warn("[MongoDB] No connection string found. Checked MONGODB_URI/MONGO_URI/MONGODB_URL/MONGO_URL.");
    return null;
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const options = {
      bufferCommands: false,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      maxPoolSize: 10,
    };

    const databaseName = getMongoDatabaseName();
    const connectionOptions = databaseName ? { ...options, dbName: databaseName } : options;

    cached.promise = mongoose.connect(uri, connectionOptions)
      .then((conn) => {
        console.log(`[MongoDB] Connected to database "${conn.connection.name}"`);
        return conn;
      })
      .catch((err) => {
        // Reset promise on failure so the next request can retry
        cached.promise = null;
        console.error("[MongoDB] Connection failed:", err.message);
        return null;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
