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
  try {
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
      let errorMessage = 'Failed to fetch analytics overview';
      try {
        const error = await response.json();
        errorMessage = error.error?.message || errorMessage;
      } catch {
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('fetchAnalyticsOverview error:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch analytics overview');
  }
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
  try {
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
      let errorMessage = 'Failed to fetch wardrobe utilization';
      try {
        const error = await response.json();
        errorMessage = error.error?.message || errorMessage;
      } catch {
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('fetchWardrobeUtilization error:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch wardrobe utilization');
  }
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
  try {
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
      let errorMessage = 'Failed to fetch cost per wear statistics';
      try {
        const error = await response.json();
        errorMessage = error.error?.message || errorMessage;
      } catch {
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('fetchCostPerWear error:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch cost per wear statistics');
  }
}

/**
 * Fetch all analytics data with graceful error handling
 * @param timeRange - Time range filter
 * @returns All analytics data (with null for failed requests)
 */
export async function fetchAllAnalytics(timeRange: TimeRange = '30d') {
  console.log('[Analytics] Fetching all analytics data for timeRange:', timeRange);
  
  const results = {
    overview: null as AnalyticsOverviewResponse | null,
    utilization: null as WardrobeUtilizationResponse | null,
    costPerWear: null as CostPerWearResponse | null,
  };

  // Fetch overview
  try {
    console.log('[Analytics] Fetching overview...');
    results.overview = await fetchAnalyticsOverview(timeRange);
    console.log('[Analytics] ✓ Overview fetched');
  } catch (error) {
    console.error('[Analytics] ✗ Failed to fetch overview:', error);
  }

  // Fetch utilization
  try {
    console.log('[Analytics] Fetching utilization...');
    results.utilization = await fetchWardrobeUtilization(timeRange);
    console.log('[Analytics] ✓ Utilization fetched');
  } catch (error) {
    console.error('[Analytics] ✗ Failed to fetch utilization:', error);
  }

  // Fetch cost per wear
  try {
    console.log('[Analytics] Fetching cost per wear...');
    results.costPerWear = await fetchCostPerWear(timeRange);
    console.log('[Analytics] ✓ Cost per wear fetched');
  } catch (error) {
    console.error('[Analytics] ✗ Failed to fetch cost per wear:', error);
  }

  // If all requests failed, throw error
  if (!results.overview && !results.utilization && !results.costPerWear) {
    throw new Error('All analytics requests failed. Please check server logs and try again.');
  }

  console.log('[Analytics] Successfully completed fetch (some may have failed)');
  return results;
}
