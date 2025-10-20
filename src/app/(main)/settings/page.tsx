'use client';

import { useAuthGuard } from '@/features/auth/components/authGuard';
import { Card } from '@/components/ui/card';
import { Settings, User, Bell, Shield, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
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

  const settingsCategories = [
    {
      icon: User,
      title: 'Profile Settings',
      description: 'Manage your account information',
      color: 'text-purple-600',
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Configure notification preferences',
      color: 'text-blue-600',
    },
    {
      icon: Shield,
      title: 'Privacy & Security',
      description: 'Control your privacy settings',
      color: 'text-green-600',
    },
    {
      icon: Palette,
      title: 'Appearance',
      description: 'Customize your experience',
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account and preferences
          </p>
        </div>

        {/* Settings Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settingsCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Card key={category.title} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg bg-muted ${category.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{category.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Account Actions */}
        <Card className="p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Account Actions</h2>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              Export Data
            </Button>
            <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-600">
              Delete Account
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
