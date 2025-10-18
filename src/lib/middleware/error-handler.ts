// src/lib/middleware/error-handler.ts
import { NextResponse } from "next/server";
import z, { ZodError } from "zod";
import { logger } from "../logger";
import { ApiResponseHandler } from "../api-response";

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Extract field name from MongoDB duplicate key error
 */
function extractDuplicateField(error: Error & { keyPattern?: Record<string, number> }): string | null {
  if (error.keyPattern) {
    const field = Object.keys(error.keyPattern)[0];
    return field || null;
  }
  return null;
}

/**
 * Handle MongoDB errors
 */
function handleMongoError(error: Error & { code?: number | string; keyPattern?: Record<string, number> }): NextResponse {
  const errorCode = error.code?.toString();

  // Duplicate key error
  if (errorCode === "11000") {
    const field = extractDuplicateField(error);
    const message = field
      ? `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
      : "Resource already exists";

    logger.warn("MongoDB duplicate key error", { field, error: error.message });

    return ApiResponseHandler.error(message, 409, "DUPLICATE_KEY", { field });
  }

  // Validation error
  if (error.name === "ValidationError") {
    logger.warn("MongoDB validation error", { error: error.message });
    return ApiResponseHandler.error("Validation failed", 400, "VALIDATION_ERROR", error.message);
  }

  // Cast error (invalid ObjectId)
  if (error.name === "CastError") {
    logger.warn("MongoDB cast error", { error: error.message });
    return ApiResponseHandler.error("Invalid ID format", 400, "INVALID_ID");
  }

  // Default MongoDB error
  logger.error("MongoDB error", error);
  return ApiResponseHandler.error("Database error occurred", 500, "DATABASE_ERROR");
}

/**
 * Handle Zod validation errors
 */
function handleZodError(error: ZodError): NextResponse {
  const errors = z.flattenError(error)
  logger.warn("Zod validation error", { errors });

  return ApiResponseHandler.error(
    "Validation failed",
    422,
    "VALIDATION_ERROR",
    errors
  );
}

/**
 * Handle JWT errors
 */
function handleJWTError(error: Error): NextResponse {
  if (error.message === "Token expired") {
    logger.warn("JWT token expired");
    return ApiResponseHandler.error("Token expired, please login again", 401, "TOKEN_EXPIRED");
  }

  if (error.message === "Invalid token") {
    logger.warn("Invalid JWT token");
    return ApiResponseHandler.error("Invalid token", 401, "INVALID_TOKEN");
  }

  logger.error("JWT error", error);
  return ApiResponseHandler.error("Authentication failed", 401, "AUTH_ERROR");
}

/**
 * Main error handler
 * Catches all errors and returns appropriate response
 * 
 * Usage in API routes:
 * ```typescript
 * export async function GET(req: NextRequest) {
 *   try {
 *     // ... your code
 *   } catch (error) {
 *     return handleError(error);
 *   }
 * }
 * ```
 */
export function handleError(error: unknown): NextResponse {
  // Log error for debugging
  logger.error("Error caught by handler", error);

  // Handle custom AppError
  if (error instanceof AppError) {
    logger.warn("Application error", {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
    });

    return ApiResponseHandler.error(
      error.message,
      error.statusCode,
      error.code,
      error.details
    );
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return handleZodError(error);
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    // JWT errors
    if (
      error.message.includes("Token expired") ||
      error.message.includes("Invalid token") ||
      error.message.includes("jwt")
    ) {
      return handleJWTError(error);
    }

    // MongoDB errors
    if (
      "code" in error ||
      error.name === "ValidationError" ||
      error.name === "CastError" ||
      error.name === "MongoError"
    ) {
      return handleMongoError(error as Error & { code?: number | string; keyPattern?: Record<string, number> });
    }

    // Generic error with message
    logger.error("Unhandled error", error);
    return ApiResponseHandler.error(
      process.env.NODE_ENV === "production"
        ? "An error occurred"
        : error.message,
      500,
      "INTERNAL_ERROR"
    );
  }

  // Unknown error type
  logger.error("Unknown error type", { error });
  return ApiResponseHandler.error(
    "An unexpected error occurred",
    500,
    "UNKNOWN_ERROR"
  );
}

/**
 * Async error wrapper for API routes
 * Automatically catches errors and handles them
 * 
 * Usage:
 * ```typescript
 * export const GET = asyncHandler(async (req: NextRequest) => {
 *   // No need for try-catch, errors are caught automatically
 *   const user = await authenticate(req);
 *   const data = await fetchData();
 *   return apiSuccess(data);
 * });
 * ```
 */
export function asyncHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleError(error);
    }
  };
}

/**
 * Throw custom application error
 * Usage:
 * ```typescript
 * if (!user) {
 *   throw new AppError("User not found", 404, "USER_NOT_FOUND");
 * }
 * ```
 */
export { AppError as throwError };

/**
 * Assert condition or throw error
 * Usage:
 * ```typescript
 * assertExists(user, "User not found", 404);
 * // If user is null/undefined, throws AppError
 * ```
 */
export function assertExists<T>(
  value: T | null | undefined,
  message: string,
  statusCode: number = 404,
  code?: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new AppError(message, statusCode, code);
  }
}

/**
 * Assert condition is true or throw error
 * Usage:
 * ```typescript
 * assertTrue(isOwner(user, resource.userId), "Access denied", 403);
 * ```
 */
export function assertTrue(
  condition: boolean,
  message: string,
  statusCode: number = 400,
  code?: string
): asserts condition {
  if (!condition) {
    throw new AppError(message, statusCode, code);
  }
}