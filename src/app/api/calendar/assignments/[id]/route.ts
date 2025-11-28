// src/app/api/calendar/assignments/[id]/route.ts

import { NextRequest } from 'next/server';
import { authenticate } from '@/lib/middleware/auth-middleware';
import { ApiResponseHandler } from '@/lib/api-response';
import { asyncHandler } from '@/lib/middleware/error-handler';
import OutfitAssignment from '@/lib/db/models/OutfitAssignment';
import Outfit from '@/lib/db/models/Outfit';
import dbConnect from '@/lib/db/mongoose';

// ============================================================================
// PATCH /api/calendar/assignments/[id] - Update an assignment
// ============================================================================

export const PATCH = asyncHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  console.log('[Calendar PATCH] Starting request...');
  await dbConnect();

  const { user, error } = await authenticate(req);
  if (error || !user) {
    console.log('[Calendar PATCH] Auth error:', error);
    return error;
  }
  
  console.log('[Calendar PATCH] User authenticated:', user.userId);

  const { id } = await params;
  console.log('[Calendar PATCH] Assignment ID:', id);
  
  const updates = await req.json();
  console.log('[Calendar PATCH] Updates:', updates);

  // Find assignment
  const assignment = await OutfitAssignment.findOne({
    _id: id,
    userId: user.userId,
  });

  if (!assignment) {
    return ApiResponseHandler.notFound('Assignment not found');
  }

  // If marking as worn, update both assignment and outfit
  if (updates.isWorn === true && !assignment.isWorn) {
    assignment.isWorn = true;
    assignment.wornDate = new Date();
    await assignment.save();

    // Get the outfit to access its items
    const outfit = await Outfit.findById(assignment.outfitId);
    
    console.log('[Calendar] Marking outfit as worn:', assignment.outfitId);
    console.log('[Calendar] Outfit found:', !!outfit);
    
    if (outfit) {
      console.log('[Calendar] Outfit mode:', outfit.mode);
      console.log('[Calendar] Outfit combination:', outfit.combination);
      console.log('[Calendar] Outfit canvasState:', outfit.canvasState);
      
      // Update outfit wear count
      await Outfit.findByIdAndUpdate(assignment.outfitId, {
        $inc: { 'usage.wearCount': 1 },
        $set: { 'usage.lastWornDate': new Date() },
      });

      // Update wear count for all items in the outfit
      const Cloth = (await import('@/lib/db/models/Cloth')).default;
      const itemIds: string[] = [];

      // Extract item IDs based on outfit mode
      if (outfit.mode === 'dress-me' && outfit.combination?.items) {
        // For dress-me mode, items are in combination.items object
        console.log('[Calendar] Extracting dress-me items:', outfit.combination.items);
        Object.values(outfit.combination.items).forEach((itemId) => {
          // Filter out empty arrays and null/undefined values
          if (itemId && !Array.isArray(itemId)) {
            itemIds.push(itemId.toString());
            console.log('[Calendar] Added dress-me item:', itemId.toString());
          } else if (Array.isArray(itemId) && itemId.length > 0) {
            // Handle accessories array if it has items
            itemId.forEach((accessoryId) => {
              if (accessoryId) {
                itemIds.push(accessoryId.toString());
                console.log('[Calendar] Added accessory item:', accessoryId.toString());
              }
            });
          }
        });
      } else if (outfit.mode === 'canvas' && outfit.canvasState?.items) {
        // For canvas mode, items are in canvasState.items array
        console.log('[Calendar] Extracting canvas items, count:', outfit.canvasState.items.length);
        outfit.canvasState.items.forEach((item) => {
          if (item.clothItemId) {
            itemIds.push(item.clothItemId.toString());
            console.log('[Calendar] Added canvas item:', item.clothItemId.toString());
          }
        });
      }

      console.log('[Calendar] Total item IDs to update:', itemIds);

      // Update usage stats for all items
      if (itemIds.length > 0) {
        const result = await Cloth.updateMany(
          { _id: { $in: itemIds } },
          {
            $inc: { 'usage.wearCount': 1 },
            $set: { 'usage.lastWornDate': new Date() },
          }
        );
        console.log(`[Calendar] Updated wear count for ${itemIds.length} items in outfit ${outfit._id}`);
        console.log('[Calendar] Update result:', result);
      } else {
        console.log('[Calendar] No item IDs found to update!');
      }
    }
  } else {
    // Regular update
    Object.assign(assignment, updates);
    await assignment.save();
  }

  await assignment.populate('outfitId');
  return ApiResponseHandler.success({ assignment });
});

// ============================================================================
// DELETE /api/calendar/assignments/[id] - Delete an assignment
// ============================================================================

export const DELETE = asyncHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  await dbConnect();

  const { user, error } = await authenticate(req);
  if (error || !user) return error;

  const { id } = await params;

  const result = await OutfitAssignment.deleteOne({
    _id: id,
    userId: user.userId,
  });

  if (result.deletedCount === 0) {
    return ApiResponseHandler.notFound('Assignment not found');
  }

  return ApiResponseHandler.success({ message: 'Assignment deleted' });
});
