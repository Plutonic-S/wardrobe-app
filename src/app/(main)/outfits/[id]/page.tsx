'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Loader2,
  Wand2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OutfitResponse } from '@/features/outfit-builder/types/outfit.types';
import type { VirtualTryOnData } from '@/features/outfit-builder/types/virtual-tryon.types';

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
  const hasLoadedRef = useRef(false);

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Virtual try-on state
  const [isGeneratingVTO, setIsGeneratingVTO] = useState(false);
  const [vtoError, setVtoError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch outfit
  useEffect(() => {
    const fetchOutfit = async () => {
      try {
        // Only show skeleton on initial load
        if (!hasLoadedRef.current) {
          setIsLoading(true);
        }
        const response = await fetch(`/api/outfits/${outfitId}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          console.log('[ViewOutfit] Full response:', data);
          console.log('[ViewOutfit] Outfit data:', data.data);
          console.log('[ViewOutfit] Full combination:', data.data?.combination);
          if (data.data?.combination?.items) {
            console.log('[ViewOutfit] Combination items:', data.data.combination.items);
            console.log('[ViewOutfit] Items keys:', Object.keys(data.data.combination.items));
            Object.entries(data.data.combination.items).forEach(([category, item]) => {
              console.log(`[ViewOutfit] ${category}:`, item, 'type:', typeof item);
            });
          }
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
        hasLoadedRef.current = true;
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
          usage: {
            favorite: !outfit.usage.favorite,
          },
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
          usage: {
            wearCount: outfit.usage.wearCount + 1,
            lastWornDate: new Date().toISOString(),
          },
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

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!outfit) return;

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
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  // Virtual try-on handlers
  const handleGenerateVirtualTryOn = async () => {
    if (!outfit) return;

    setIsGeneratingVTO(true);
    setVtoError(null);

    try {
      // Start virtual try-on job
      const response = await fetch(`/api/outfits/${outfitId}/virtual-try-on`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to start virtual try-on');
      }

      const result = await response.json();
      console.log('[VTO] Job started:', result.data);

      // Update outfit with virtual try-on data (clear any previous failed attempt)
      setOutfit({
        ...outfit,
        virtualTryOn: {
          jobId: result.data.jobId,
          status: result.data.status,
          mode: result.data.mode,
          humanImageUrl: '/human-model.png',
          garmentType: 'full_body',
          createdAt: new Date(),
          // Clear previous error/result
          resultUrl: undefined,
          errorMessage: undefined,
        },
      });

      // Start polling for status
      startPolling();
    } catch (error) {
      console.error('Error starting virtual try-on:', error);
      setVtoError((error as Error).message);
      setIsGeneratingVTO(false);
    }
  };

  const startPolling = useCallback(() => {
    // Clear any existing polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Poll every 3 seconds
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/outfits/${outfitId}/virtual-try-on`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          console.error('[VTO] Polling failed:', response.status, response.statusText);
          // Don't stop polling on temporary errors, continue trying
          return;
        }

        const result = await response.json();
        console.log('[VTO] Status update:', result.data);

        // Update outfit with latest status (use functional update to avoid stale closure)
        setOutfit((prevOutfit) => {
          if (!prevOutfit) return prevOutfit;
          return {
            ...prevOutfit,
            virtualTryOn: result.data as VirtualTryOnData,
          };
        });

        // Stop polling if completed or failed
        if (result.data.status === 'COMPLETED' || result.data.status === 'FAILED') {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setIsGeneratingVTO(false);

          if (result.data.status === 'FAILED') {
            setVtoError(result.data.errorMessage || 'Virtual try-on failed');
          }
        }
      } catch (error) {
        console.error('[VTO] Error polling virtual try-on status:', error);
        // Don't stop polling on network errors, continue trying
      }
    }, 3000);
  }, [outfitId]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Auto-start polling if outfit has pending virtual try-on
  useEffect(() => {
    if (outfit?.virtualTryOn?.status === 'PENDING' && !pollingIntervalRef.current) {
      setIsGeneratingVTO(true);
      startPolling();
    }
  }, [outfit?.virtualTryOn, startPolling]);

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
                  onClick={handleDeleteClick}
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
          {/* Left: Outfit Preview with Tabs */}
          <div>
            {/* Virtual Try-On Button */}
            {outfit.previewImage?.url && (!outfit.virtualTryOn || outfit.virtualTryOn.status === 'FAILED') && (
              <Button
                onClick={handleGenerateVirtualTryOn}
                disabled={isGeneratingVTO}
                className="w-full mb-4"
                variant="outline"
              >
                {isGeneratingVTO ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Virtual Try-On...
                  </>
                ) : outfit.virtualTryOn?.status === 'FAILED' ? (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Retry Virtual Try-On
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Virtual Try-On
                  </>
                )}
              </Button>
            )}

            {/* Error Message */}
            {(vtoError || outfit.virtualTryOn?.errorMessage) && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {vtoError || outfit.virtualTryOn?.errorMessage}
                </p>
              </div>
            )}

            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="preview">Outfit Preview</TabsTrigger>
                <TabsTrigger value="virtual-tryon" disabled={!outfit.virtualTryOn?.resultUrl}>
                  Virtual Try-On
                  {isGeneratingVTO && (
                    <Loader2 className="ml-2 h-3 w-3 animate-spin" />
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="mt-0">
                <div className="bg-muted rounded-lg p-4 aspect-[3/4] flex items-center justify-center relative">
                  {/* Mode Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <span
                      className={cn(
                        'text-xs px-3 py-1.5 rounded-md font-semibold uppercase tracking-wide shadow-sm backdrop-blur-sm',
                        outfit.mode === 'dress-me'
                          ? 'bg-gradient-to-r from-violet-500/90 to-purple-500/90 text-white'
                          : 'bg-gradient-to-r from-sky-500/90 to-blue-500/90 text-white'
                      )}
                    >
                      {outfit.mode === 'dress-me' ? 'Dress Me' : 'Canvas'}
                    </span>
                  </div>

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
                    <div className="text-center">
                      <Sparkles className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Outfit Preview</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="virtual-tryon" className="mt-0">
                <div className="bg-muted rounded-lg p-4 aspect-[3/4] flex items-center justify-center relative">
                  {/* Status Badge */}
                  {outfit.virtualTryOn && (
                    <div className="absolute top-4 left-4 z-10">
                      <span
                        className={cn(
                          'text-xs px-3 py-1.5 rounded-md font-semibold uppercase tracking-wide shadow-sm backdrop-blur-sm',
                          outfit.virtualTryOn.status === 'COMPLETED'
                            ? 'bg-gradient-to-r from-emerald-500/90 to-green-500/90 text-white'
                            : outfit.virtualTryOn.status === 'PENDING'
                            ? 'bg-gradient-to-r from-amber-500/90 to-yellow-500/90 text-white'
                            : 'bg-gradient-to-r from-rose-500/90 to-red-500/90 text-white'
                        )}
                      >
                        {outfit.virtualTryOn.status}
                      </span>
                    </div>
                  )}

                  {/* Virtual Try-On Result */}
                  {outfit.virtualTryOn?.resultUrl ? (
                    <Image
                      src={outfit.virtualTryOn.resultUrl}
                      alt={`${outfit.metadata.name} - Virtual Try-On`}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  ) : isGeneratingVTO ? (
                    <div className="text-center">
                      <Loader2 className="h-24 w-24 text-muted-foreground mx-auto mb-4 animate-spin" />
                      <p className="text-muted-foreground">Generating virtual try-on...</p>
                      <p className="text-sm text-muted-foreground mt-2">This may take up to 2 minutes</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Wand2 className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No virtual try-on generated yet</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Quick Stats - Mobile Only */}
            <div className="grid grid-cols-2 gap-4 mt-4 md:hidden">
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
            {/* Quick Stats - Desktop Only */}
            <div className="hidden md:grid grid-cols-2 gap-4">
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
                {Object.keys(outfit.combination.items).filter(k => outfit.combination!.items[k as keyof typeof outfit.combination.items]).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No items in this outfit</p>
                  </div>
                ) : (
                <div className="space-y-3">
                  {Object.entries(outfit.combination.items).map(
                    ([category, item]) => {
                      if (!item || (Array.isArray(item) && item.length === 0)) {
                        return null;
                      }

                      console.log(`[Render] ${category}:`, item, typeof item);

                      // Handle populated item (object) or just ID (string)
                      const isPopulated = typeof item === 'object' && item !== null;
                      
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const populatedItem = item as any;
                      
                      // Try all possible paths for name
                      const itemName = isPopulated 
                        ? populatedItem.metadata?.name || populatedItem.name || 'Unknown Item' 
                        : `Item ${item}`;
                      
                      // Try all possible paths for image
                      const itemImage = isPopulated 
                        ? populatedItem.imageId?.thumbnailUrl || 
                          populatedItem.imageId?.optimizedUrl ||
                          populatedItem.thumbnailUrl || 
                          populatedItem.optimizedUrl
                        : null;

                      console.log(`[Render] ${category} - Name: ${itemName}, Image: ${itemImage}`);

                      return (
                        <div
                          key={category}
                          className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                        >
                          <div className="w-20 h-20 bg-background rounded-md flex items-center justify-center overflow-hidden relative">
                            {itemImage ? (
                              <Image
                                src={itemImage}
                                alt={itemName}
                                fill
                                className="object-contain"
                                unoptimized
                              />
                            ) : (
                              <Sparkles className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground mb-1">
                              {CATEGORY_LABELS[category] || category}
                            </p>
                            <p className="font-medium text-foreground">
                              {itemName}
                            </p>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
                )}
              </div>
            )}

            {/* Canvas Items */}
            {outfit.mode === 'canvas' && outfit.canvasState && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Canvas Items ({outfit.canvasState.items.length})
                </h3>
                {outfit.canvasState.items.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No items on canvas</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {outfit.canvasState.items.map((canvasItem, idx) => {
                      console.log(`[Canvas] Item ${idx}:`, canvasItem);

                      // Handle populated clothItemId (object) or just ID (string)
                      const isPopulated = typeof canvasItem.clothItemId === 'object' && canvasItem.clothItemId !== null;

                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const populatedItem = canvasItem.clothItemId as any;

                      // Try all possible paths for name
                      const itemName = isPopulated
                        ? populatedItem.metadata?.name || populatedItem.name || 'Unknown Item'
                        : `Item ${canvasItem.clothItemId}`;

                      // Try all possible paths for image
                      const itemImage = isPopulated
                        ? populatedItem.imageId?.thumbnailUrl ||
                          populatedItem.imageId?.optimizedUrl ||
                          populatedItem.thumbnailUrl ||
                          populatedItem.optimizedUrl
                        : null;

                      // Get category if available
                      const category = isPopulated ? populatedItem.category : null;

                      console.log(`[Canvas] Item ${idx} - Name: ${itemName}, Image: ${itemImage}, Category: ${category}`);

                      return (
                        <div
                          key={canvasItem.id || `canvas-item-${idx}`}
                          className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                        >
                          <div className="w-20 h-20 bg-background rounded-md flex items-center justify-center overflow-hidden relative">
                            {itemImage ? (
                              <Image
                                src={itemImage}
                                alt={itemName}
                                fill
                                className="object-contain"
                                unoptimized
                              />
                            ) : (
                              <Sparkles className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1">
                            {category && (
                              <p className="text-xs text-muted-foreground mb-1">
                                {CATEGORY_LABELS[category] || category}
                              </p>
                            )}
                            <p className="font-medium text-foreground">
                              {itemName}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Position: ({Math.round(canvasItem.position.x)}, {Math.round(canvasItem.position.y)})
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
