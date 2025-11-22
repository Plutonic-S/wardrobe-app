import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/middleware/error-handler';
import { authenticate } from '@/lib/middleware/auth-middleware';
import { ApiResponseHandler } from '@/lib/api-response';
import dbConnect from '@/lib/db/mongoose';
import '@/lib/db/models/Cloth';
import '@/lib/db/models/Outfit';
import '@/lib/db/models/Image';
import { getCostPerWearStats } from '@/lib/db/aggregations/analytics.aggregations';
import {
  sortByCPW,
  calculateAverage,
  getTopN,
} from '@/features/analytics/utils/calculations';
import type {
  TimeRange,
  CostPerWearResponse,
  CostPerWearStats,
} from '@/features/analytics/types/analytics.types';
import mongoose from 'mongoose';

/**
 * GET /api/analytics/cost-per-wear
 * Get cost per wear statistics for all items
 * Query params:
 * - timeRange: '7d' | '30d' | '3m' | '1y' | 'all' (default: '30d')
 * - sortBy: 'cpw' | 'price' | 'wears' (default: 'cpw')
 */
export const GET = asyncHandler(async (req: NextRequest) => {
  await dbConnect();

  // Authenticate user
  const { user, error } = await authenticate(req);
  if (error) return error;

  // Get query parameters
  const searchParams = req.nextUrl.searchParams;
  const timeRange = (searchParams.get('timeRange') || '30d') as TimeRange;
  const sortBy = searchParams.get('sortBy') || 'cpw';

  // Get all CPW data
  const allItemsCPW = await getCostPerWearStats(user.userId);

  // Sort based on sortBy parameter
  let sortedItems = [...allItemsCPW];
  if (sortBy === 'cpw') {
    sortedItems = sortByCPW(sortedItems, 'asc'); // Best CPW first
  } else if (sortBy === 'price') {
    sortedItems.sort((a, b) => b.price - a.price); // Highest price first
  } else if (sortBy === 'wears') {
    sortedItems.sort((a, b) => b.wearCount - a.wearCount); // Most worn first
  }

  // Calculate statistics
  const totalWardrobeValue = allItemsCPW.reduce(
    (sum, item) => sum + item.price,
    0
  );

  const validCPWs = allItemsCPW
    .filter((item) => isFinite(item.costPerWear) && item.wearCount > 0)
    .map((item) => item.costPerWear);
  const averageCPW = validCPWs.length > 0 ? calculateAverage(validCPWs) : null;

  // Get most/least cost-effective items
  const itemsWithFiniteCPW = allItemsCPW.filter((item) =>
    isFinite(item.costPerWear)
  );
  const mostCostEffective = getTopN(sortByCPW(itemsWithFiniteCPW, 'asc'), 10);
  const leastCostEffective = getTopN(sortByCPW(itemsWithFiniteCPW, 'desc'), 10);

  // Count items without price
  const Cloth = mongoose.models.Cloth;
  const totalItems = await Cloth.countDocuments({
    userId: new mongoose.Types.ObjectId(user.userId),
    status: 'active',
  });
  const itemsWithoutPrice = totalItems - allItemsCPW.length;

  // Build response
  const stats: CostPerWearStats = {
    itemsCPW: sortedItems,
    totalWardrobeValue,
    averageCPW,
    mostCostEffective,
    leastCostEffective,
    itemsWithoutPrice,
  };

  const response: CostPerWearResponse = {
    stats,
    timeRange,
  };

  return ApiResponseHandler.success(
    response,
    'Cost per wear statistics retrieved successfully'
  );
});
