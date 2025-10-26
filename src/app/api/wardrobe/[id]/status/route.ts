// src/app/api/wardrobe/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { authenticate } from "@/lib/middleware/auth-middleware";
import { asyncHandler } from "@/lib/middleware/error-handler";
import { ApiResponseHandler } from "@/lib/api-response";
import dbConnect from "@/lib/db/mongoose";
import Image from "@/lib/db/models/Image";

/* ------------------------------------------------------------------ */
/*  GET – Retrieve image processing status                            */
/* ------------------------------------------------------------------ */
/**
 * GET /api/wardrobe/:id/status
 * 
 * Retrieve the processing status of an uploaded image
 * 
 * Response:
 * - 200: Processing status information
 * - 400: Invalid image ID
 * - 401: Not authenticated
 * - 404: Image not found
 */
export const GET = asyncHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ): Promise<NextResponse> => {
    /* 1. Authenticate */
    const { user, error } = await authenticate(req);
    if (error || !user) return error;

    /* 2. Await params and validate ObjectId */
    const { id: imageId } = await params;
    if (!Types.ObjectId.isValid(imageId)) {
      return ApiResponseHandler.badRequest("Invalid image ID");
    }

    /* 3. Database query with ownership check */
    await dbConnect();

    const image = await Image.findOne({
      _id: imageId,
      userId: user.userId, // Ownership check
    })
      .select('processingStatus dominantColor colors width height size originalUrl optimizedUrl thumbnailUrl')
      .lean()
      .exec();

    if (!image) {
      return ApiResponseHandler.notFound("Image not found");
    }

    /* 4. Calculate progress based on processing status */
    let progress = 0;
    let currentStep = 'upload';

    switch (image.processingStatus) {
      case 'pending':
        progress = 10;
        currentStep = 'pending';
        break;
      case 'processing':
        progress = 50;
        currentStep = 'background-removal';
        break;
      case 'completed':
        progress = 100;
        currentStep = 'completed';
        break;
      case 'failed':
        progress = 0;
        currentStep = 'failed';
        break;
    }

    /* 5. Return processing status */
    return ApiResponseHandler.success(
      {
        imageId: image._id.toString(),
        status: image.processingStatus,
        currentStep,
        progress,
        dominantColor: image.dominantColor,
        colors: image.colors,
        urls: {
          original: image.originalUrl,
          optimized: image.optimizedUrl,
          thumbnail: image.thumbnailUrl,
        },
      },
      "Processing status retrieved successfully"
    );
  }
);
