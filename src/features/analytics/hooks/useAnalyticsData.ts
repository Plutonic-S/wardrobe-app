'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchAllAnalytics } from '../services/analytics.service';
import type {
  TimeRange,
  AnalyticsOverviewResponse,
  WardrobeUtilizationResponse,
  CostPerWearResponse,
} from '../types/analytics.types';

interface AnalyticsData {
  overview: AnalyticsOverviewResponse | null;
  utilization: WardrobeUtilizationResponse | null;
  costPerWear: CostPerWearResponse | null;
}

interface UseAnalyticsDataReturn {
  data: AnalyticsData;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch all analytics data
 * @param timeRange - Time range filter
 * @returns Analytics data, loading state, error, and refetch function
 */
export function useAnalyticsData(
  timeRange: TimeRange = '30d'
): UseAnalyticsDataReturn {
  const [data, setData] = useState<AnalyticsData>({
    overview: null,
    utilization: null,
    costPerWear: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchAllAnalytics(timeRange);
      setData(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch analytics data';
      setError(errorMessage);
      console.error('Analytics data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
