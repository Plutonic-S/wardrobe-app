// src/features/outfit-builder/types/outfit.types.ts

import { ClothResponse, ClothCategory } from '@/features/wardrobe/types/wardrobe.types';

// ============================================================================
// OUTFIT MODES
// ============================================================================

export type OutfitMode = 'dress-me' | 'canvas';
export type DressMeConfiguration = '2-part' | '3-part' | '4-part';
export type OutfitStatus = 'active' | 'archived' | 'deleted';

// ============================================================================
// DRESS ME TYPES
// ============================================================================

/**
 * Outfit combination for Dress Me mode
 */
export interface OutfitCombination {
  tops?: string; // Cloth item ID
  outerwear?: string;
  bottoms?: string;
  footwear?: string;
  accessories: string[]; // Array of Cloth item IDs
}

/**
 * Category slider item (extends ClothResponse)
 */
export interface SliderItem extends ClothResponse {
  index: number; // Position in slider
  isLocked: boolean; // Whether category is locked during shuffle
}

/**
 * Recent combination history item
 */
export interface CombinationHistoryItem {
  combination: OutfitCombination;
  timestamp: Date;
  id: string;
}

// ============================================================================
// CANVAS TYPES
// ============================================================================

/**
 * Canvas item with position and transform data
 */
export interface CanvasItem {
  id: string; // Unique instance ID (for canvas)
  clothItemId: string; // Reference to Cloth item
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number; // 0-360 degrees
  zIndex: number; // Layer order
}

/**
 * Canvas viewport state
 */
export interface CanvasViewport {
  zoom: number; // 0.25 - 4.0
  pan: { x: number; y: number };
}

/**
 * Canvas state (for history/undo-redo)
 */
export interface CanvasState {
  items: CanvasItem[];
  viewport: CanvasViewport;
}

/**
 * Canvas interaction mode
 */
export type CanvasInteractionMode = 'select' | 'pan' | 'draw';

// ============================================================================
// OUTFIT DATA TYPES
// ============================================================================

/**
 * Outfit metadata
 */
export interface OutfitMetadata {
  name: string;
  description?: string;
  tags: string[];
  occasion?: string;
  season: Array<'spring' | 'summer' | 'autumn' | 'winter'>;
}

/**
 * Outfit usage tracking
 */
export interface OutfitUsage {
  lastWornDate?: Date;
  wearCount: number;
  favorite: boolean;
}

/**
 * Outfit social data (Phase 4)
 */
export interface OutfitSocial {
  isPublic: boolean;
  likes: number;
  views: number;
}

/**
 * Complete outfit document (from database)
 */
export interface OutfitDocument {
  id: string;
  userId: string;
  
  // Metadata
  metadata: OutfitMetadata;
  
  // Mode
  mode: OutfitMode;
  
  // Dress Me data
  combination?: {
    configuration: DressMeConfiguration;
    items: OutfitCombination;
  };
  
  // Canvas data
  canvasState?: CanvasState;
  
  // Usage
  usage: OutfitUsage;
  
  // Social
  social: OutfitSocial;
  
  // Status
  status: OutfitStatus;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Outfit with populated cloth items (API response)
 */
export interface OutfitResponse extends OutfitDocument {
  // Populated items for Dress Me mode
  populatedCombination?: {
    configuration: DressMeConfiguration;
    items: {
      tops?: ClothResponse;
      outerwear?: ClothResponse;
      bottoms?: ClothResponse;
      footwear?: ClothResponse;
      accessories: ClothResponse[];
    };
  };
  
  // Populated items for Canvas mode
  populatedCanvasItems?: Array<CanvasItem & { clothItem: ClothResponse }>;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Create outfit request payload
 */
export interface CreateOutfitRequest {
  mode: OutfitMode;
  metadata: OutfitMetadata;
  combination?: {
    configuration: DressMeConfiguration;
    items: OutfitCombination;
  };
  canvasState?: CanvasState;
}

/**
 * Update outfit request payload
 */
export interface UpdateOutfitRequest {
  metadata?: Partial<OutfitMetadata>;
  combination?: {
    configuration: DressMeConfiguration;
    items: OutfitCombination;
  };
  canvasState?: CanvasState;
  status?: OutfitStatus;
}

/**
 * Outfit query filters
 */
export interface OutfitFilters {
  mode?: OutfitMode;
  favorite?: boolean;
  tags?: string[];
  season?: string;
  status?: OutfitStatus;
}

/**
 * Outfit query options
 */
export interface OutfitQueryOptions {
  skip?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'wearCount';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Shuffle outfit request
 */
export interface ShuffleOutfitRequest {
  configuration: DressMeConfiguration;
  lockedCategories?: ClothCategory[];
  currentCombination?: OutfitCombination;
}

/**
 * Shuffle outfit response
 */
export interface ShuffleOutfitResponse {
  combination: OutfitCombination;
  items: {
    tops?: ClothResponse;
    outerwear?: ClothResponse;
    bottoms?: ClothResponse;
    footwear?: ClothResponse;
    accessories: ClothResponse[];
  };
}

// ============================================================================
// UI COMPONENT PROPS
// ============================================================================

/**
 * Outfit builder props
 */
export interface OutfitBuilderProps {
  initialMode?: OutfitMode;
  outfitId?: string; // For editing existing outfit
  onSave?: (outfitId: string) => void;
  onCancel?: () => void;
}

/**
 * Dress Me mode props
 */
export interface DressMeModeProps {
  configuration: DressMeConfiguration;
  onConfigurationChange: (config: DressMeConfiguration) => void;
  onSave: () => void;
}

/**
 * Canvas mode props
 */
export interface CanvasModeProps {
  onSave: () => void;
}

/**
 * Category slider props
 */
export interface CategorySliderProps {
  category: ClothCategory;
  items: ClothResponse[];
  currentIndex: number;
  isLocked: boolean;
  onNavigate: (direction: 'next' | 'prev') => void;
  onToggleLock: () => void;
  onItemClick?: (item: ClothResponse) => void;
}

/**
 * Canvas item props
 */
export interface CanvasItemProps {
  item: CanvasItem;
  clothItem: ClothResponse;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<CanvasItem>) => void;
  onRemove: () => void;
}

/**
 * Outfit save modal props
 */
export interface OutfitSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (metadata: OutfitMetadata) => Promise<void>;
  initialData?: Partial<OutfitMetadata>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Configuration category mapping
 */
export const CONFIG_CATEGORIES: Record<DressMeConfiguration, ClothCategory[]> = {
  '2-part': ['dresses', 'footwear', 'accessories'],
  '3-part': ['tops', 'bottoms', 'footwear', 'accessories'],
  '4-part': ['tops', 'outerwear', 'bottoms', 'footwear', 'accessories'],
};

/**
 * Category labels
 */
export const CATEGORY_LABELS: Record<ClothCategory, string> = {
  tops: 'Tops',
  bottoms: 'Bottoms',
  dresses: 'Dresses',
  outerwear: 'Outerwear',
  footwear: 'Footwear',
  accessories: 'Accessories',
};

/**
 * Canvas constraints
 */
export const CANVAS_CONSTRAINTS = {
  MIN_ZOOM: 0.25,
  MAX_ZOOM: 4,
  MIN_ITEM_SIZE: 50,
  MAX_ITEM_SIZE: 800,
  MAX_HISTORY_STATES: 50,
  DEFAULT_ITEM_SIZE: { width: 200, height: 200 },
  GRID_SIZE: 20,
  SNAP_THRESHOLD: 10,
} as const;

/**
 * Outfit limits
 */
export const OUTFIT_LIMITS = {
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_TAGS: 10,
  MAX_CANVAS_ITEMS: 20,
  MAX_ACCESSORIES: 5,
} as const;

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if outfit is in Dress Me mode
 */
export function isDressMeOutfit(outfit: OutfitDocument): outfit is OutfitDocument & {
  mode: 'dress-me';
  combination: NonNullable<OutfitDocument['combination']>;
} {
  return outfit.mode === 'dress-me' && !!outfit.combination;
}

/**
 * Check if outfit is in Canvas mode
 */
export function isCanvasOutfit(outfit: OutfitDocument): outfit is OutfitDocument & {
  mode: 'canvas';
  canvasState: NonNullable<OutfitDocument['canvasState']>;
} {
  return outfit.mode === 'canvas' && !!outfit.canvasState;
}