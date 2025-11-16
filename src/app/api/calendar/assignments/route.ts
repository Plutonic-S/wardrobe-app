// src/app/api/calendar/assignments/route.ts

import { NextRequest } from 'next/server';
import { authenticate } from '@/lib/middleware/auth-middleware';
import { ApiResponseHandler } from '@/lib/api-response';
import { asyncHandler } from '@/lib/middleware/error-handler';
import OutfitAssignment from '@/lib/db/models/OutfitAssignment';
import Outfit from '@/lib/db/models/Outfit';
import dbConnect from '@/lib/db/mongoose';

// ============================================================================
// POST /api/calendar/assignments - Create a new outfit assignment
// ============================================================================

export const POST = asyncHandler(async (req: NextRequest) => {
  await dbConnect();

  const { user, error } = await authenticate(req);
  if (error || !user) return error;

  const { outfitId, assignedDate, occasion } = await req.json();

  // Validate outfit belongs to user
  const outfit = await Outfit.findOne({ _id: outfitId, userId: user.userId });
  if (!outfit) return ApiResponseHandler.notFound('Outfit not found');

  // Check for existing assignment on this date
  const existing = await OutfitAssignment.findOne({
    userId: user.userId,
    assignedDate: new Date(assignedDate),
  });

  if (existing) {
    // Update existing instead of error
    existing.outfitId = outfitId;
    existing.occasion = occasion;
    await existing.save();
    await existing.populate('outfitId');
    return ApiResponseHandler.success({ assignment: existing });
  }

  // Create new assignment
  const assignment = await OutfitAssignment.create({
    userId: user.userId,
    outfitId,
    assignedDate: new Date(assignedDate),
    occasion,
  });

  await assignment.populate('outfitId');
  return ApiResponseHandler.created({ assignment });
});

// ============================================================================
// GET /api/calendar/assignments - Get assignments for a date range
// ============================================================================

export const GET = asyncHandler(async (req: NextRequest) => {
  await dbConnect();

  const { user, error } = await authenticate(req);
  if (error || !user) return error;

  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  if (!start || !end) {
    return ApiResponseHandler.badRequest('Start and end dates required');
  }

  const assignments = await OutfitAssignment.getByDateRange(
    user.userId,
    new Date(start),
    new Date(end)
  );

  return ApiResponseHandler.success({ assignments });
});
