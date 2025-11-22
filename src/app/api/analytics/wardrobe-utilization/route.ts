import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/middleware/error-handler';
import { authenticate } from '@/lib/middleware/auth-middleware';
import { ApiResponseHandler } from '@/lib/api-response';
import dbConnect from '@/lib/db/mongoose';
import '@/lib/db/models/Cloth';
import '@/lib/db/models/Outfit';
import '@/lib/db/models/Image';
import {
  getMostUsedItems,
  getUnusedItems,
  getCategoryUtilization,
} from '@/lib/db/aggregations/analytics.aggregations';
import { sortByUsage } from '@/features/analytics/utils/calculations';
import type { TimeRange, WardrobeUtilizationResponse } from '@/features/analytics/types/analytics.types';

/**
 * GET /api/analytics/wardrobe-utilization
 * Get wardrobe utilization statistics
 * Query params:
 * - timeRange: '7d' | '30d' | '3m' | '1y' | 'all' (default: '30d')
 * - category: optional category filter
 */
export const GET = asyncHandler(async (req: NextRequest) => {
  await dbConnect();

  // Authenticate user
  const { user, error } = await authenticate(req);
  if (error) return error;

  // Get query parameters
  const searchParams = req.nextUrl.searchParams;
  const timeRange = (searchParams.get('timeRange') || '30d') as TimeRange;
  const category = searchParams.get('category');

  // Get most used items (top 20)
  let mostUsedItems = await getMostUsedItems(user.userId, 20);

  // Get least used items (items with low usage, excluding unused)
  const allUsedItems = await getMostUsedItems(user.userId, 1000);
  const leastUsedItems = sortByUsage(
    allUsedItems.filter((item) => item.usageCount > 0 && item.usageCount < 5),
    'asc'
  ).slice(0, 20);

  // Get unused items
  const unusedItems = await getUnusedItems(user.userId);

  // Get category utilization
  let categoryUtilization = await getCategoryUtilization(user.userId);

  // Apply category filter if provided
  if (category) {
    mostUsedItems = mostUsedItems.filter((item) => item.category === category);
    categoryUtilization = categoryUtilization.filter(
      (cat) => cat.category === category
    );
  }

  // Build response
  const response: WardrobeUtilizationResponse = {
    utilization: {
      categoryUtilization,
      mostUsedItems,
      leastUsedItems,
      unusedItems,
    },
    timeRange,
  };

  return ApiResponseHandler.success(
    response,
    'Wardrobe utilization retrieved successfully'
  );
});
