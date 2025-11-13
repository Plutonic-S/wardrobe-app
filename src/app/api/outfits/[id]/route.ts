// src/app/api/outfits/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Types } from 'mongoose';
import Outfit from '@/lib/db/models/Outfit';
import Cloth from '@/lib/db/models/Cloth';
import dbConnect from '@/lib/db/mongoose';
import { ApiResponseHandler } from '@/lib/api-response';
import { authenticate } from '@/lib/middleware/auth-middleware';
import { asyncHandler } from '@/lib/middleware/error-handler';
import { updateOutfitSchema } from '@/features/outfit-builder/validations/outfit.schema';

// ============================================================================
// GET /api/outfits/[id] - Get single outfit
// ============================================================================

export const GET = asyncHandler(
  async (req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> => {
    // Authenticate user
    const { user, error } = await authenticate(req);
    if (error || !user) {
      return error;
    }

    const userId = user.userId;
    const { id } = params;

    // Connect to database
    await dbConnect();
    
    const outfit = await Outfit.findOne({ _id: id, userId })
      .populate({
        path: 'combination.items.tops combination.items.outerwear combination.items.bottoms combination.items.footwear',
        select: 'metadata.name metadata.category imageId',
        populate: { path: 'imageId', select: 'thumbnailUrl dominantColor' },
      })
      .populate({
        path: 'combination.items.accessories',
        select: 'metadata.name metadata.category imageId',
        populate: { path: 'imageId', select: 'thumbnailUrl dominantColor' },
      })
      .populate({
        path: 'canvasState.items.clothItemId',
        select: 'metadata.name metadata.category imageId',
        populate: { path: 'imageId', select: 'thumbnailUrl dominantColor' },
      })
      .select('-__v')
      .lean();
    
    if (!outfit) {
      return ApiResponseHandler.notFound('Outfit not found');
    }
    
    return ApiResponseHandler.success(outfit, 'Outfit retrieved successfully');
  }
);

// ============================================================================
// PATCH /api/outfits/[id] - Update outfit
// ============================================================================

export const PATCH = asyncHandler(
  async (req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> => {
    // Authenticate user
    const { user, error } = await authenticate(req);
    if (error || !user) {
      return error;
    }

    const userId = user.userId;
    const { id } = params;

    // Connect to database
    await dbConnect();

    // Parse and validate request body
    const body = await req.json();
    
    let validatedBody;
    try {
      validatedBody = updateOutfitSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        return ApiResponseHandler.badRequest(
          'Invalid request body',
          error.issues
        );
      }
      throw error;
    }
    
    const updates = validatedBody;
    
    // Validate referenced clothing items if updating combination or canvasState
    if (updates.combination || updates.canvasState) {
      const itemIds: string[] = [];
      
      if (updates.combination) {
        const { tops, outerwear, bottoms, footwear, accessories } = updates.combination.items;
        if (tops) itemIds.push(tops);
        if (outerwear) itemIds.push(outerwear);
        if (bottoms) itemIds.push(bottoms);
        if (footwear) itemIds.push(footwear);
        if (accessories) itemIds.push(...accessories);
      }
      
      if (updates.canvasState) {
        itemIds.push(...updates.canvasState.items.map(item => item.clothItemId));
      }
      
      // Check if items exist and belong to user
      if (itemIds.length > 0) {
        const existingItems = await Cloth.find({
          _id: { $in: itemIds },
          userId,
          status: 'active',
        }).select('_id');
        
        const existingIds = existingItems.map(item => (item._id as Types.ObjectId).toString());
        const invalidIds = itemIds.filter(id => !existingIds.includes(id));
        
        if (invalidIds.length > 0) {
          return ApiResponseHandler.badRequest(
            'Some clothing items do not exist or are not accessible',
            { invalidIds }
          );
        }
      }
    }
    
    // Find and update outfit
    const outfit = await Outfit.findOneAndUpdate(
      { _id: id, userId },
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate({
        path: 'combination.items.tops combination.items.outerwear combination.items.bottoms combination.items.footwear',
        select: 'metadata.name metadata.category imageId',
        populate: { path: 'imageId', select: 'thumbnailUrl dominantColor' },
      })
      .populate({
        path: 'combination.items.accessories',
        select: 'metadata.name metadata.category imageId',
        populate: { path: 'imageId', select: 'thumbnailUrl dominantColor' },
      })
      .populate({
        path: 'canvasState.items.clothItemId',
        select: 'metadata.name metadata.category imageId',
        populate: { path: 'imageId', select: 'thumbnailUrl dominantColor' },
      })
      .select('-__v')
      .lean();
    
    if (!outfit) {
      return ApiResponseHandler.notFound('Outfit not found');
    }
    
    return ApiResponseHandler.success(outfit, 'Outfit updated successfully');
  }
);

// ============================================================================
// DELETE /api/outfits/[id] - Soft delete outfit
// ============================================================================

export const DELETE = asyncHandler(
  async (req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> => {
    // Authenticate user
    const { user, error } = await authenticate(req);
    if (error || !user) {
      return error;
    }

    const userId = user.userId;
    const { id } = params;

    // Connect to database
    await dbConnect();
    
    // Soft delete (set status to 'deleted')
    const outfit = await Outfit.findOneAndUpdate(
      { _id: id, userId },
      { $set: { status: 'deleted' } },
      { new: true }
    )
      .select('_id metadata.name status')
      .lean();
    
    if (!outfit) {
      return ApiResponseHandler.notFound('Outfit not found');
    }
    
    return ApiResponseHandler.success(outfit, 'Outfit deleted successfully');
  }
);