'use client';

import { useAuthGuard } from '@/features/auth/components/authGuard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shirt, Plus, Filter } from 'lucide-react';

export default function WardrobePage() {
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
      <div className="max-w-7xl mx-auto">
 

        {/* Wardrobe Grid */}
        <Card className="p-8">
          <div className="text-center py-16 text-muted-foreground">
            <Shirt className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg font-medium mb-2">Your wardrobe is empty</p>
            <p className="text-sm mb-4">Start adding items to build your digital wardrobe</p>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Item
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
