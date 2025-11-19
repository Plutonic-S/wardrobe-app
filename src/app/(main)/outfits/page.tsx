'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuthGuard } from '@/features/auth/components/authGuard';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Heart, Calendar, Trash2, Filter, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OutfitResponse } from '@/features/outfit-builder/types/outfit.types';

type FilterMode = 'all' | 'favorites' | 'dress-me' | 'canvas';
type SortMode = 'recent' | 'name' | 'wearCount';

export default function OutfitsGalleryPage() {
  const router = useRouter();
  const { user, isChecking } = useAuthGuard({
    requireAuth: true,
    redirectTo: '/login',
  });

  // Outfit state
  const [outfits, setOutfits] = useState<OutfitResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  // Filter state
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [sortMode, setSortMode] = useState<SortMode>('recent');

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [outfitToDelete, setOutfitToDelete] = useState<string | null>(null);

  // Fetch outfits from API
  useEffect(() => {
    const fetchOutfits = async () => {
      try {
        // Only show skeleton on initial load, not on filter/sort changes
        if (!hasLoadedRef.current) {
          setIsLoading(true);
        }
        const params = new URLSearchParams({
          sortBy: sortMode === 'recent' ? 'createdAt' : sortMode === 'name' ? 'name' : 'wearCount',
          sortOrder: 'desc',
        });

        if (filterMode === 'favorites') {
          params.append('favorite', 'true');
        } else if (filterMode !== 'all') {
          params.append('mode', filterMode);
        }

        const response = await fetch(`/api/outfits?${params}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          const items = data.data?.outfits || [];
          // Transform _id to id for frontend compatibility
          const transformedItems = items.map((item: OutfitResponse & { _id?: string }) => ({
            ...item,
            id: item._id?.toString() || item.id,
          }));
          setOutfits(transformedItems);
        } else {
          console.error('Failed to fetch outfits:', response.status);
          setOutfits([]);
        }
      } catch (error) {
        console.error('Error fetching outfits:', error);
        setOutfits([]);
      } finally {
        setIsLoading(false);
        hasLoadedRef.current = true;
      }
    };

    if (user) {
      fetchOutfits();
    }
  }, [user, filterMode, sortMode]);

  // Handle outfit actions
  const handleDeleteClick = (outfitId: string) => {
    setOutfitToDelete(outfitId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!outfitToDelete) return;

    try {
      console.log('[Delete] Deleting outfit ID:', outfitToDelete);
      const response = await fetch(`/api/outfits/${outfitToDelete}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        console.log('[Delete] Delete successful, filtering out:', outfitToDelete);
        console.log('[Delete] Current outfits:', outfits.map(o => o.id));
        setOutfits(prev => {
          const filtered = prev.filter(o => o.id !== outfitToDelete);
          console.log('[Delete] After filter:', filtered.length, 'outfits remaining');
          return filtered;
        });
      } else {
        console.error('[Delete] Delete failed:', response.status);
      }
    } catch (error) {
      console.error('Error deleting outfit:', error);
    } finally {
      setDeleteDialogOpen(false);
      setOutfitToDelete(null);
    }
  };

  const handleToggleFavorite = async (outfitId: string, currentFavorite: boolean) => {
    try {
      const response = await fetch(`/api/outfits/${outfitId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          usage: {
            favorite: !currentFavorite,
          },
        }),
      });

      if (response.ok) {
        setOutfits(prev =>
          prev.map(o =>
            o.id === outfitId
              ? { ...o, usage: { ...o.usage, favorite: !currentFavorite } }
              : o
          )
        );
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Loading state
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.75rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-3.75rem)] bg-background">
      <div className="max-w-7xl mx-auto p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-purple-600" />
              My Outfits
            </h1>
            <p className="text-muted-foreground mt-1">
              {outfits.length} outfit{outfits.length !== 1 ? 's' : ''} in your collection
            </p>
          </div>

          <div className="flex gap-2">
            {/* Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-border">
                  <Filter className="h-4 w-4 mr-2" />
                  {filterMode === 'all' ? 'All' : filterMode === 'favorites' ? 'Favorites' : filterMode === 'dress-me' ? 'Dress Me' : 'Canvas'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterMode('all')}>
                  All Outfits
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterMode('favorites')}>
                  <Heart className="h-4 w-4 mr-2" />
                  Favorites
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterMode('dress-me')}>
                  Dress Me
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterMode('canvas')}>
                  Canvas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-border">
                  <Calendar className="h-4 w-4 mr-2" />
                  {sortMode === 'recent' ? 'Recent' : sortMode === 'name' ? 'Name' : 'Most Worn'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortMode('recent')}>
                  Most Recent
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortMode('name')}>
                  Name (A-Z)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortMode('wearCount')}>
                  Most Worn
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Create Outfit Button */}
            <Button
              onClick={() => router.push('/outfits/create')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Outfit
            </Button>
          </div>
        </div>

        {/* Outfits Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] rounded-lg bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : outfits.length === 0 ? (
          <div className="text-center py-16">
            <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No outfits yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Create your first outfit to get started!
            </p>
            <Button
              onClick={() => router.push('/outfits/create')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Outfit
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {outfits.map((outfit) => (
              <div
                key={outfit.id}
                className="group relative bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                onClick={() => router.push(`/outfits/${outfit.id}`)}
              >
                {/* Outfit Preview */}
                <div className="aspect-[3/4] bg-muted flex items-center justify-center relative">
                  {/* Mode Badge */}
                  <div className="absolute top-2 left-2 z-10">
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full font-medium",
                      outfit.mode === 'dress-me'
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    )}>
                      {outfit.mode === 'dress-me' ? 'Dress Me' : 'Canvas'}
                    </span>
                  </div>

                  {/* Favorite Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(outfit.id, outfit.usage.favorite);
                    }}
                    className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/80 dark:bg-black/80 hover:bg-white dark:hover:bg-black transition-colors"
                  >
                    <Heart
                      className={cn(
                        "h-4 w-4",
                        outfit.usage.favorite
                          ? "fill-red-500 text-red-500"
                          : "text-muted-foreground"
                      )}
                    />
                  </button>

                  {/* Outfit Preview */}
                  {outfit.previewImage?.url ? (
                    <Image
                      src={outfit.previewImage.url}
                      alt={outfit.metadata.name}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  ) : (
                    <div className="text-muted-foreground">
                      <Sparkles className="h-12 w-12" />
                    </div>
                  )}
                </div>

                {/* Outfit Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-foreground mb-1 truncate">
                    {outfit.metadata.name}
                  </h3>
                  {outfit.metadata.description && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {outfit.metadata.description}
                    </p>
                  )}

                  {/* Tags */}
                  {outfit.metadata.tags && outfit.metadata.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {outfit.metadata.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                      {outfit.metadata.tags.length > 3 && (
                        <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                          +{outfit.metadata.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Wear Count */}
                  <div className="text-xs text-muted-foreground">
                    Worn {outfit.usage.wearCount} time{outfit.usage.wearCount !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Action Buttons - Show on hover */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/outfits/${outfit.id}/edit`);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(outfit.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Outfit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this outfit? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
