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
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
    // Authenticate user
    const { user, error } = await authenticate(req);
    if (error || !user) {
      return error;
    }

    const userId = user.userId;
    const { id } = await params;

    // Connect to database
    await dbConnect();
    
    const outfit = await Outfit.findOne({ _id: id, userId })
      .populate({
        path: 'combination.items.tops combination.items.outerwear combination.items.bottoms combination.items.footwear combination.items.accessories',
        select: 'metadata imageId category',
        populate: {
          path: 'imageId',
          select: 'thumbnailUrl optimizedUrl',
        },
      })
      .select('-__v')
      .lean();
    
    if (!outfit) {
      return ApiResponseHandler.notFound('Outfit not found');
    }
    
    // Manually populate canvas items if they exist  
    try {
      if (outfit.canvasState?.items && Array.isArray(outfit.canvasState.items) && outfit.canvasState.items.length > 0) {
        interface CanvasItemWithId {
          clothItemId: Types.ObjectId;
          [key: string]: unknown;
        }
        
        const clothItemIds = (outfit.canvasState.items as CanvasItemWithId[])
          .map((item) => item.clothItemId)
          .filter(Boolean);
        
        if (clothItemIds.length > 0) {
          const populatedClothItems = await Cloth.find({ 
            _id: { $in: clothItemIds } 
          })
          .populate('imageId', 'thumbnailUrl optimizedUrl')
          .select('metadata imageId category')
          .lean();
          
          // Create a map for quick lookup
          const clothItemMap = new Map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            populatedClothItems.map((item: any) => [item._id.toString(), item])
          );
          
          // Replace clothItemId with populated data
          (outfit.canvasState.items as CanvasItemWithId[]) = (outfit.canvasState.items as CanvasItemWithId[]).map((item) => ({
            ...item,
            clothItemId: clothItemMap.get(item.clothItemId.toString()) || item.clothItemId,
          } as CanvasItemWithId));
        }
      }
    } catch (populateError) {
      console.error('[GET /api/outfits/[id]] Error populating canvas items:', populateError);
      // Continue without populated canvas items rather than failing the whole request
    }
    
    return ApiResponseHandler.success(outfit, 'Outfit retrieved successfully');
  }
);

// ============================================================================
// PATCH /api/outfits/[id] - Update outfit
// ============================================================================

export const PATCH = asyncHandler(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
    // Authenticate user
    const { user, error } = await authenticate(req);
    if (error || !user) {
      return error;
    }

    const userId = user.userId;
    const { id } = await params;

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
        path: 'combination.items.tops combination.items.outerwear combination.items.bottoms combination.items.footwear combination.items.accessories',
        select: 'metadata imageId category',
        populate: {
          path: 'imageId',
          select: 'thumbnailUrl optimizedUrl',
        },
      })
      .select('-__v')
      .lean();
    
    if (!outfit) {
      return ApiResponseHandler.notFound('Outfit not found');
    }
    
    // Manually populate canvas items if they exist
    try {
      if (outfit.canvasState?.items && Array.isArray(outfit.canvasState.items) && outfit.canvasState.items.length > 0) {
        interface CanvasItemWithId {
          clothItemId: Types.ObjectId;
          [key: string]: unknown;
        }
        
        const clothItemIds = (outfit.canvasState.items as CanvasItemWithId[])
          .map((item) => item.clothItemId)
          .filter(Boolean);
        
        if (clothItemIds.length > 0) {
          const populatedClothItems = await Cloth.find({ 
            _id: { $in: clothItemIds } 
          })
          .populate('imageId', 'thumbnailUrl optimizedUrl')
          .select('metadata imageId category')
          .lean();
          
          // Create a map for quick lookup
          const clothItemMap = new Map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            populatedClothItems.map((item: any) => [item._id.toString(), item])
          );
          
          // Replace clothItemId with populated data
          (outfit.canvasState.items as CanvasItemWithId[]) = (outfit.canvasState.items as CanvasItemWithId[]).map((item) => ({
            ...item,
            clothItemId: clothItemMap.get(item.clothItemId.toString()) || item.clothItemId,
          } as CanvasItemWithId));
        }
      }
    } catch (populateError) {
      console.error('[PATCH /api/outfits/[id]] Error populating canvas items:', populateError);
      // Continue without populated canvas items rather than failing the whole request
    }
    
    return ApiResponseHandler.success(outfit, 'Outfit updated successfully');
  }
);

// ============================================================================
// DELETE /api/outfits/[id] - Soft delete outfit
// ============================================================================

export const DELETE = asyncHandler(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
    // Authenticate user
    const { user, error } = await authenticate(req);
    if (error || !user) {
      return error;
    }

    const userId = user.userId;
    const { id } = await params;

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