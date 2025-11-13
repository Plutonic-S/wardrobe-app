'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthGuard } from '@/features/auth/components/authGuard';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sparkles,
  ArrowLeft,
  Edit3,
  Heart,
  MoreVertical,
  Trash2,
  Calendar,
  Tag,
  Sun,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OutfitResponse } from '@/features/outfit-builder/types/outfit.types';

const CATEGORY_LABELS: Record<string, string> = {
  tops: 'Top',
  bottoms: 'Bottom',
  dresses: 'Dress',
  outerwear: 'Outerwear',
  footwear: 'Footwear',
  accessories: 'Accessories',
};

const SEASON_LABELS: Record<string, string> = {
  spring: 'Spring',
  summer: 'Summer',
  autumn: 'Autumn',
  winter: 'Winter',
};

export default function ViewOutfitPage() {
  const router = useRouter();
  const params = useParams();
  const outfitId = params.id as string;

  const { user, isChecking } = useAuthGuard({
    requireAuth: true,
    redirectTo: '/login',
  });

  const [outfit, setOutfit] = useState<OutfitResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch outfit
  useEffect(() => {
    const fetchOutfit = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/outfits/${outfitId}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setOutfit(data.data);
        } else {
          console.error('Failed to fetch outfit:', response.status);
          router.push('/outfits');
        }
      } catch (error) {
        console.error('Error fetching outfit:', error);
        router.push('/outfits');
      } finally {
        setIsLoading(false);
      }
    };

    if (user && outfitId) {
      fetchOutfit();
    }
  }, [user, outfitId, router]);

  // Handle actions
  const handleToggleFavorite = async () => {
    if (!outfit) return;

    try {
      const response = await fetch(`/api/outfits/${outfitId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          'usage.favorite': !outfit.usage.favorite,
        }),
      });

      if (response.ok) {
        setOutfit({
          ...outfit,
          usage: { ...outfit.usage, favorite: !outfit.usage.favorite },
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleMarkAsWorn = async () => {
    if (!outfit) return;

    try {
      const response = await fetch(`/api/outfits/${outfitId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          'usage.wearCount': outfit.usage.wearCount + 1,
          'usage.lastWornDate': new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setOutfit(data.data);
      }
    } catch (error) {
      console.error('Error marking as worn:', error);
    }
  };

  const handleDelete = async () => {
    if (!outfit) return;
    if (!confirm('Are you sure you want to delete this outfit?')) return;

    try {
      const response = await fetch(`/api/outfits/${outfitId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        router.push('/outfits');
      }
    } catch (error) {
      console.error('Error deleting outfit:', error);
    }
  };

  // Loading state
  if (isChecking || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.75rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user || !outfit) return null;

  return (
    <div className="min-h-[calc(100vh-3.75rem)] bg-background">
      <div className="max-w-6xl mx-auto p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/outfits')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Outfits
          </Button>

          <div className="flex gap-2">
            {/* Favorite Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleToggleFavorite}
              className={cn(
                outfit.usage.favorite && 'border-red-500'
              )}
            >
              <Heart
                className={cn(
                  'h-4 w-4',
                  outfit.usage.favorite
                    ? 'fill-red-500 text-red-500'
                    : 'text-muted-foreground'
                )}
              />
            </Button>

            {/* Edit Button */}
            <Button
              variant="outline"
              onClick={() => router.push(`/outfits/${outfitId}/edit`)}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>

            {/* More Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleMarkAsWorn}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Mark as Worn
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: Outfit Preview */}
          <div>
            <div className="bg-card border border-border rounded-lg p-8 aspect-[3/4] flex items-center justify-center mb-4 relative">
              {/* Mode Badge */}
              <div className="absolute top-4 left-4">
                <span
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-full font-medium',
                    outfit.mode === 'dress-me'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  )}
                >
                  {outfit.mode === 'dress-me' ? 'Dress Me' : 'Canvas'}
                </span>
              </div>

              {/* Placeholder for outfit visualization */}
              <div className="text-center">
                <Sparkles className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Outfit Preview</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Times Worn</p>
                <p className="text-2xl font-bold text-foreground">
                  {outfit.usage.wearCount}
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Last Worn</p>
                <p className="text-lg font-semibold text-foreground">
                  {outfit.usage.lastWornDate
                    ? new Date(outfit.usage.lastWornDate).toLocaleDateString()
                    : 'Never'}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Outfit Details */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {outfit.metadata.name}
              </h1>
              {outfit.metadata.description && (
                <p className="text-muted-foreground">
                  {outfit.metadata.description}
                </p>
              )}
            </div>

            {/* Tags */}
            {outfit.metadata.tags && outfit.metadata.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {outfit.metadata.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-muted rounded-full text-sm text-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Season */}
            {outfit.metadata.season && outfit.metadata.season.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  Seasons
                </h3>
                <div className="flex flex-wrap gap-2">
                  {outfit.metadata.season.map((season, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-muted rounded-full text-sm text-foreground"
                    >
                      {SEASON_LABELS[season] || season}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Occasion */}
            {outfit.metadata.occasion && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  Occasion
                </h3>
                <p className="text-foreground">{outfit.metadata.occasion}</p>
              </div>
            )}

            {/* Items (Dress Me Mode) */}
            {outfit.mode === 'dress-me' && outfit.combination && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Items ({outfit.combination.configuration})
                </h3>
                <div className="space-y-3">
                  {Object.entries(outfit.combination.items).map(
                    ([category, itemId]) => {
                      if (!itemId || (Array.isArray(itemId) && itemId.length === 0)) {
                        return null;
                      }

                      return (
                        <div
                          key={category}
                          className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                        >
                          <div className="w-16 h-16 bg-background rounded-md flex items-center justify-center">
                            <Sparkles className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">
                              {CATEGORY_LABELS[category] || category}
                            </p>
                            <p className="font-medium text-foreground">
                              Item {typeof itemId === 'string' ? itemId : 'Multiple'}
                            </p>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            {/* Canvas Items */}
            {outfit.mode === 'canvas' && outfit.canvasState && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Canvas Items
                </h3>
                <p className="text-muted-foreground">
                  {outfit.canvasState.items.length} item(s) on canvas
                </p>
              </div>
            )}

            {/* Timestamps */}
            <div className="pt-6 border-t border-border text-xs text-muted-foreground space-y-1">
              <p>
                Created: {new Date(outfit.createdAt).toLocaleDateString()}
              </p>
              <p>
                Updated: {new Date(outfit.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
