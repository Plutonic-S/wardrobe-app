'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthGuard } from '@/features/auth/components/authGuard';
import { useOutfitBuilder } from '@/features/outfit-builder/hooks/useOutfitBuilder';
import { Button } from '@/components/ui/button';
import { Sparkles, Save, X, ArrowLeft, Undo2, Redo2, Grid3x3 } from 'lucide-react';
import type { ClothResponse } from '@/features/wardrobe/types/wardrobe.types';
import type { OutfitMetadata, OutfitResponse } from '@/features/outfit-builder/types/outfit.types';
import {
  DressMeMode,
  CanvasPlaceholder,
  OutfitSaveDialog,
} from '@/features/outfit-builder/components';
import { generateOutfitSnapshot } from '@/features/outfit-builder/services/outfit-snapshot.service';
import type {
  DressMeRenderData,
  CanvasRenderData,
} from '@/features/outfit-builder/components/shared/OutfitRenderer';
import { toast } from 'sonner';

export default function EditOutfitPage() {
  const router = useRouter();
  const params = useParams();
  const outfitId = params.id as string;

  const { user, isChecking } = useAuthGuard({
    requireAuth: true,
    redirectTo: '/login',
  });

  // Zustand store
  const {
    mode,
    setMode,
    configuration,
    setConfiguration,
    wardrobeItems,
    setWardrobeItems,
    categoryIndexes,
    setCategoryIndex,
    navigateCategory,
    lockedCategories,
    toggleCategoryLock,
    shuffleUnlocked,
    navigateHistory,
    canUndoDressMe,
    canRedoDressMe,
    saveDressMeToHistory,
  } = useOutfitBuilder();

  // Local state
  const [isLoadingOutfit, setIsLoadingOutfit] = useState(true);
  const [isLoadingWardrobe, setIsLoadingWardrobe] = useState(true);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isSavingLocal, setIsSavingLocal] = useState(false);
  const [outfitMetadata, setOutfitMetadata] = useState<Partial<OutfitMetadata>>({
    name: '',
    description: '',
    tags: [],
    season: [],
  });
  const [saveProgress, setSaveProgress] = useState<{
    stage: 'idle' | 'generating' | 'uploading' | 'saving';
    progress: number;
  }>({ stage: 'idle', progress: 0 });
  
  // Track if outfit has been loaded to prevent re-fetching
  const hasLoadedOutfitRef = useRef(false);

  // Fetch wardrobe items
  useEffect(() => {
    const fetchWardrobe = async () => {
      try {
        setIsLoadingWardrobe(true);
        const response = await fetch('/api/wardrobe', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          const items = data.data?.items || [];
          setWardrobeItems(items);
        }
      } catch (error) {
        console.error('Error fetching wardrobe:', error);
      } finally {
        setIsLoadingWardrobe(false);
      }
    };

    if (user) {
      fetchWardrobe();
    }
  }, [user, setWardrobeItems]);

  // Get categories based on configuration
  const getCategories = () => {
    switch (configuration) {
      case '2-part':
        return ['dresses', 'footwear'];
      case '3-part':
        return ['tops', 'bottoms', 'footwear'];
      case '4-part':
        return ['tops', 'outerwear', 'bottoms', 'footwear'];
      default:
        return [];
    }
  };

  // Group items by category (memoized to prevent infinite loops in useEffect)
  const itemsByCategory = useMemo(() => {
    return wardrobeItems.reduce((acc, item) => {
      const category = item.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, ClothResponse[]>);
  }, [wardrobeItems]);

  // Fetch and load outfit
  useEffect(() => {
    const fetchOutfit = async () => {
      // Prevent re-fetching if already loaded
      if (hasLoadedOutfitRef.current) return;
      
      try {
        setIsLoadingOutfit(true);
        const response = await fetch(`/api/outfits/${outfitId}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          const outfit = data.data as OutfitResponse;

          // Set metadata
          setOutfitMetadata({
            name: outfit.metadata.name,
            description: outfit.metadata.description,
            tags: outfit.metadata.tags,
            season: outfit.metadata.season,
          });

          // Load outfit into store
          setMode(outfit.mode);

          if (outfit.mode === 'dress-me' && outfit.combination) {
            setConfiguration(outfit.combination.configuration);

            // Find indexes of saved items in wardrobe arrays
            // Use itemsByCategory from the current closure (wardrobe is already loaded)
            const items = outfit.combination.items;
            
            const setIndexForCategory = (category: string, itemId?: string) => {
              if (!itemId) return;
              const categoryItems = itemsByCategory[category] || [];
              const index = categoryItems.findIndex(item => item.id === itemId);
              if (index !== -1) {
                setCategoryIndex(category, index);
              }
            };

            setIndexForCategory('tops', items.tops);
            setIndexForCategory('outerwear', items.outerwear);
            setIndexForCategory('bottoms', items.bottoms);
            setIndexForCategory('footwear', items.footwear);

            // Save initial state to history
            saveDressMeToHistory();
          }
          
          hasLoadedOutfitRef.current = true;
        } else {
          console.error('Failed to fetch outfit:', response.status);
          router.push('/outfits');
        }
      } catch (error) {
        console.error('Error fetching outfit:', error);
        router.push('/outfits');
      } finally {
        setIsLoadingOutfit(false);
      }
    };

    // Only fetch outfit after wardrobe is loaded
    if (user && outfitId && !isLoadingWardrobe && Object.keys(itemsByCategory).length > 0) {
      fetchOutfit();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, outfitId, isLoadingWardrobe, router, setMode, setConfiguration, setCategoryIndex, saveDressMeToHistory]);

  // Handle save
  const handleSave = async () => {
    try {
      setIsSavingLocal(true);
      setSaveProgress({ stage: 'generating', progress: 0 });

      // =========================================================================
      // STEP 1: PREPARE RENDER DATA FOR SNAPSHOT
      // =========================================================================

      let renderData: DressMeRenderData | CanvasRenderData;

      if (mode === 'dress-me') {
        // Get current items for each category based on indexes
        const getItem = (category: string): ClothResponse | undefined => {
          const index = categoryIndexes[category] ?? 0;
          const categoryItems = itemsByCategory[category];
          return categoryItems?.[index];
        };

        renderData = {
          configuration,
          items: {
            tops: getItem('tops'),
            outerwear: getItem('outerwear'),
            bottoms: getItem('bottoms'),
            footwear: getItem('footwear'),
            dresses: getItem('dresses'),
          },
        } as DressMeRenderData;
      } else {
        // Canvas mode - not implemented yet for edit
        renderData = {
          items: [],
          wardrobeItems,
          viewport: { zoom: 1, pan: { x: 0, y: 0 } },
        } as CanvasRenderData;
      }

      // =========================================================================
      // STEP 2: GENERATE SNAPSHOT
      // =========================================================================

      let snapshotResult;
      try {
        snapshotResult = await generateOutfitSnapshot(
          outfitId,
          mode,
          renderData,
          {
            onProgress: (progress) => {
              setSaveProgress({ stage: 'generating', progress });
            },
          }
        );
        console.log('[handleSave] Snapshot generated successfully');
      } catch (snapshotError) {
        console.error('[handleSave] Snapshot generation failed:', snapshotError);
        toast.error('Failed to generate outfit preview');
        throw snapshotError;
      }

      // =========================================================================
      // STEP 3: PREPARE UPDATE DATA
      // =========================================================================

      setSaveProgress({ stage: 'saving', progress: 90 });

      const updates: {
        metadata: {
          name: string;
          description?: string;
          tags: string[];
          season: string[];
        };
        previewImage?: {
          url: string;
          publicId: string;
          width: number;
          height: number;
          generatedAt: string;
        };
        combination?: {
          configuration: string;
          items: {
            tops?: string;
            outerwear?: string;
            bottoms?: string;
            footwear?: string;
            dresses?: string;
            accessories: string[];
          };
        };
      } = {
        metadata: {
          name: outfitMetadata.name || 'Untitled Outfit',
          description: outfitMetadata.description,
          tags: outfitMetadata.tags || [],
          season: outfitMetadata.season || [],
        },
        previewImage: {
          url: snapshotResult.url,
          publicId: snapshotResult.publicId,
          width: 1000,
          height: 1000,
          generatedAt: new Date().toISOString(),
        },
      };

      if (mode === 'dress-me') {
        // Convert category indexes to actual item IDs
        // Use index 0 as default if not set (matches what the UI displays)
        const getItemId = (category: string) => {
          const index = categoryIndexes[category] ?? 0;
          const categoryItems = itemsByCategory[category];
          return categoryItems?.[index]?.id;
        };

        // Build items based on configuration
        const items: {
          tops?: string;
          outerwear?: string;
          bottoms?: string;
          footwear?: string;
          dresses?: string;
          accessories: string[];
        } = {
          accessories: [],
        };

        // Only set items for the current configuration
        switch (configuration) {
          case '2-part':
            items.dresses = getItemId('dresses');
            items.footwear = getItemId('footwear');
            break;
          case '3-part':
            items.tops = getItemId('tops');
            items.bottoms = getItemId('bottoms');
            items.footwear = getItemId('footwear');
            break;
          case '4-part':
            items.tops = getItemId('tops');
            items.outerwear = getItemId('outerwear');
            items.bottoms = getItemId('bottoms');
            items.footwear = getItemId('footwear');
            break;
        }

        updates.combination = {
          configuration,
          items,
        };
      }

      // =========================================================================
      // STEP 4: SAVE TO API
      // =========================================================================

      const response = await fetch(`/api/outfits/${outfitId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        toast.success('Outfit updated successfully');
        router.push(`/outfits/${outfitId}`);
      } else {
        console.error('Failed to update outfit');
        toast.error('Failed to update outfit');
      }
    } catch (error) {
      console.error('Error updating outfit:', error);
      toast.error('An error occurred while saving');
    } finally {
      setIsSavingLocal(false);
      setSaveProgress({ stage: 'idle', progress: 0 });
    }
  };

  // Handle shuffle
  const handleShuffle = () => {
    shuffleUnlocked(itemsByCategory);
    saveDressMeToHistory();
  };

  // Handle undo
  const handleUndo = () => {
    navigateHistory('prev');
  };

  // Handle redo
  const handleRedo = () => {
    navigateHistory('next');
  };

  // Loading state
  if (isChecking || isLoadingOutfit || isLoadingWardrobe) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.75rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) return null;

  const categories = getCategories();

  return (
    <div className="min-h-[calc(100vh-3.75rem)] bg-background">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/outfits/${outfitId}`)}
              className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                Edit Outfit
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Modify your outfit combination
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {/* Undo/Redo Buttons (only in dress-me mode) */}
            {mode === 'dress-me' && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleUndo}
                  disabled={!canUndoDressMe()}
                  className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
                  title="Undo"
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRedo}
                  disabled={!canRedoDressMe()}
                  className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
                  title="Redo"
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              variant="outline"
              onClick={() => router.push(`/outfits/${outfitId}`)}
              className="border-border flex-1 sm:flex-initial min-h-[44px] sm:min-h-0"
            >
              <X className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Cancel</span>
            </Button>
            <Button
              onClick={() => setIsSaveDialogOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 flex-1 sm:flex-initial min-h-[44px] sm:min-h-0"
              disabled={isSavingLocal}
            >
              <Save className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Update Outfit</span>
              <span className="sm:hidden">Update</span>
            </Button>
          </div>
        </div>

        {/* Mode Display (read-only in edit mode) */}
        <div className="mb-4 sm:mb-6">
          <p className="text-xs sm:text-sm text-muted-foreground mb-2">Mode:</p>
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-muted rounded-lg">
            {mode === 'dress-me' ? (
              <>
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span className="text-sm sm:text-base font-medium">Dress Me</span>
              </>
            ) : (
              <>
                <Grid3x3 className="h-4 w-4 text-blue-600" />
                <span className="text-sm sm:text-base font-medium">Canvas</span>
              </>
            )}
          </div>
        </div>

        {/* Dress Me Mode */}
        {mode === 'dress-me' && (
          <DressMeMode
            configuration={configuration}
            categories={categories}
            itemsByCategory={itemsByCategory}
            categoryIndexes={categoryIndexes}
            lockedCategories={lockedCategories}
            onConfigurationChange={(config) => {
              setConfiguration(config);
              saveDressMeToHistory();
            }}
            onNavigateCategory={(category, direction, itemCount) => {
              navigateCategory(category, direction, itemCount);
              saveDressMeToHistory();
            }}
            onToggleCategoryLock={toggleCategoryLock}
            onShuffle={handleShuffle}
          />
        )}

        {/* Canvas Mode */}
        {mode === 'canvas' && <CanvasPlaceholder />}
      </div>

      {/* Save Dialog */}
      <OutfitSaveDialog
        isOpen={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
        onSave={handleSave}
        metadata={outfitMetadata}
        onMetadataChange={setOutfitMetadata}
        isSaving={isSavingLocal}
        saveButtonText="Update Outfit"
        saveProgress={saveProgress}
      />
    </div>
  );
}
