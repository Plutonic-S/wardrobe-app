import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/middleware/error-handler';
import { authenticate } from '@/lib/middleware/auth-middleware';
import { ApiResponseHandler } from '@/lib/api-response';
import dbConnect from '@/lib/db/mongoose';
import '@/lib/db/models/Outfit';
import '@/lib/db/models/OutfitAssignment';
import {
  getOutfitWearFrequency,
  getStyleTypeDistribution,
  getUnusedItems,
  getCostPerWearStats,
} from '@/lib/db/aggregations/analytics.aggregations';
import { getDateRange, calculateAverage } from '@/features/analytics/utils/calculations';
import type { TimeRange, AnalyticsOverviewResponse } from '@/features/analytics/types/analytics.types';
import mongoose from 'mongoose';

/**
 * GET /api/analytics/overview
 * Get analytics overview with quick stats and outfit wear frequency
 * Query params:
 * - timeRange: '7d' | '30d' | '3m' | '1y' | 'all' (default: '30d')
 */
export const GET = asyncHandler(async (req: NextRequest) => {
  await dbConnect();

  // Authenticate user
  const { user, error } = await authenticate(req);
  if (error) return error;

  // Get query parameters
  const searchParams = req.nextUrl.searchParams;
  const timeRange = (searchParams.get('timeRange') || '30d') as TimeRange;

  // Get date range for filtering
  const dateRange = getDateRange(timeRange);

  // Get outfit models
  const Outfit = mongoose.models.Outfit;
  const OutfitAssignment = mongoose.models.OutfitAssignment;

  // 1. Quick Stats
  // Total outfits
  const totalOutfits = await Outfit.countDocuments({
    userId: new mongoose.Types.ObjectId(user.userId),
    status: 'active',
  });

  // Outfits worn this month (from calendar assignments)
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const outfitsWornThisMonth = await OutfitAssignment.countDocuments({
    userId: new mongoose.Types.ObjectId(user.userId),
    isWorn: true,
    wornDate: { $gte: currentMonth },
  });

  // Items never used
  const unusedItems = await getUnusedItems(user.userId);
  const itemsNeverUsed = unusedItems.length;

  // Average CPW
  const cpwStats = await getCostPerWearStats(user.userId);
  const validCPWs = cpwStats
    .filter((item) => isFinite(item.costPerWear) && item.wearCount > 0)
    .map((item) => item.costPerWear);
  const averageCPW = validCPWs.length > 0 ? calculateAverage(validCPWs) : null;

  // 2. Outfit wear frequency (top 10 most worn)
  const outfitWearFrequency = await getOutfitWearFrequency(
    user.userId,
    dateRange,
    10
  );

  // 3. Style type distribution
  const styleTypeDistribution = await getStyleTypeDistribution(user.userId);

  // Build response
  const response: AnalyticsOverviewResponse = {
    quickStats: {
      totalOutfits,
      outfitsWornThisMonth,
      itemsNeverUsed,
      averageCPW,
    },
    outfitWearFrequency,
    styleTypeDistribution,
    timeRange,
  };

  return ApiResponseHandler.success(
    response,
    'Analytics overview retrieved successfully'
  );
});
