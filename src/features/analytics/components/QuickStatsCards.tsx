'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Calendar, AlertCircle, DollarSign } from 'lucide-react';
import type { QuickStats } from '../types/analytics.types';
import { formatCurrency } from '../utils/calculations';

interface QuickStatsCardsProps {
  stats: QuickStats;
  loading?: boolean;
}

export function QuickStatsCards({ stats, loading }: QuickStatsCardsProps) {
  const statCards = [
    {
      title: 'Total Outfits',
      value: stats.totalOutfits,
      icon: TrendingUp,
      description: 'Created outfits',
      color: 'text-blue-500',
    },
    {
      title: 'Worn This Month',
      value: stats.outfitsWornThisMonth,
      icon: Calendar,
      description: 'Outfits worn',
      color: 'text-green-500',
    },
    {
      title: 'Items Never Used',
      value: stats.itemsNeverUsed,
      icon: AlertCircle,
      description: 'Unused wardrobe items',
      color: 'text-orange-500',
    },
    {
      title: 'Avg Cost Per Wear',
      value:
        stats.averageCPW !== null
          ? formatCurrency(stats.averageCPW)
          : 'N/A',
      icon: DollarSign,
      description: 'Average CPW',
      color: 'text-purple-500',
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-1" />
              <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
