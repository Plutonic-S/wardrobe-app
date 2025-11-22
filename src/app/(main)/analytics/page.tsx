'use client';

import { useAuthGuard } from '@/features/auth/components/authGuard';
import { AnalyticsDashboard } from '@/features/analytics/components/AnalyticsDashboard';

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

  return (
    <div className="p-6 md:p-8 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto">
        <AnalyticsDashboard />
      </div>
    </div>
  );
}
