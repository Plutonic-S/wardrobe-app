// src/app/api/calendar/quick-view/route.ts

import { NextRequest } from 'next/server';
import { authenticate } from '@/lib/middleware/auth-middleware';
import { ApiResponseHandler } from '@/lib/api-response';
import { asyncHandler } from '@/lib/middleware/error-handler';
import OutfitAssignment from '@/lib/db/models/OutfitAssignment';
import dbConnect from '@/lib/db/mongoose';

// ============================================================================
// GET /api/calendar/quick-view - Get today and tomorrow's assignments
// ============================================================================

export const GET = asyncHandler(async (req: NextRequest) => {
  await dbConnect();

  const { user, error } = await authenticate(req);
  if (error || !user) return error;

  const { today, tomorrow } = await OutfitAssignment.getTodayAndTomorrow(
    user.userId
  );

  return ApiResponseHandler.success({ today, tomorrow });
});
