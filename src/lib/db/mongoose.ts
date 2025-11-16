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
      .then(async (m) => {
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

        // Eagerly import model files so they register themselves with
        // mongoose before the application executes queries that rely on
        // those models (eg. populate('imageId') -> 'Image'). Using dynamic
        // imports here keeps the codebase ES module friendly and satisfies
        // linting rules.
        try {
          // dynamic imports return promises; await them to ensure models are
          // registered before returning the connected mongoose instance.
          await import('./models/Image');
          await import('./models/Cloth');
          await import('./models/Outfit');
          await import('./models/User');
          logger.db('Registered mongoose models: Image, Cloth, Outfit, User');
        } catch (err) {
          logger.error('Failed to register mongoose models', err);
        }

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