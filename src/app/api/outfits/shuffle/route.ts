// src/app/api/outfits/shuffle/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Types } from 'mongoose';
import Cloth from '@/lib/db/models/Cloth';
import dbConnect from '@/lib/db/mongoose';
import { ApiResponseHandler } from '@/lib/api-response';
import { authenticate } from '@/lib/middleware/auth-middleware';
import { asyncHandler } from '@/lib/middleware/error-handler';
import { shuffleRequestSchema } from '@/features/outfit-builder/validations/outfit.schema';

// ============================================================================
// POST /api/outfits/shuffle - Generate random outfit combination
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
      validatedBody = shuffleRequestSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        return ApiResponseHandler.badRequest(
          'Invalid shuffle request',
          error.issues
        );
      }
      throw error;
    }
    
    const { configuration, lockedCategories, currentCombination } = validatedBody;
    
    // Determine categories based on configuration
    type CategoryType = 'tops' | 'outerwear' | 'bottoms' | 'footwear' | 'dresses' | 'accessories';
    const categoryMap: Record<string, CategoryType[]> = {
      '2-part': ['dresses', 'footwear', 'accessories'],
      '3-part': ['tops', 'bottoms', 'footwear', 'accessories'],
      '4-part': ['tops', 'outerwear', 'bottoms', 'footwear', 'accessories'],
    };
    
    const categories = categoryMap[configuration];
    const combination: Record<string, string | string[]> = currentCombination ? { ...currentCombination } : {};
    const populatedItems: Record<string, unknown> = {};
    
    // Fetch random items for unlocked categories
    for (const category of categories) {
      if (!lockedCategories.includes(category)) {
        const items = await Cloth.aggregate([
          { 
            $match: { 
              userId: new Types.ObjectId(userId),
              'metadata.category': category,
              status: 'active'
            }
          },
          { $sample: { size: category === 'accessories' ? 2 : 1 } },
        ]);
        
        if (items.length > 0) {
          if (category === 'accessories') {
            combination.accessories = items.map((item) => item._id.toString());
            populatedItems.accessories = items;
          } else {
            combination[category] = items[0]._id.toString();
            populatedItems[category] = items[0];
          }
        }
      }
    }
    
    // Populate locked items
    for (const category of lockedCategories) {
      if (currentCombination) {
        const itemId = currentCombination[category as keyof typeof currentCombination];
        if (typeof itemId === 'string') {
          const item = await Cloth.findById(itemId)
            .populate({ path: 'imageId', select: 'thumbnailUrl dominantColor' })
            .lean();
          if (item) {
            populatedItems[category] = item;
          }
        } else if (Array.isArray(itemId)) {
          // For accessories array
          const items = await Cloth.find({ _id: { $in: itemId } })
            .populate({ path: 'imageId', select: 'thumbnailUrl dominantColor' })
            .lean();
          if (items.length > 0) {
            populatedItems[category] = items;
          }
        }
      }
    }
    
    return ApiResponseHandler.success(
      { combination, items: populatedItems },
      'Outfit combination generated successfully'
    );
  }
);