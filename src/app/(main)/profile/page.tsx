'use client';

import { useAuthGuard } from '@/features/auth/components/authGuard';
import { Card } from '@/components/ui/card';
import { User as UserIcon, Mail, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Profile</h1>
          <p className="text-muted-foreground">
            Manage your personal information
          </p>
        </div>

        {/* Profile Info */}
        <Card className="p-8 mb-6">
          <div className="flex items-start gap-6">
            <div className="h-24 w-24 rounded-full bg-purple-600 flex items-center justify-center text-white text-3xl font-bold">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">@{user.username}</h2>
              <div className="space-y-2 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  <span className="capitalize">{user.role}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Member since {new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <Button variant="outline">Edit Profile</Button>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">0</div>
            <div className="text-sm text-muted-foreground">Wardrobe Items</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">0</div>
            <div className="text-sm text-muted-foreground">Outfits Created</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">0</div>
            <div className="text-sm text-muted-foreground">Events Planned</div>
          </Card>
        </div>
      </div>
    </div>
  );
}
