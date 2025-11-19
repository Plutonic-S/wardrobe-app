// src/app/api/upload/snapshot/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/middleware/auth-middleware';
import { ApiResponseHandler } from '@/lib/api-response';
import { asyncHandler } from '@/lib/middleware/error-handler';
import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';

// Configuration
const CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB (snapshots should be smaller)
  ALLOWED_MIME_TYPES: ['image/png', 'image/jpeg', 'image/webp'],
  UPLOAD_BASE_DIR: path.join(process.cwd(), 'public', 'uploads', 'outfits', 'snapshots'),
};

/**
 * POST /api/upload/snapshot
 * Upload outfit snapshot to Cloudinary
 */
export const POST = asyncHandler(
  async (req: NextRequest): Promise<NextResponse> => {
    // 1. Authenticate user
    const { user, error } = await authenticate(req);
    if (error || !user) {
      return error;
    }

    // 2. Validate Content-Type
    const contentType = req.headers.get('content-type') ?? '';
    if (!contentType.includes('multipart/form-data')) {
      return ApiResponseHandler.badRequest(
        'Content-Type must be multipart/form-data'
      );
    }

    // 3. Extract file from form data
    const formData = await req.formData();
    const file = formData.get('file');
    const outfitId = formData.get('outfitId') as string;

    if (!file || !(file instanceof File)) {
      return ApiResponseHandler.badRequest('Missing or invalid file field');
    }

    if (!outfitId) {
      return ApiResponseHandler.badRequest('Missing outfitId field');
    }

    // 4. Validate file type
    if (!CONFIG.ALLOWED_MIME_TYPES.includes(file.type)) {
      return ApiResponseHandler.badRequest(
        `Invalid file type. Allowed: ${CONFIG.ALLOWED_MIME_TYPES.join(', ')}`
      );
    }

    // 5. Validate file size
    if (file.size > CONFIG.MAX_FILE_SIZE) {
      return ApiResponseHandler.badRequest(
        `File too large. Maximum size: ${CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`
      );
    }

    // 6. Create directory structure
    const userDir = path.join(CONFIG.UPLOAD_BASE_DIR, user.userId);
    await fs.mkdir(userDir, { recursive: true });

    // 7. Generate unique filename
    const uniqueId = randomUUID();
    const extension = file.name.split('.').pop() || 'png';
    const filename = `${outfitId}_${Date.now()}_${uniqueId}.${extension}`;
    const filePath = path.join(userDir, filename);

    // 8. Convert File to Buffer and save
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      await fs.writeFile(filePath, buffer);

      // 9. Generate public URL
      const publicUrl = `/uploads/outfits/snapshots/${user.userId}/${filename}`;
      const publicId = `${user.userId}/${filename}`; // For deletion reference

      // 10. Return success response
      return ApiResponseHandler.created({
        url: publicUrl,
        publicId: publicId,
        width: 1000, // Standard snapshot size
        height: 1000,
      });
    } catch (saveError) {
      console.error('File save error:', saveError);
      return ApiResponseHandler.error(
        'Failed to save snapshot to storage',
        500
      );
    }
  }
);

/**
 * DELETE /api/upload/snapshot
 * Delete outfit snapshot from local storage
 */
export const DELETE = asyncHandler(
  async (req: NextRequest): Promise<NextResponse> => {
    // 1. Authenticate user
    const { user, error } = await authenticate(req);
    if (error || !user) {
      return error;
    }

    // 2. Get publicId from request body
    const body = await req.json();
    const { publicId } = body;

    if (!publicId) {
      return ApiResponseHandler.badRequest('Missing publicId field');
    }

    // 3. Delete from local storage
    try {
      const filePath = path.join(CONFIG.UPLOAD_BASE_DIR, publicId);
      await fs.unlink(filePath);

      return ApiResponseHandler.success({
        message: 'Snapshot deleted successfully',
        publicId,
      });
    } catch (deleteError) {
      console.error('File delete error:', deleteError);
      return ApiResponseHandler.error(
        'Failed to delete snapshot from storage',
        500
      );
    }
  }
);
