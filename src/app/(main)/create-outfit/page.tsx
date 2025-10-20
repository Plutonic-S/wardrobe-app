'use client';

import { useAuthGuard } from '@/features/auth/components/authGuard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusSquare, Sparkles } from 'lucide-react';

export default function CreateOutfitPage() {
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
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <PlusSquare className="h-8 w-8" />
            Create Outfit
          </h1>
          <p className="text-muted-foreground">
            Mix and match items from your wardrobe to create the perfect outfit
          </p>
        </div>

        {/* Create Outfit Interface */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Outfit Canvas */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Outfit Canvas</h2>
            <div className="border-2 border-dashed border-muted rounded-lg p-12 text-center">
              <PlusSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-2">Drag items here to create your outfit</p>
              <p className="text-sm text-muted-foreground">
                Add items from your wardrobe to get started
              </p>
            </div>
          </Card>

          {/* Wardrobe Items */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Your Items</h2>
              <Button variant="outline" size="sm">
                <Sparkles className="h-4 w-4 mr-2" />
                AI Suggest
              </Button>
            </div>
            <div className="text-center py-12 text-muted-foreground">
              <p>Add items to your wardrobe first</p>
              <Button variant="link" className="text-purple-600">
                Go to Wardrobe
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
