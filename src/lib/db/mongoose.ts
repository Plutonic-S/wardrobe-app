import mongoose, { Mongoose } from "mongoose";
import { logger } from "../logger";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("Please add MONGODB_URI to your environment");

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

declare global {
  var __mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis.__mongooseCache ??= { 
  conn: null, 
  promise: null 
};

export default async function dbConnect(): Promise<Mongoose> {
  if (cached.conn) {
    logger.db("Using cached connection");
    return cached.conn;
  }

  if (!cached.promise) {
    logger.db("Connecting to MongoDB...");

    cached.promise = mongoose
      .connect(uri as string, { bufferCommands: false })
      .then((m) => {
        // Set up connection event handlers
        m.connection.on("connected", () => {
          logger.db("Connected successfully");
        });

        m.connection.on("error", (err) => {
          logger.error("MongoDB connection error", err);
        });

        m.connection.on("disconnected", () => {
          logger.warn("MongoDB disconnected");
        });

        // Graceful shutdown
        process.on("SIGINT", async () => {
          await m.connection.close();
          logger.db("Connection closed due to app termination");
          process.exit(0);
        });

        logger.db("Connection established", { 
          database: m.connection.name,
          host: m.connection.host 
        });
        
        return m;
      })
      .catch((err) => {
        cached.promise = null; // Reset for retry
        logger.error("Failed to connect to MongoDB", err);
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}