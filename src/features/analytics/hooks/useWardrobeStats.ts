'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchWardrobeUtilization } from '../services/analytics.service';
import type {
  TimeRange,
  WardrobeUtilizationResponse,
} from '../types/analytics.types';

interface UseWardrobeStatsReturn {
  data: WardrobeUtilizationResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch wardrobe utilization analytics
 * @param timeRange - Time range filter
 * @param category - Optional category filter
 * @returns Wardrobe analytics data, loading state, error, and refetch function
 */
export function useWardrobeStats(
  timeRange: TimeRange = '30d',
  category?: string
): UseWardrobeStatsReturn {
  const [data, setData] = useState<WardrobeUtilizationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchWardrobeUtilization(timeRange, category);
      setData(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to fetch wardrobe statistics';
      setError(errorMessage);
      console.error('Wardrobe stats fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [timeRange, category]);

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
