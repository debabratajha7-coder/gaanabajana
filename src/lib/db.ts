import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

global.mongooseCache = cached;

const CONNECT_ATTEMPTS = 4;
const BACKOFF_MS = [400, 900, 1600, 2400];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Drop cached connection so the next connectDB() opens a fresh one. */
export function resetDBCache() {
  cached.conn = null;
  cached.promise = null;
}

function isConnected() {
  return mongoose.connection.readyState === 1;
}

async function connectOnce() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
  }

  if (cached.conn && isConnected()) {
    return cached.conn;
  }

  if (cached.conn && !isConnected()) {
    resetDBCache();
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 5,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 12_000,
      socketTimeoutMS: 25_000,
      // Atlas free tier often pauses; give cold wake a bit more room.
      connectTimeoutMS: 12_000,
    });
  }

  try {
    cached.conn = await cached.promise;
    if (!isConnected()) {
      resetDBCache();
      throw new Error("MongoDB connected but not ready");
    }
    return cached.conn;
  } catch (err) {
    resetDBCache();
    throw err;
  }
}

export async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < CONNECT_ATTEMPTS; attempt++) {
    try {
      return await connectOnce();
    } catch (err) {
      lastError = err;
      if (attempt < CONNECT_ATTEMPTS - 1) {
        await sleep(BACKOFF_MS[attempt] ?? 1000);
      }
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("MongoDB connection failed");
}

/** True for timeouts / dropped sockets that often succeed on retry. */
export function isTransientDbError(err: unknown) {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : String(err);
  const name = err instanceof Error ? err.name : "";
  return /timed out|timeout|ECONNREFUSED|ENOTFOUND|ECONNRESET|not connected|buffering timed out|ServerSelectionError|MongoNetworkError|MongoServerSelectionError|topology|closed|PoolCleared|MongoExpiredSessionError|not master|please retry|TransientTransactionError/i.test(
    `${name} ${msg}`
  );
}

/**
 * Run a catalog query with connect + a few retries.
 * Cuts down on the storefront "Taking a moment…" screen during Atlas wakeups.
 */
export async function withDbRetry<T>(
  label: string,
  fn: () => Promise<T>,
  attempts = 3
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      if (i > 0) {
        resetDBCache();
        await sleep(BACKOFF_MS[i - 1] ?? 1000);
      }
      await connectDB();
      return await fn();
    } catch (err) {
      lastError = err;
      console.error(`${label} attempt ${i + 1}/${attempts}`, err);
      if (!isTransientDbError(err) && i >= 1) break;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(`${label} failed`);
}
