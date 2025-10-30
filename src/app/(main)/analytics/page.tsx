'use client';

import { useAuthGuard } from '@/features/auth/components/authGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, TrendingUp, DollarSign, Calendar, Shirt } from 'lucide-react';

export default function AnalyticsPage() {
  const { user, isChecking } = useAuthGuard({
    requireAuth: true,
    redirectTo: '/login',
  });

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.75rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) return null;

  // Placeholder stats - will be replaced with real data
  const stats = [
    {
      title: 'Total Items',
      value: '0',
      icon: Shirt,
      description: 'Items in your wardrobe',
      color: 'text-blue-600',
    },
    {
      title: 'Most Worn',
      value: '0',
      icon: TrendingUp,
      description: 'Times worn this month',
      color: 'text-green-600',
    },
    {
      title: 'Total Value',
      value: '$0',
      icon: DollarSign,
      description: 'Wardrobe estimated value',
      color: 'text-purple-600',
    },
    {
      title: 'Last Added',
      value: 'N/A',
      icon: Calendar,
      description: 'Most recent item',
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="p-6 md:p-8 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <PieChart className="h-8 w-8" />
            Analytics
          </h1>
          <p className="text-muted-foreground">
            Insights and statistics about your wardrobe
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Category Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <PieChart className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-sm">No data available yet</p>
                  <p className="text-xs mt-2">Add items to see your category breakdown</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wear Frequency */}
          <Card>
            <CardHeader>
              <CardTitle>Wear Frequency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-sm">No data available yet</p>
                  <p className="text-xs mt-2">Track your outfits to see trends</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                Cost per wear analysis
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                Seasonal usage patterns
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                Color palette insights
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                Shopping recommendations
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
