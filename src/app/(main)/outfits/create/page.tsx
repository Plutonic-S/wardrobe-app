'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/features/auth/components/authGuard';
import { useOutfitBuilder } from '@/features/outfit-builder/hooks/useOutfitBuilder';
import { Button } from '@/components/ui/button';
import { Sparkles, Save, X } from 'lucide-react';
import type { ClothResponse } from '@/features/wardrobe/types/wardrobe.types';
import type { OutfitMetadata } from '@/features/outfit-builder/types/outfit.types';
import {
  ModeSelector,
  DressMeMode,
  CanvasMode,
  OutfitSaveDialog,
} from '@/features/outfit-builder/components';
import { generateOutfitSnapshot } from '@/features/outfit-builder/services/outfit-snapshot.service';
import type {
  DressMeRenderData,
  CanvasRenderData,
} from '@/features/outfit-builder/components/shared/OutfitRenderer';
import { toast } from 'sonner';

export default function CreateOutfitPage() {
  const router = useRouter();
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
    canvasItems,
  } = useOutfitBuilder();

  // Local state
  const [isLoadingWardrobe, setIsLoadingWardrobe] = useState(true);
  const hasLoadedRef = useRef(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
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

  // Fetch wardrobe items
  useEffect(() => {
    const fetchWardrobe = async () => {
      try {
        // Only show loading spinner on initial load
        if (!hasLoadedRef.current) {
          setIsLoadingWardrobe(true);
        }
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
        hasLoadedRef.current = true;
      }
    };

    if (user) {
      fetchWardrobe();
    }
  }, [user, setWardrobeItems]);

  // Initialize category indexes when wardrobe items or configuration changes
  useEffect(() => {
    if (wardrobeItems.length === 0) return;

    const categories = getCategories();
    categories.forEach((category) => {
      const categoryItems = wardrobeItems.filter((item) => item.category === category);
      if (categoryItems.length > 0 && categoryIndexes[category] === undefined) {
        console.log(`[Init] Setting ${category} index to 0 (has ${categoryItems.length} items)`);
        setCategoryIndex(category, 0);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wardrobeItems, configuration]);

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

  // Group items by category
  const itemsByCategory = wardrobeItems.reduce((acc, item) => {
    const category = item.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, ClothResponse[]>);

  // Handle save with snapshot generation
  const handleSave = async () => {
    try {
      console.log('[handleSave] Mode:', mode);
      console.log('[handleSave] CategoryIndexes:', categoryIndexes);
      console.log('[handleSave] CanvasItems:', canvasItems);

      // Reset progress
      setSaveProgress({ stage: 'idle', progress: 0 });

      // =========================================================================
      // STEP 1: VALIDATE ITEMS
      // =========================================================================

      if (mode === 'dress-me') {
        const categories = getCategories();
        console.log('[handleSave] Categories for config:', categories);

        const hasValidItems = categories.some(cat => {
          const index = categoryIndexes[cat];
          const items = itemsByCategory[cat] || [];
          const hasItem = index !== undefined && items[index] !== undefined;
          console.log(`[handleSave] ${cat}: index=${index}, hasItems=${items.length}, valid=${hasItem}`);
          return hasItem;
        });

        if (!hasValidItems) {
          toast.error('No items selected', {
            description: 'Please select at least one clothing item before saving',
          });
          return;
        }
      }

      if (mode === 'canvas') {
        if (canvasItems.length === 0) {
          toast.error('No items on canvas', {
            description: 'Please add at least one item to the canvas before saving',
          });
          return;
        }
      }

      // =========================================================================
      // STEP 2: BUILD RENDER DATA
      // =========================================================================

      let renderData: DressMeRenderData | CanvasRenderData;
      const tempOutfitId = `temp_${Date.now()}`;

      if (mode === 'dress-me') {
        // Get current items based on category indexes
        const getCurrentItem = (category: string): ClothResponse | undefined => {
          const index = categoryIndexes[category];
          if (index === undefined) return undefined;
          const categoryItems = itemsByCategory[category] || [];
          return categoryItems[index];
        };

        renderData = {
          configuration,
          items: {
            tops: getCurrentItem('tops'),
            outerwear: getCurrentItem('outerwear'),
            bottoms: getCurrentItem('bottoms'),
            dresses: getCurrentItem('dresses'),
            footwear: getCurrentItem('footwear'),
            accessories: [], // TODO: Add accessories support
          },
        } as DressMeRenderData;
      } else {
        // Canvas mode
        renderData = {
          items: canvasItems,
          wardrobeItems,
          viewport: { zoom: 1, pan: { x: 0, y: 0 } },
        } as CanvasRenderData;
      }

      // =========================================================================
      // STEP 3: GENERATE SNAPSHOT
      // =========================================================================

      setSaveProgress({ stage: 'generating', progress: 0 });
      console.log('[handleSave] Generating snapshot...');
      console.log('[handleSave] Render data:', mode === 'dress-me' ? {
        configuration: (renderData as DressMeRenderData).configuration,
        items: Object.entries((renderData as DressMeRenderData).items).map(([key, item]) => ({
          category: key,
          hasItem: !!item,
          id: Array.isArray(item) ? `[${item.length} items]` : (item as ClothResponse | undefined)?.id
        }))
      } : {
        itemCount: (renderData as CanvasRenderData).items.length
      });

      let snapshotResult;
      try {
        // Note: html2canvas color warnings are suppressed in the snapshot service
        snapshotResult = await generateOutfitSnapshot(
          tempOutfitId,
          mode,
          renderData,
          {
            onProgress: (progress) => {
              console.log('[handleSave] Snapshot progress:', progress);
              setSaveProgress({ stage: 'generating', progress });
            },
          }
        );

        console.log('[handleSave] Snapshot generated successfully:', {
          url: snapshotResult.url,
          publicId: snapshotResult.publicId,
          hasComposition: !!snapshotResult.composition,
          checksum: snapshotResult.checksum
        });
      } catch (snapshotError) {
        console.error('[handleSave] Snapshot generation FAILED:', snapshotError);
        toast.error('Failed to generate outfit preview', {
          description: snapshotError instanceof Error ? snapshotError.message : 'Unknown error',
        });
        throw snapshotError;
      }

      // =========================================================================
      // STEP 4: PREPARE OUTFIT DATA WITH SNAPSHOT
      // =========================================================================

      setSaveProgress({ stage: 'saving', progress: 90 });

      const metadata: OutfitMetadata = {
        name: outfitMetadata.name || 'Untitled Outfit',
        description: outfitMetadata.description,
        tags: outfitMetadata.tags || [],
        season: outfitMetadata.season || [],
      };

      // Build payload with snapshot and composition
      const basePayload = {
        mode,
        metadata,
        previewImage: {
          url: snapshotResult.url,
          publicId: snapshotResult.publicId,
          width: 1000,
          height: 1000,
          generatedAt: new Date().toISOString(),
        },
        composition: snapshotResult.composition,
      };

      // Add mode-specific data
      let payload;
      if (mode === 'dress-me') {
        const getItemId = (category: string): string | undefined => {
          const index = categoryIndexes[category];
          if (index === undefined) return undefined;
          const categoryItems = itemsByCategory[category] || [];
          return categoryItems[index]?.id;
        };

        payload = {
          ...basePayload,
          combination: {
            configuration,
            items: {
              tops: getItemId('tops'),
              outerwear: getItemId('outerwear'),
              bottoms: getItemId('bottoms'),
              footwear: getItemId('footwear'),
              accessories: [],
            },
          },
        };
      } else {
        payload = {
          ...basePayload,
          canvasState: {
            items: canvasItems,
            viewport: { zoom: 1, pan: { x: 0, y: 0 } },
          },
        };
      }

      // =========================================================================
      // STEP 5: POST OUTFIT TO API
      // =========================================================================

      console.log('[handleSave] Posting outfit with payload:', payload);

      const response = await fetch('/api/outfits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to save outfit');
      }

      const result = await response.json();
      const outfitId = result.data?.outfit?._id?.toString() || result.data?.outfit?.id;

      if (!outfitId) {
        throw new Error('No outfit ID in response');
      }

      // =========================================================================
      // STEP 6: SUCCESS
      // =========================================================================

      setSaveProgress({ stage: 'idle', progress: 100 });
      console.log('[handleSave] Outfit saved successfully:', outfitId);

      toast.success('Outfit saved!', {
        description: 'Your outfit has been saved with a preview image.',
      });

      // Close dialog and navigate
      setIsSaveDialogOpen(false);
      router.push(`/outfits`);

    } catch (error) {
      console.error('[handleSave] Error:', error);
      setSaveProgress({ stage: 'idle', progress: 0 });

      toast.error('Failed to save outfit', {
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  };

  // Handle shuffle
  const handleShuffle = () => {
    shuffleUnlocked(itemsByCategory);
  };

  // Loading state
  if (isChecking || isLoadingWardrobe) {
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
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
              Create Outfit
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Mix and match your wardrobe items
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/outfits')}
              className="border-border flex-1 sm:flex-initial min-h-[44px] sm:min-h-0"
            >
              <X className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Cancel</span>
            </Button>
            <Button
              onClick={() => setIsSaveDialogOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 flex-1 sm:flex-initial min-h-[44px] sm:min-h-0"
              disabled={saveProgress.stage !== 'idle'}
            >
              <Save className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Save Outfit</span>
              <span className="sm:hidden">Save</span>
            </Button>
          </div>
        </div>

        {/* Mode Selector */}
        <ModeSelector mode={mode} onModeChange={setMode} />

        {/* Dress Me Mode */}
        {mode === 'dress-me' && (
          <DressMeMode
            configuration={configuration}
            categories={categories}
            itemsByCategory={itemsByCategory}
            categoryIndexes={categoryIndexes}
            lockedCategories={lockedCategories}
            onConfigurationChange={setConfiguration}
            onNavigateCategory={navigateCategory}
            onToggleCategoryLock={toggleCategoryLock}
            onShuffle={handleShuffle}
          />
        )}

        {/* Canvas Mode */}
        {mode === 'canvas' && <CanvasMode />}
      </div>

      {/* Save Dialog */}
      <OutfitSaveDialog
        isOpen={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
        onSave={handleSave}
        metadata={outfitMetadata}
        onMetadataChange={setOutfitMetadata}
        isSaving={saveProgress.stage !== 'idle'}
        saveProgress={saveProgress}
      />
    </div>
  );
}
