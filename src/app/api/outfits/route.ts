// src/app/api/outfits/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Types } from 'mongoose';
import Outfit from '@/lib/db/models/Outfit';
import Cloth from '@/lib/db/models/Cloth';
import dbConnect from '@/lib/db/mongoose';
import { ApiResponseHandler } from '@/lib/api-response';
import { authenticate } from '@/lib/middleware/auth-middleware';
import { asyncHandler } from '@/lib/middleware/error-handler';
import { outfitQuerySchema, createOutfitSchema } from '@/features/outfit-builder/validations/outfit.schema';

// ============================================================================
// GET /api/outfits - Get all outfits for a user
// ============================================================================

export const GET = asyncHandler(
  async (req: NextRequest): Promise<NextResponse> => {
    // Authenticate user
    const { user, error } = await authenticate(req);
    if (error || !user) {
      return error;
    }

    const userId = user.userId;

    // Connect to database
    await dbConnect();

    // Parse and validate query parameters
    const { searchParams } = new URL(req.url);
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    let validatedParams;
    try {
      validatedParams = outfitQuerySchema.parse(params);
    } catch (error) {
      if (error instanceof ZodError) {
        return ApiResponseHandler.badRequest(
          'Invalid query parameters',
          error.issues
        );
      }
      throw error;
    }

    const {
      mode,
      favorite,
      tags,
      season,
      status,
      skip = '0',
      limit = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = validatedParams;

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {
      userId,
      status: status || 'active',
    };

    if (mode) {
      query.mode = mode;
    }
    if (favorite === 'true') {
      query['usage.favorite'] = true;
    }
    if (tags) {
      query['metadata.tags'] = { $in: tags.split(',') };
    }
    if (season) {
      query['metadata.season'] = { $in: season.split(',') };
    }

    // Pagination
    const skipNum = typeof skip === 'number' ? skip : parseInt(skip);
    const limitNum = Math.min(typeof limit === 'number' ? limit : parseInt(limit), 100);

    // Sorting
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sort: Record<string, any> = {};
    if (sortBy === 'name') {
      sort['metadata.name'] = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'wearCount') {
      sort['usage.wearCount'] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }

    // Execute query
    const outfits = await Outfit.find(query)
      .sort(sort)
      .skip(skipNum)
      .limit(limitNum)
      .populate({
        path: 'combination.items.tops combination.items.outerwear combination.items.bottoms combination.items.footwear combination.items.accessories',
        select: 'metadata imageId category',
        populate: {
          path: 'imageId',
          select: 'thumbnailUrl optimizedUrl',
        },
      })
      .lean();
    
    // Manually populate canvas items for all outfits
    for (const outfit of outfits) {
      if (outfit.canvasState?.items) {
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
    }

    // FIX #5: Get total count for pagination
    const total = await Outfit.countDocuments(query);

    return ApiResponseHandler.success({
      outfits,
      pagination: {
        total,
        skip: skipNum,
        limit: limitNum,
        hasMore: skipNum + outfits.length < total,
      },
    });
  }
);

// ============================================================================
// POST /api/outfits - Create a new outfit
// ============================================================================

export const POST = asyncHandler(
  async (req: NextRequest): Promise<NextResponse> => {
    // Authenticate user
    const { user, error } = await authenticate(req);
    if (error || !user) {
      return error;
    }

    const userId = user.userId;

    // Connect to database
    await dbConnect();

    // Parse and validate request body
    const body = await req.json();
    
    let validatedBody;
    try {
      validatedBody = createOutfitSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        return ApiResponseHandler.badRequest(
          'Invalid request body',
          error.issues
        );
      }
      throw error;
    }

    const { mode, metadata, combination, canvasState, previewImage, composition } = validatedBody;

    // FIX #6: Validate that all referenced clothing items exist
    const itemIds: string[] = [];
    
    if (combination) {
      const { tops, outerwear, bottoms, footwear, accessories } = combination.items;
      if (tops) itemIds.push(tops);
      if (outerwear) itemIds.push(outerwear);
      if (bottoms) itemIds.push(bottoms);
      if (footwear) itemIds.push(footwear);
      if (accessories) itemIds.push(...accessories);
    }
    
    if (canvasState) {
      itemIds.push(...canvasState.items.map(item => item.clothItemId));
    }

    // Check if all items exist and belong to the user
    const existingItems = await Cloth.find({
      _id: { $in: itemIds },
      userId,
      status: 'active',
    }).select('_id');

    const existingIds = existingItems.map(item => (item._id as Types.ObjectId).toString());
    const missingIds = itemIds.filter(id => !existingIds.includes(id));

    if (missingIds.length > 0) {
      return ApiResponseHandler.badRequest('Some clothing items do not exist or are not accessible', {
        missingIds,
      });
    }

    // Create the outfit
    const outfit = new Outfit({
      userId,
      mode,
      metadata,
      combination,
      canvasState,
      previewImage,
      composition,
    });

    await outfit.save();

    // Populate clothing items for response
    await outfit.populate([
      {
        path: 'combination.items.tops combination.items.outerwear combination.items.bottoms combination.items.footwear combination.items.accessories',
        select: 'metadata imageId category',
        populate: {
          path: 'imageId',
          select: 'thumbnailUrl optimizedUrl',
        },
      }
    ]);
    
    // Manually populate canvas items
    const outfitObj = outfit.toObject();
    if (outfitObj.canvasState?.items) {
      interface CanvasItemWithId {
        clothItemId: Types.ObjectId;
        [key: string]: unknown;
      }
      
      const clothItemIds = (outfitObj.canvasState.items as CanvasItemWithId[])
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
        (outfitObj.canvasState.items as CanvasItemWithId[]) = (outfitObj.canvasState.items as CanvasItemWithId[]).map((item) => ({
          ...item,
          clothItemId: clothItemMap.get(item.clothItemId.toString()) || item.clothItemId,
        } as CanvasItemWithId));
      }
    }

    return ApiResponseHandler.created({ outfit: outfitObj });
  }
);