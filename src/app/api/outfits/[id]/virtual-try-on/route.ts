// src/app/api/outfits/[id]/virtual-try-on/route.ts

import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/middleware/error-handler';
import { authenticate } from '@/lib/middleware/auth-middleware';
import { ApiResponseHandler } from '@/lib/api-response';
import { AppError } from '@/lib/middleware/error-handler';
import dbConnect from '@/lib/db/mongoose';
import Outfit from '@/lib/db/models/Outfit';
import virtualTryOnService from '@/features/outfit-builder/services/virtual-tryon.service';
import { VirtualTryOnException } from '@/features/outfit-builder/types/virtual-tryon.types';

/**
 * POST /api/outfits/[id]/virtual-try-on
 * Start virtual try-on generation for an outfit
 */
export const POST = asyncHandler(async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  console.log('[VTO API] POST request started');

  // 1. Connect to database
  await dbConnect();
  console.log('[VTO API] Database connected');

  // 2. Authenticate user
  const { user, error } = await authenticate(req);
  if (error) {
    console.error('[VTO API] Authentication failed:', error);
    return error;
  }
  console.log('[VTO API] User authenticated:', user.userId);

  // 3. Get outfit ID from params
  const { id: outfitId } = await context.params;
  console.log('[VTO API] Outfit ID:', outfitId);

  // 4. Find outfit
  const outfit = await Outfit.findOne({
    _id: outfitId,
    userId: user.userId,
    status: 'active',
  })
    .populate({
      path: 'combination.items.tops combination.items.outerwear combination.items.bottoms combination.items.footwear combination.items.accessories',
      select: 'metadata.name metadata.category imageId',
      populate: { path: 'imageId', select: 'optimizedUrl thumbnailUrl dominantColor' },
    })
    .populate({
      path: 'canvasState.items.clothItemId',
      select: 'metadata.name metadata.category imageId',
      populate: { path: 'imageId', select: 'optimizedUrl thumbnailUrl dominantColor' },
    })
    .lean()
    .exec();

  if (!outfit) {
    console.error('[VTO API] Outfit not found');
    throw new AppError('Outfit not found', 404);
  }
  console.log('[VTO API] Outfit found:', outfit._id);

  // 5. Check if outfit has preview image
  if (!outfit.previewImage?.url) {
    console.error('[VTO API] No preview image found');
    throw new AppError(
      'Outfit must have a preview image. Please save the outfit first.',
      400
    );
  }
  console.log('[VTO API] Preview image URL:', outfit.previewImage.url);

  // 6. Parse request body (optional: humanImageUrl, garmentType)
  const body = await req.json().catch(() => ({}));
  const { humanImageUrl, garmentType } = body;
  console.log('[VTO API] Request body:', { humanImageUrl, garmentType });

  // Check API key
  const apiKey = process.env.MIRAGIC_API_KEY;
  if (!apiKey) {
    console.error('[VTO API] MIRAGIC_API_KEY is not set!');
    throw new AppError('Virtual try-on service is not configured', 500);
  }
  console.log('[VTO API] API key loaded:', apiKey.substring(0, 10) + '...');

  // 7. Start virtual try-on job
  console.log('[VTO API] Starting virtual try-on service...');
  let result;
  try {
    result = await virtualTryOnService.startVirtualTryOn(
      outfit as unknown as Parameters<typeof virtualTryOnService.startVirtualTryOn>[0],
      {
        humanImageUrl,
        garmentType,
      }
    );
    console.log('[VTO API] Virtual try-on started successfully:', result);
  } catch (serviceError) {
    console.error('[VTO API] Service error:', serviceError);
    console.error('[VTO API] Service error stack:', (serviceError as Error).stack);
    
    // Handle VirtualTryOnException with user-friendly messages
    if (serviceError instanceof VirtualTryOnException) {
      const exception = serviceError as VirtualTryOnException;
      
      // Map error codes to appropriate HTTP status codes
      const statusCode = exception.code === 'RATE_LIMIT' ? 402 : 
                         exception.code === 'MISSING_PREVIEW_IMAGE' ? 400 : 500;
      
      throw new AppError(exception.message, statusCode);
    }
    
    throw serviceError;
  }

  // 8. Save job info to database (replace any existing virtualTryOn data for retry)
  console.log('[VTO API] Detecting garment type...');
  const detectedGarmentType = garmentType || virtualTryOnService.detectGarmentType(
    outfit as unknown as Parameters<typeof virtualTryOnService.detectGarmentType>[0]
  );
  console.log('[VTO API] Detected garment type:', detectedGarmentType);

  console.log('[VTO API] Updating database...');
  await Outfit.updateOne(
    { _id: outfitId },
    {
      $set: {
        virtualTryOn: {
          jobId: result.jobId,
          status: result.status,
          mode: result.mode,
          humanImageUrl: humanImageUrl || '/mannequin.png',
          garmentType: detectedGarmentType,
          createdAt: new Date(),
        },
      },
    }
  );
  console.log('[VTO API] Database updated successfully');

  // 9. Return response
  return ApiResponseHandler.success(
    {
      jobId: result.jobId,
      status: result.status,
      mode: result.mode,
    },
    'Virtual try-on started successfully'
  );
});

/**
 * GET /api/outfits/[id]/virtual-try-on
 * Check virtual try-on job status
 */
export const GET = asyncHandler(async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  // 1. Connect to database
  await dbConnect();

  // 2. Authenticate user
  const { user, error } = await authenticate(req);
  if (error) return error;

  // 3. Get outfit ID from params
  const { id: outfitId } = await context.params;

  // 4. Find outfit with virtual try-on data
  const outfit = await Outfit.findOne({
    _id: outfitId,
    userId: user.userId,
    status: 'active',
  })
    .select('virtualTryOn')
    .lean()
    .exec();

  if (!outfit) {
    throw new AppError('Outfit not found', 404);
  }

  if (!outfit.virtualTryOn) {
    throw new AppError('No virtual try-on job found for this outfit', 404);
  }

  // 5. Check if job is already completed or failed
  if (outfit.virtualTryOn.status === 'COMPLETED' || outfit.virtualTryOn.status === 'FAILED') {
    return ApiResponseHandler.success(outfit.virtualTryOn, 'Virtual try-on job status');
  }

  // 6. Job is still pending, check status with Miragic API
  try {
    const result = await virtualTryOnService.checkJobStatus(outfit.virtualTryOn.jobId);

    // 7. Update database with new status
    const updateData: Record<string, unknown> = {
      'virtualTryOn.status': result.status,
    };

    if (result.status === 'COMPLETED' && result.resultUrl) {
      updateData['virtualTryOn.resultUrl'] = result.resultUrl;
      updateData['virtualTryOn.completedAt'] = result.completedAt || new Date();
    } else if (result.status === 'FAILED' && result.errorMessage) {
      updateData['virtualTryOn.errorMessage'] = result.errorMessage;
      updateData['virtualTryOn.completedAt'] = new Date();
    }

    await Outfit.updateOne(
      { _id: outfitId },
      { $set: updateData }
    );

    // 8. Return updated status
    return ApiResponseHandler.success(
      {
        jobId: result.jobId,
        status: result.status,
        mode: result.mode,
        resultUrl: result.resultUrl,
        errorMessage: result.errorMessage,
        completedAt: result.completedAt,
      },
      'Virtual try-on job status'
    );
  } catch (error) {
    console.error('Error checking virtual try-on status:', error);

    // Return current database status even if API check fails
    return ApiResponseHandler.success(
      outfit.virtualTryOn,
      'Virtual try-on job status (cached)'
    );
  }
});
