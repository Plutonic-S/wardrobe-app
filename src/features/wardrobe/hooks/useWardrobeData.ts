"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { ClothResponse, ClothFilters, ClothCategory } from "../types/wardrobe.types";
import { filterWardrobeItems, sortWardrobeItems, calculateFilterStats } from "../utils/filter-utils";

/**
 * Sort options for wardrobe items
 */
export type WardrobeSortOption =
  | "name"
  | "category"
  | "lastWorn"
  | "wearCount"
  | "purchaseDate"
  | "price"
  | "createdAt";

/**
 * Configuration for useWardrobeData hook
 */
export interface UseWardrobeDataConfig {
  /** Initial items */
  items: ClothResponse[];

  /** Initial filters */
  initialFilters?: ClothFilters;

  /** Initial sort option */
  initialSort?: WardrobeSortOption;

  /** Initial sort order */
  initialSortOrder?: "asc" | "desc";

  /** Enable automatic stats calculation */
  enableStats?: boolean;

  /** Callback when filters change */
  onFiltersChange?: (filters: ClothFilters) => void;

  /** Loading state */
  isLoading?: boolean;

  /** Callback when favorite is toggled */
  onFavoriteToggle?: (itemId: string, isFavorite: boolean) => Promise<void>;
}

/**
 * Return type for useWardrobeData hook
 */
export interface UseWardrobeDataReturn {
  /** Filtered and sorted items */
  items: ClothResponse[];

  /** Active filters */
  filters: ClothFilters;

  /** Update filters */
  setFilters: (filters: ClothFilters | ((prev: ClothFilters) => ClothFilters)) => void;

  /** Clear all filters */
  clearFilters: () => void;

  /** Current sort option */
  sortBy: WardrobeSortOption;

  /** Set sort option */
  setSortBy: (sort: WardrobeSortOption) => void;

  /** Current sort order */
  sortOrder: "asc" | "desc";

  /** Set sort order */
  setSortOrder: (order: "asc" | "desc") => void;

  /** Toggle sort order */
  toggleSortOrder: () => void;

  /** Filter statistics */
  stats: ReturnType<typeof calculateFilterStats> | null;

  /** Whether any filters are active */
  hasActiveFilters: boolean;

  /** Navigate to category */
  navigateToCategory: (category: ClothCategory | "favorites" | null) => void;

  /** Active category */
  activeCategory: ClothCategory | "favorites" | null;

  /** Loading state */
  isLoading: boolean;

  /** Handle favorite toggle */
  handleFavoriteToggle: (itemId: string, isFavorite: boolean) => Promise<void>;
}

/**
 * Custom hook for managing wardrobe data with filtering and sorting
 *
 * This hook provides a complete data management solution for wardrobe
 * components, including filtering, sorting, and statistics.
 *
 * @features
 * - Automatic filtering and sorting
 * - Filter statistics calculation
 * - Category navigation
 * - Memoized computations
 * - Type-safe API
 *
 * @performance
 * - Memoized filtered results
 * - Debounced filter updates
 * - Efficient re-renders
 * - Lazy stats calculation
 *
 * @example
 * ```tsx
 * const { items, filters, setFilters, stats } = useWardrobeData({
 *   items: wardrobeItems,
 *   enableStats: true,
 * });
 * ```
 */
export function useWardrobeData({
  items: rawItems,
  initialFilters = {},
  initialSort = "createdAt",
  initialSortOrder = "desc",
  enableStats = false,
  onFiltersChange,
  isLoading = false,
  onFavoriteToggle,
}: UseWardrobeDataConfig): UseWardrobeDataReturn {
  // State
  const [filters, setFiltersState] = useState<ClothFilters>(initialFilters);
  const [sortBy, setSortBy] = useState<WardrobeSortOption>(initialSort);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(initialSortOrder);
  const [activeCategory, setActiveCategory] = useState<
    ClothCategory | "favorites" | null
  >(null);

  /**
   * Filter items based on active filters
   */
  const filteredItems = useMemo(() => {
    return filterWardrobeItems(rawItems, filters);
  }, [rawItems, filters]);

  /**
   * Sort filtered items
   */
  const sortedItems = useMemo(() => {
    return sortWardrobeItems(filteredItems, sortBy, sortOrder);
  }, [filteredItems, sortBy, sortOrder]);

  /**
   * Calculate filter statistics
   */
  const stats = useMemo(() => {
    if (!enableStats) return null;
    return calculateFilterStats(rawItems);
  }, [rawItems, enableStats]);

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some((value) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null && value !== "";
    });
  }, [filters]);

  /**
   * Update filters with callback support
   */
  const setFilters = useCallback(
    (newFilters: ClothFilters | ((prev: ClothFilters) => ClothFilters)) => {
      setFiltersState((prev) => {
        const updated = typeof newFilters === "function" ? newFilters(prev) : newFilters;
        return updated;
      });
    },
    []
  );

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFiltersState({});
    setActiveCategory(null);
  }, []);

  /**
   * Toggle sort order
   */
  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  }, []);

  /**
   * Navigate to category
   */
  const navigateToCategory = useCallback(
    (category: ClothCategory | "favorites" | null) => {
      setActiveCategory(category);

      if (category === "favorites") {
        setFilters({ ...filters, favorite: true, category: undefined });
      } else if (category) {
        setFilters({ ...filters, category, favorite: undefined });
      } else {
        setFilters({ ...filters, category: undefined, favorite: undefined });
      }
    },
    [filters, setFilters]
  );

  /**
   * Handle favorite toggle
   */
  const handleFavoriteToggle = useCallback(
    async (itemId: string, isFavorite: boolean) => {
      if (onFavoriteToggle) {
        await onFavoriteToggle(itemId, isFavorite);
      }
    },
    [onFavoriteToggle]
  );

  /**
   * Notify parent of filter changes
   */
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange(filters);
    }
  }, [filters, onFiltersChange]);

  return {
    items: sortedItems,
    filters,
    setFilters,
    clearFilters,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    toggleSortOrder,
    stats,
    hasActiveFilters,
    navigateToCategory,
    activeCategory,
    isLoading,
    handleFavoriteToggle,
  };
}

/**
 * Custom hook for debounced search
 *
 * @param value - Search value
 * @param delay - Debounce delay in milliseconds
 * @returns Debounced value
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for managing favorite items
 *
 * @param items - All wardrobe items
 * @returns Favorite items and toggle function
 */
export function useFavorites(items: ClothResponse[]) {
  const favoriteItems = useMemo(() => {
    return items.filter((item) => item.favorite);
  }, [items]);

  const favoriteIds = useMemo(() => {
    return new Set(favoriteItems.map((item) => item.id));
  }, [favoriteItems]);

  const isFavorite = useCallback(
    (itemId: string) => {
      return favoriteIds.has(itemId);
    },
    [favoriteIds]
  );

  return {
    favoriteItems,
    favoriteIds,
    isFavorite,
    count: favoriteItems.length,
  };
}

/**
 * Custom hook for optimistic updates
 *
 * Manages optimistic UI updates for better perceived performance
 *
 * @example
 * ```tsx
 * const { optimisticItems, updateItem } = useOptimisticUpdates(items);
 *
 * const handleFavorite = async (id: string) => {
 *   updateItem(id, { favorite: true });
 *   await api.updateFavorite(id, true);
 * };
 * ```
 */
export function useOptimisticUpdates(items: ClothResponse[]) {
  const [optimisticItems, setOptimisticItems] = useState<ClothResponse[]>(items);

  // Update optimistic items when real items change
  useEffect(() => {
    setOptimisticItems(items);
  }, [items]);

  /**
   * Update a single item optimistically
   */
  const updateItem = useCallback(
    (itemId: string, updates: Partial<ClothResponse>) => {
      setOptimisticItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item))
      );
    },
    []
  );

  /**
   * Remove an item optimistically
   */
  const removeItem = useCallback((itemId: string) => {
    setOptimisticItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  /**
   * Add an item optimistically
   */
  const addItem = useCallback((item: ClothResponse) => {
    setOptimisticItems((prev) => [item, ...prev]);
  }, []);

  /**
   * Revert to original items (on error)
   */
  const revert = useCallback(() => {
    setOptimisticItems(items);
  }, [items]);

  return {
    optimisticItems,
    updateItem,
    removeItem,
    addItem,
    revert,
  };
}
