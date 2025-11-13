'use client';

import { useState, useEffect } from 'react';
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
  CanvasPlaceholder,
  OutfitSaveDialog,
} from '@/features/outfit-builder/components';

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
    navigateCategory,
    lockedCategories,
    toggleCategoryLock,
    shuffleUnlocked,
    saveOutfit,
    isLoading: isSaving,
  } = useOutfitBuilder();

  // Local state
  const [isLoadingWardrobe, setIsLoadingWardrobe] = useState(true);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [outfitMetadata, setOutfitMetadata] = useState<Partial<OutfitMetadata>>({
    name: '',
    description: '',
    tags: [],
    season: [],
  });

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

  // Group items by category
  const itemsByCategory = wardrobeItems.reduce((acc, item) => {
    const category = item.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, ClothResponse[]>);

  // Handle save
  const handleSave = async () => {
    try {
      const metadata: OutfitMetadata = {
        name: outfitMetadata.name || 'Untitled Outfit',
        description: outfitMetadata.description,
        tags: outfitMetadata.tags || [],
        season: outfitMetadata.season || [],
      };

      const outfitId = await saveOutfit(metadata);
      router.push(`/outfits/${outfitId}`);
    } catch (error) {
      console.error('Error saving outfit:', error);
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
              disabled={isSaving}
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
        {mode === 'canvas' && <CanvasPlaceholder />}
      </div>

      {/* Save Dialog */}
      <OutfitSaveDialog
        isOpen={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
        onSave={handleSave}
        metadata={outfitMetadata}
        onMetadataChange={setOutfitMetadata}
        isSaving={isSaving}
      />
    </div>
  );
}
