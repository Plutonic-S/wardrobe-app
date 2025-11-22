'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchAnalyticsOverview } from '../services/analytics.service';
import type {
  TimeRange,
  AnalyticsOverviewResponse,
} from '../types/analytics.types';

interface UseOutfitStatsReturn {
  data: AnalyticsOverviewResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch outfit-specific analytics
 * @param timeRange - Time range filter
 * @returns Outfit analytics data, loading state, error, and refetch function
 */
export function useOutfitStats(
  timeRange: TimeRange = '30d'
): UseOutfitStatsReturn {
  const [data, setData] = useState<AnalyticsOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchAnalyticsOverview(timeRange);
      setData(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch outfit statistics';
      setError(errorMessage);
      console.error('Outfit stats fetch error:', err);
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
