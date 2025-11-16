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
  await dbConnect();

  const { user, error } = await authenticate(req);
  if (error || !user) return error;

  const { id } = await params;
  const updates = await req.json();

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

    // Update outfit wear count
    await Outfit.findByIdAndUpdate(assignment.outfitId, {
      $inc: { 'usage.wearCount': 1 },
      $set: { 'usage.lastWornDate': new Date() },
    });
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
