/*
File: src/app/api/wardrobe/upload/route.ts

Method: POST
Body: multipart/form-data with image file
Auth: Required
Process:
Validate file (type, size)
Save to temporary directory
Call Python script for background removal
Optimize with Sharp
Generate thumbnail
Extract colors
Save to storage
Create ClothingItem in database
Return item data
Response: Created clothing item with URLs

*/

import { ImageProcessingService } from "@/features/wardrobe/services/image-processing.service";
import { ApiResponseHandler } from "@/lib/api-response";
import { authenticate } from "@/lib/middleware/auth-middleware";
import { asyncHandler } from "@/lib/middleware/error-handler";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

// Configuration
const CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: ["image/jpeg", "image/png", "image/webp", "image/jpg"],
};

export const POST = asyncHandler(
  async (req: NextRequest): Promise<NextResponse> => {
    // 1. Validate Content-Type (must be multipart/form-data)
    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return ApiResponseHandler.badRequest(
        "Content-Type must be multipart/form-data"
      );
    }

    // 2. Authenticate user
    const { user, error } = await authenticate(req);
    if (error || !user) {
      return error; // Return 401 if not authenticated
    }

    // 3. Extract and validate file from form data
    const formData = await req.formData();
    const file = formData.get("file");

    // Check file exists and is actually a File instance
    if (!file || !(file instanceof File)) {
      return ApiResponseHandler.badRequest(
        "Missing or invalid file field"
      );
    }

    // 4. Validate file type
    if (!CONFIG.ALLOWED_MIME_TYPES.includes(file.type)) {
      return ApiResponseHandler.badRequest(
        `Invalid file type. Allowed types: ${CONFIG.ALLOWED_MIME_TYPES.join(", ")}`
      );
    }

    // 5. Validate file size
    if (file.size > CONFIG.MAX_FILE_SIZE) {
      return ApiResponseHandler.badRequest(
        `File too large. Maximum size: ${CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`
      );
    }

    // 6. Process image with timeout protection
    let result: Awaited<
      ReturnType<typeof ImageProcessingService.uploadAndProcess>
    >;

    try {
      // Race between processing and timeout (30 seconds)
      result = await Promise.race([
        ImageProcessingService.uploadAndProcess({
          userId: user.userId,
          file,
          originalFilename: file.name || `${randomUUID()}.png`,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Processing timeout (30s)")),
            30000
          )
        ),
      ]);
    } catch (error) {
      // Handle timeout or processing errors
      const message =
        error instanceof Error ? error.message : "Processing failed";
      return ApiResponseHandler.error(message, 500);
    }

    // 7. Check if processing was successful
    if (!result.success || !result.image) {
      return ApiResponseHandler.error(
        result.error || "Image processing failed",
        500
      );
    }

    // 8. Return the image record (processing will continue in background)
    return ApiResponseHandler.success(
      {
        imageId: result.image.id,
        originalUrl: result.image.originalUrl,
        processingStatus: result.image.processingStatus,
        message:
          "Image uploaded successfully. Processing in background (background removal, optimization, thumbnail generation, color extraction).",
      },
      "Image uploaded and processing started",
      201
    );
  }
);
