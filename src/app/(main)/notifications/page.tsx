'use client';

import { useAuthGuard } from '@/features/auth/components/authGuard';
import { Card } from '@/components/ui/card';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotificationsPage() {
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
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
              <Bell className="h-8 w-8" />
              Notifications
            </h1>
            <p className="text-muted-foreground">
              Stay updated with your wardrobe activity
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Check className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        </div>

        {/* Notifications List */}
        <Card className="p-6">
          <div className="text-center py-16 text-muted-foreground">
            <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg font-medium mb-2">No notifications yet</p>
            <p className="text-sm">We&apos;ll notify you when something important happens</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
