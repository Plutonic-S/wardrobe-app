'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { OutfitWearData } from '../../types/analytics.types';

interface OutfitWearChartProps {
  data: OutfitWearData[];
  loading?: boolean;
}

export function OutfitWearChart({ data, loading }: OutfitWearChartProps) {
  // Transform data for Recharts
  const chartData = data.map((outfit) => ({
    name: outfit.name.length > 20 ? outfit.name.substring(0, 20) + '...' : outfit.name,
    wearCount: outfit.wearCount,
    fullName: outfit.name,
  }));

  // Color scheme - gradient from purple to blue
  const colors = [
    '#8b5cf6', // purple-500
    '#a78bfa', // purple-400
    '#c4b5fd', // purple-300
    '#6366f1', // indigo-500
    '#818cf8', // indigo-400
    '#3b82f6', // blue-500
    '#60a5fa', // blue-400
    '#93c5fd', // blue-300
    '#0ea5e9', // sky-500
    '#38bdf8', // sky-400
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Most Worn Outfits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-muted-foreground">Loading chart...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Most Worn Outfits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">No outfit data available</p>
              <p className="text-sm text-muted-foreground mt-2">
                Create and wear outfits to see analytics
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Most Worn Outfits</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              label={{
                value: 'Wear Count',
                angle: -90,
                position: 'insideLeft',
                style: { fill: 'hsl(var(--muted-foreground))' },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
              formatter={(value: number, _name: string, props: { payload?: { fullName: string } }) => [
                `${value} wears`,
                props.payload?.fullName || '',
              ]}
            />
            <Bar dataKey="wearCount" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
