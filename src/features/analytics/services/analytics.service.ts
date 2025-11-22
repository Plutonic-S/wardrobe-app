// Analytics API Client Service

import type {
  TimeRange,
  AnalyticsOverviewResponse,
  WardrobeUtilizationResponse,
  CostPerWearResponse,
} from '../types/analytics.types';

/**
 * Fetch analytics overview data
 * @param timeRange - Time range filter
 * @returns Analytics overview data
 */
export async function fetchAnalyticsOverview(
  timeRange: TimeRange = '30d'
): Promise<AnalyticsOverviewResponse> {
  const response = await fetch(
    `/api/analytics/overview?timeRange=${timeRange}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to fetch analytics overview');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Fetch wardrobe utilization data
 * @param timeRange - Time range filter
 * @param category - Optional category filter
 * @returns Wardrobe utilization data
 */
export async function fetchWardrobeUtilization(
  timeRange: TimeRange = '30d',
  category?: string
): Promise<WardrobeUtilizationResponse> {
  const params = new URLSearchParams({ timeRange });
  if (category) {
    params.append('category', category);
  }

  const response = await fetch(
    `/api/analytics/wardrobe-utilization?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.error?.message || 'Failed to fetch wardrobe utilization'
    );
  }

  const data = await response.json();
  return data.data;
}

/**
 * Fetch cost per wear statistics
 * @param timeRange - Time range filter
 * @param sortBy - Sort order
 * @returns Cost per wear data
 */
export async function fetchCostPerWear(
  timeRange: TimeRange = '30d',
  sortBy: 'cpw' | 'price' | 'wears' = 'cpw'
): Promise<CostPerWearResponse> {
  const params = new URLSearchParams({ timeRange, sortBy });

  const response = await fetch(
    `/api/analytics/cost-per-wear?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.error?.message || 'Failed to fetch cost per wear statistics'
    );
  }

  const data = await response.json();
  return data.data;
}

/**
 * Fetch all analytics data in parallel
 * @param timeRange - Time range filter
 * @returns All analytics data
 */
export async function fetchAllAnalytics(timeRange: TimeRange = '30d') {
  const [overview, utilization, costPerWear] = await Promise.all([
    fetchAnalyticsOverview(timeRange),
    fetchWardrobeUtilization(timeRange),
    fetchCostPerWear(timeRange),
  ]);

  return {
    overview,
    utilization,
    costPerWear,
  };
}
