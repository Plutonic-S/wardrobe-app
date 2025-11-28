'use client';

import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { TimeRangeSelector } from './TimeRangeSelector';
import { QuickStatsCards } from './QuickStatsCards';
import { OutfitWearChart } from './charts/OutfitWearChart';
import { CategoryUsageChart } from './charts/CategoryUsageChart';
import { ItemUsageTable } from './ItemUsageTable';
import { useAnalyticsData } from '../hooks/useAnalyticsData';
import type { TimeRange } from '../types/analytics.types';
import { Button } from '@/components/ui/button';

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const { data, loading, error, refetch } = useAnalyticsData(timeRange);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-center max-w-md">
          <h3 className="text-lg font-semibold text-destructive mb-2">
            Error Loading Analytics
          </h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Track your wardrobe usage and outfit patterns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="icon"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <QuickStatsCards
        stats={
          data.overview?.quickStats || {
            totalOutfits: 0,
            outfitsWornThisMonth: 0,
            itemsNeverUsed: 0,
            averageCPW: null,
          }
        }
        loading={loading}
      />

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <OutfitWearChart
          data={data.overview?.outfitWearFrequency || []}
          loading={loading}
        />
        <CategoryUsageChart
          data={data.utilization?.utilization?.categoryUtilization || []}
          loading={loading}
        />
      </div>

      {/* Tables Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ItemUsageTable
          title="Most Used Items"
          data={data.utilization?.utilization?.mostUsedItems || []}
          loading={loading}
          emptyMessage="No usage data available. Create outfits to track item usage."
        />
        <ItemUsageTable
          title="Underutilized Items"
          data={data.utilization?.utilization?.unusedItems?.slice(0, 20) || []}
          loading={loading}
          emptyMessage="Great! All your items are being used."
        />
      </div>

      {/* Additional Info Section */}
      {!loading && data.overview && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Style Type Breakdown */}
          {data.overview?.styleTypeDistribution && (
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold mb-4">Style Types</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Dress Me Mode
                  </span>
                  <span className="font-medium">
                    {data.overview.styleTypeDistribution.dressMe || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Canvas Mode
                  </span>
                  <span className="font-medium">
                    {data.overview.styleTypeDistribution.canvas || 0}
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground mb-2">
                    Configuration Breakdown
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>2-part</span>
                      <span>
                        {
                          data.overview.styleTypeDistribution.configBreakdown?.[
                            '2-part'
                          ] || 0
                        }
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>3-part</span>
                      <span>
                        {
                          data.overview.styleTypeDistribution.configBreakdown?.[
                            '3-part'
                          ] || 0
                        }
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>4-part</span>
                      <span>
                        {
                          data.overview.styleTypeDistribution.configBreakdown?.[
                            '4-part'
                          ] || 0
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cost Per Wear Summary */}
          {data.costPerWear?.stats && (
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold mb-4">Cost Insights</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Total Wardrobe Value
                  </span>
                  <span className="font-medium">
                    ${(data.costPerWear.stats.totalWardrobeValue || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Items with Price
                  </span>
                  <span className="font-medium">
                    {data.costPerWear.stats.itemsCPW?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Items without Price
                  </span>
                  <span className="font-medium">
                    {data.costPerWear.stats.itemsWithoutPrice || 0}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Wardrobe Overview */}
          {data.utilization?.utilization && (
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold mb-4">Wardrobe Overview</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Total Categories
                  </span>
                  <span className="font-medium">
                    {data.utilization.utilization.categoryUtilization?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Most Used Items
                  </span>
                  <span className="font-medium">
                    {data.utilization.utilization.mostUsedItems?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Unused Items
                  </span>
                  <span className="font-medium">
                    {data.utilization.utilization.unusedItems?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
