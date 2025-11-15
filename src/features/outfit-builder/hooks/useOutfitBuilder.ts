// src/features/outfit-builder/hooks/useOutfitBuilder.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { ClothResponse } from '@/features/wardrobe/types/wardrobe.types';
import type {
  OutfitMode,
  DressMeConfiguration,
  OutfitCombination,
  CanvasItem,
  CanvasState,
} from '../types/outfit.types';

// ============================================================================
// TYPES FOR API CALLS
// ============================================================================

interface OutfitMetadata {
  name: string;
  description?: string;
  tags?: string[];
  occasion?: string;
  season?: Array<'spring' | 'summer' | 'autumn' | 'winter'>;
}

interface DressMePayload {
  mode: 'dress-me';
  metadata: OutfitMetadata;
  combination: {
    configuration: DressMeConfiguration;
    items: {
      tops?: string;
      outerwear?: string;
      bottoms?: string;
      footwear?: string;
      accessories: string[];
    };
  };
}

interface CanvasPayload {
  mode: 'canvas';
  metadata: OutfitMetadata;
  canvasState: {
    items: CanvasItem[];
    viewport: { zoom: number; pan: { x: number; y: number } };
  };
}

type OutfitPayload = DressMePayload | CanvasPayload;

interface OutfitResponse {
  success: boolean;
  data: {
    id: string;
    mode: OutfitMode;
    combination?: {
      configuration: DressMeConfiguration;
      items: Record<string, string>;
    };
    canvasState?: {
      items: CanvasItem[];
      viewport: { zoom: number; pan: { x: number; y: number } };
    };
  };
  message: string;
}

// ============================================================================
// DRESS ME SLICE
// ============================================================================

interface DressMeSlice {
  // State
  configuration: DressMeConfiguration;
  categoryIndexes: Record<string, number>;
  lockedCategories: string[];
  combinationHistory: OutfitCombination[];
  currentHistoryIndex: number;
  
  // Actions
  setConfiguration: (config: DressMeConfiguration) => void;
  navigateCategory: (category: string, direction: 'next' | 'prev', itemCount: number) => void;
  setCategoryIndex: (category: string, index: number) => void;
  toggleCategoryLock: (category: string) => void;
  shuffleUnlocked: (availableItems: Record<string, ClothResponse[]>) => void;
  navigateHistory: (direction: 'next' | 'prev') => void;
  saveDressMeToHistory: () => void;
  // FIX #1: Added helper methods
  canUndoDressMe: () => boolean;
  canRedoDressMe: () => boolean;
}

// ============================================================================
// CANVAS SLICE
// ============================================================================

interface CanvasSlice {
  // State
  canvasItems: CanvasItem[];
  selectedItemId: string | null;
  viewport: { zoom: number; pan: { x: number; y: number } };
  showGrid: boolean;
  canvasHistory: CanvasState[];
  canvasHistoryIndex: number;
  
  // Actions
  addCanvasItem: (item: CanvasItem) => void;
  updateCanvasItem: (id: string, updates: Partial<CanvasItem>) => void;
  removeCanvasItem: (id: string) => void;
  selectCanvasItem: (id: string | null) => void;
  clearCanvas: () => void;
  setViewport: (viewport: Partial<{ zoom: number; pan: { x: number; y: number } }>) => void;
  toggleGrid: () => void;
  autoArrangeCanvas: () => void;
  undoCanvas: () => void;
  redoCanvas: () => void;
  saveCanvasToHistory: () => void;
  // FIX #1: Added helper methods
  canUndoCanvas: () => boolean;
  canRedoCanvas: () => boolean;
}

// ============================================================================
// SHARED SLICE
// ============================================================================

interface SharedSlice {
  // State
  mode: OutfitMode;
  wardrobeItems: ClothResponse[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setMode: (mode: OutfitMode) => void;
  setWardrobeItems: (items: ClothResponse[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  loadOutfit: (outfitId: string) => Promise<void>;
  saveOutfit: (metadata: OutfitMetadata) => Promise<string>;
  reset: () => void;
}

// ============================================================================
// COMBINED STORE
// ============================================================================

type OutfitBuilderStore = DressMeSlice & CanvasSlice & SharedSlice;

export const useOutfitBuilder = create<OutfitBuilderStore>()(
  devtools(
    persist(
      (set, get) => ({
        // ====================================================================
        // DRESS ME STATE
        // ====================================================================
        configuration: '3-part',
        categoryIndexes: {},
        lockedCategories: [],
        combinationHistory: [],
        currentHistoryIndex: -1,
        
        // ====================================================================
        // DRESS ME ACTIONS
        // ====================================================================
        setConfiguration: (config) =>
          set({ configuration: config, categoryIndexes: {} }, false, 'setConfiguration'),
        
        navigateCategory: (category, direction, itemCount) => {
          const { categoryIndexes } = get();
          const currentIndex = categoryIndexes[category] || 0;
          let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
          
          // Circular navigation
          if (newIndex < 0) newIndex = itemCount - 1;
          if (newIndex >= itemCount) newIndex = 0;
          
          set(
            {
              categoryIndexes: {
                ...categoryIndexes,
                [category]: newIndex,
              },
            },
            false,
            'navigateCategory'
          );
        },
        
        setCategoryIndex: (category, index) => {
          const { categoryIndexes } = get();
          set(
            {
              categoryIndexes: {
                ...categoryIndexes,
                [category]: index,
              },
            },
            false,
            'setCategoryIndex'
          );
        },
        
        toggleCategoryLock: (category) => {
          const { lockedCategories } = get();
          const newLocked = [...lockedCategories];
          
          const index = newLocked.indexOf(category);
          if (index > -1) {
            newLocked.splice(index, 1);
          } else {
            newLocked.push(category);
          }
          
          set({ lockedCategories: newLocked }, false, 'toggleCategoryLock');
        },
        
        shuffleUnlocked: (availableItems) => {
          const { lockedCategories, categoryIndexes } = get();
          const newIndexes = { ...categoryIndexes };
          
          Object.keys(availableItems).forEach((category) => {
            if (!lockedCategories.includes(category)) {
              const items = availableItems[category];
              if (items && items.length > 0) {
                newIndexes[category] = Math.floor(Math.random() * items.length);
              }
            }
          });
          
          set({ categoryIndexes: newIndexes }, false, 'shuffleUnlocked');
        },
        
        // FIX #2: Now actually restores the combination when navigating history
        navigateHistory: (direction) => {
          const { combinationHistory, currentHistoryIndex } = get();
          const newIndex = direction === 'next' ? currentHistoryIndex + 1 : currentHistoryIndex - 1;
          
          if (newIndex >= 0 && newIndex < combinationHistory.length) {
            const historicalCombination = combinationHistory[newIndex];
            
            // Restore the category indexes from history
            const restoredIndexes: Record<string, number> = {};
            if (historicalCombination.tops) restoredIndexes.tops = parseInt(historicalCombination.tops);
            if (historicalCombination.outerwear) restoredIndexes.outerwear = parseInt(historicalCombination.outerwear);
            if (historicalCombination.bottoms) restoredIndexes.bottoms = parseInt(historicalCombination.bottoms);
            if (historicalCombination.footwear) restoredIndexes.footwear = parseInt(historicalCombination.footwear);
            
            set(
              {
                currentHistoryIndex: newIndex,
                categoryIndexes: restoredIndexes,
              },
              false,
              'navigateHistory'
            );
          }
        },
        
        saveDressMeToHistory: () => {
          const { combinationHistory, currentHistoryIndex, categoryIndexes } = get();
          
          // Create snapshot of current combination
          const snapshot: OutfitCombination = {
            tops: categoryIndexes.tops?.toString(),
            outerwear: categoryIndexes.outerwear?.toString(),
            bottoms: categoryIndexes.bottoms?.toString(),
            footwear: categoryIndexes.footwear?.toString(),
            accessories: [],
          };
          
          // Trim history if navigated back
          const newHistory = combinationHistory.slice(0, currentHistoryIndex + 1);
          newHistory.push(snapshot);
          
          // Limit history size
          if (newHistory.length > 50) {
            newHistory.shift();
          }
          
          set(
            {
              combinationHistory: newHistory,
              currentHistoryIndex: newHistory.length - 1,
            },
            false,
            'saveDressMeToHistory'
          );
        },
        
        // FIX #1: Helper methods to check if undo/redo are available
        canUndoDressMe: () => {
          const { currentHistoryIndex } = get();
          return currentHistoryIndex > 0;
        },
        
        canRedoDressMe: () => {
          const { combinationHistory, currentHistoryIndex } = get();
          return currentHistoryIndex < combinationHistory.length - 1;
        },
        
        // ====================================================================
        // CANVAS STATE
        // ====================================================================
        canvasItems: [],
        selectedItemId: null,
        viewport: { zoom: 1, pan: { x: 0, y: 0 } },
        showGrid: false,
        canvasHistory: [],
        canvasHistoryIndex: -1,
        
        // ====================================================================
        // CANVAS ACTIONS
        // ====================================================================
        addCanvasItem: (item) => {
          const { canvasItems } = get();
          set({ canvasItems: [...canvasItems, item] }, false, 'addCanvasItem');
          get().saveCanvasToHistory();
        },
        
        updateCanvasItem: (id, updates) => {
          const { canvasItems } = get();
          set(
            {
              canvasItems: canvasItems.map((item) =>
                item.id === id ? { ...item, ...updates } : item
              ),
            },
            false,
            'updateCanvasItem'
          );
          // FIX #3: Don't save to history on every update to avoid performance issues
          // This will be called manually after drag ends
        },
        
        removeCanvasItem: (id) => {
          const { canvasItems, selectedItemId } = get();
          set(
            {
              canvasItems: canvasItems.filter((item) => item.id !== id),
              selectedItemId: selectedItemId === id ? null : selectedItemId,
            },
            false,
            'removeCanvasItem'
          );
          get().saveCanvasToHistory();
        },
        
        selectCanvasItem: (id) =>
          set({ selectedItemId: id }, false, 'selectCanvasItem'),
        
        clearCanvas: () => {
          set({ canvasItems: [], selectedItemId: null }, false, 'clearCanvas');
          get().saveCanvasToHistory();
        },
        
        setViewport: (viewport) => {
          const { viewport: currentViewport } = get();
          set(
            { viewport: { ...currentViewport, ...viewport } },
            false,
            'setViewport'
          );
        },
        
        toggleGrid: () => {
          const { showGrid } = get();
          set({ showGrid: !showGrid }, false, 'toggleGrid');
        },
        
        autoArrangeCanvas: () => {
          const { canvasItems } = get();
          const spacing = 50;
          
          const arrangedItems = canvasItems.map((item, index) => ({
            ...item,
            position: {
              x: 100,
              y: 100 + index * (item.size.height + spacing),
            },
          }));
          
          set({ canvasItems: arrangedItems }, false, 'autoArrangeCanvas');
          get().saveCanvasToHistory();
        },
        
        undoCanvas: () => {
          const { canvasHistory, canvasHistoryIndex } = get();
          if (canvasHistoryIndex > 0) {
            const newIndex = canvasHistoryIndex - 1;
            const state = canvasHistory[newIndex];
            set(
              {
                canvasItems: state.items,
                viewport: state.viewport,
                canvasHistoryIndex: newIndex,
              },
              false,
              'undoCanvas'
            );
          }
        },
        
        redoCanvas: () => {
          const { canvasHistory, canvasHistoryIndex } = get();
          if (canvasHistoryIndex < canvasHistory.length - 1) {
            const newIndex = canvasHistoryIndex + 1;
            const state = canvasHistory[newIndex];
            set(
              {
                canvasItems: state.items,
                viewport: state.viewport,
                canvasHistoryIndex: newIndex,
              },
              false,
              'redoCanvas'
            );
          }
        },
        
        saveCanvasToHistory: () => {
          const { canvasItems, viewport, canvasHistory, canvasHistoryIndex } = get();
          
          const snapshot: CanvasState = {
            items: [...canvasItems],
            viewport: { ...viewport },
          };
          
          // Trim history if navigated back
          const newHistory = canvasHistory.slice(0, canvasHistoryIndex + 1);
          newHistory.push(snapshot);
          
          // Limit history size to 50 states
          if (newHistory.length > 50) {
            newHistory.shift();
          }
          
          set(
            {
              canvasHistory: newHistory,
              canvasHistoryIndex: newHistory.length - 1,
            },
            false,
            'saveCanvasToHistory'
          );
        },
        
        // FIX #1: Helper methods to check if undo/redo are available
        canUndoCanvas: () => {
          const { canvasHistoryIndex } = get();
          return canvasHistoryIndex > 0;
        },
        
        canRedoCanvas: () => {
          const { canvasHistory, canvasHistoryIndex } = get();
          return canvasHistoryIndex < canvasHistory.length - 1;
        },
        
        // ====================================================================
        // SHARED STATE
        // ====================================================================
        mode: 'dress-me',
        wardrobeItems: [],
        isLoading: false,
        error: null,
        
        // ====================================================================
        // SHARED ACTIONS
        // ====================================================================
        setMode: (mode) => set({ mode }, false, 'setMode'),
        
        setWardrobeItems: (items) =>
          set({ wardrobeItems: items }, false, 'setWardrobeItems'),
        
        setLoading: (loading) => set({ isLoading: loading }, false, 'setLoading'),
        
        setError: (error) => set({ error }, false, 'setError'),
        
        loadOutfit: async (outfitId) => {
          set({ isLoading: true, error: null }, false, 'loadOutfit:start');
          
          try {
            const response = await fetch(`/api/outfits/${outfitId}`);
            if (!response.ok) throw new Error('Failed to load outfit');
            
            const result = (await response.json()) as OutfitResponse;
            
            // Load into appropriate mode
            if (result.data.mode === 'dress-me') {
              // FIX #4: Properly populate categoryIndexes from loaded combination
              const loadedIndexes: Record<string, number> = {};
              if (result.data.combination?.items) {
                const items = result.data.combination.items;
                if (items.tops) loadedIndexes.tops = parseInt(items.tops);
                if (items.outerwear) loadedIndexes.outerwear = parseInt(items.outerwear);
                if (items.bottoms) loadedIndexes.bottoms = parseInt(items.bottoms);
                if (items.footwear) loadedIndexes.footwear = parseInt(items.footwear);
              }
              
              set(
                {
                  mode: 'dress-me',
                  configuration: result.data.combination?.configuration || '3-part',
                  categoryIndexes: loadedIndexes,
                  isLoading: false,
                },
                false,
                'loadOutfit:success:dress-me'
              );
            } else {
              set(
                {
                  mode: 'canvas',
                  canvasItems: result.data.canvasState?.items || [],
                  viewport: result.data.canvasState?.viewport || { zoom: 1, pan: { x: 0, y: 0 } },
                  isLoading: false,
                },
                false,
                'loadOutfit:success:canvas'
              );
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            set(
              { error: errorMessage, isLoading: false },
              false,
              'loadOutfit:error'
            );
          }
        },
        
        saveOutfit: async (metadata) => {
          set({ isLoading: true, error: null }, false, 'saveOutfit:start');
          
          try {
            const { mode, configuration, categoryIndexes, wardrobeItems, canvasItems, viewport } = get();
            
            let payload: OutfitPayload;
            
            if (mode === 'dress-me') {
              // Group wardrobe items by category
              const itemsByCategory = wardrobeItems.reduce((acc, item) => {
                const category = item.category;
                if (!acc[category]) {
                  acc[category] = [];
                }
                acc[category].push(item);
                return acc;
              }, {} as Record<string, ClothResponse[]>);
              
              // Convert indexes to actual item IDs
              const getItemId = (category: string): string | undefined => {
                const index = categoryIndexes[category];
                if (index === undefined) return undefined;
                const categoryItems = itemsByCategory[category] || [];
                return categoryItems[index]?.id;
              };
              
              payload = {
                mode: 'dress-me',
                metadata,
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
                mode: 'canvas',
                metadata,
                canvasState: {
                  items: canvasItems,
                  viewport,
                },
              };
            }
            
            const response = await fetch('/api/outfits', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            
            if (!response.ok) throw new Error('Failed to save outfit');
            
            const result = await response.json();
            console.log('[saveOutfit] Full response:', result);
            console.log('[saveOutfit] result.data:', result.data);
            console.log('[saveOutfit] result.data.outfit:', result.data.outfit);
            set({ isLoading: false }, false, 'saveOutfit:success');
            
            // API returns { success: true, data: { outfit: { _id: '...' } } }
            const outfitId = result.data?.outfit?._id?.toString() || result.data?.outfit?.id;
            if (!outfitId) {
              throw new Error('No outfit ID in response');
            }
            return outfitId;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            set({ error: errorMessage, isLoading: false }, false, 'saveOutfit:error');
            throw error;
          }
        },
        
        reset: () =>
          set(
            {
              // Dress Me
              configuration: '3-part',
              categoryIndexes: {},
              lockedCategories: [],
              combinationHistory: [],
              currentHistoryIndex: -1,
              
              // Canvas
              canvasItems: [],
              selectedItemId: null,
              viewport: { zoom: 1, pan: { x: 0, y: 0 } },
              showGrid: false,
              canvasHistory: [],
              canvasHistoryIndex: -1,
              
              // Shared
              mode: 'dress-me',
              error: null,
            },
            false,
            'reset'
          ),
      }),
      {
        name: 'outfit-builder-storage',
        partialize: (state) => ({
          configuration: state.configuration,
          mode: state.mode,
          showGrid: state.showGrid,
          lockedCategories: state.lockedCategories,
        }),
      }
    )
  )
);