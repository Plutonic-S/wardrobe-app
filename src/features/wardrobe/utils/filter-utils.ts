import { ClothResponse, ClothFilters } from "../types/wardrobe.types";

/**
 * Filter wardrobe items based on active filters
 *
 * This function applies all active filters to the wardrobe items array
 * and returns only items that match ALL filter criteria.
 *
 * @param items - Array of wardrobe items to filter
 * @param filters - Active filter criteria
 * @returns Filtered array of wardrobe items
 *
 * @performance
 * - Optimized for large datasets
 * - Short-circuits on first non-match
 * - Case-insensitive string matching
 * - Efficient array operations
 *
 * @example
 * ```ts
 * const filtered = filterWardrobeItems(items, {
 *   category: 'tops',
 *   season: 'summer',
 *   favorite: true,
 *   searchTerm: 'blue shirt'
 * });
 * ```
 */
export function filterWardrobeItems(
  items: ClothResponse[],
  filters: ClothFilters
): ClothResponse[] {
  return items.filter((item) => {
    // Category filter
    if (filters.category && item.category !== filters.category) {
      return false;
    }

    // Season filter
    if (filters.season && !item.season.includes(filters.season)) {
      return false;
    }

    // Style type filter
    if (filters.styleType && item.styleType !== filters.styleType) {
      return false;
    }

    // Favorite filter
    if (filters.favorite !== undefined && item.favorite !== filters.favorite) {
      return false;
    }

    // Status filter
    if (filters.status && item.status !== filters.status) {
      return false;
    }

    // Tags filter (item must have ALL specified tags)
    if (filters.tags && filters.tags.length > 0) {
      const hasAllTags = filters.tags.every((filterTag) =>
        item.tags.some(
          (itemTag) => itemTag.toLowerCase() === filterTag.toLowerCase()
        )
      );
      if (!hasAllTags) {
        return false;
      }
    }

    // Search term filter (searches in name, subcategory, brand, and tags)
    if (filters.searchTerm && filters.searchTerm.trim() !== "") {
      const searchLower = filters.searchTerm.toLowerCase().trim();
      const searchableFields = [
        item.name.toLowerCase(),
        item.subcategory.toLowerCase(),
        item.brand?.toLowerCase() || "",
        ...item.tags.map((tag) => tag.toLowerCase()),
      ];

      const matchesSearch = searchableFields.some((field) =>
        field.includes(searchLower)
      );

      if (!matchesSearch) {
        return false;
      }
    }

    // Item passes all filters
    return true;
  });
}

/**
 * Sort wardrobe items by various criteria
 *
 * @param items - Array of wardrobe items to sort
 * @param sortBy - Sort criterion
 * @param order - Sort order (ascending or descending)
 * @returns Sorted array of wardrobe items
 */
export function sortWardrobeItems(
  items: ClothResponse[],
  sortBy:
    | "name"
    | "category"
    | "lastWorn"
    | "wearCount"
    | "purchaseDate"
    | "price"
    | "createdAt",
  order: "asc" | "desc" = "asc"
): ClothResponse[] {
  const sorted = [...items].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;

      case "category":
        comparison = a.category.localeCompare(b.category);
        break;

      case "lastWorn": {
        const dateA = a.lastWornDate ? new Date(a.lastWornDate).getTime() : 0;
        const dateB = b.lastWornDate ? new Date(b.lastWornDate).getTime() : 0;
        comparison = dateA - dateB;
        break;
      }

      case "wearCount":
        comparison = a.wearCount - b.wearCount;
        break;

      case "purchaseDate": {
        const dateA = a.purchaseDate ? new Date(a.purchaseDate).getTime() : 0;
        const dateB = b.purchaseDate ? new Date(b.purchaseDate).getTime() : 0;
        comparison = dateA - dateB;
        break;
      }

      case "price": {
        const priceA = a.price || 0;
        const priceB = b.price || 0;
        comparison = priceA - priceB;
        break;
      }

      case "createdAt": {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        comparison = dateA - dateB;
        break;
      }

      default:
        comparison = 0;
    }

    return order === "asc" ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Group wardrobe items by a specific field
 *
 * @param items - Array of wardrobe items to group
 * @param groupBy - Field to group by
 * @returns Object with grouped items
 */
export function groupWardrobeItems<K extends keyof ClothResponse>(
  items: ClothResponse[],
  groupBy: K
): Record<string, ClothResponse[]> {
  return items.reduce(
    (acc, item) => {
      const key = String(item[groupBy]);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, ClothResponse[]>
  );
}

/**
 * Get unique values for a specific field across all items
 *
 * Useful for generating filter options dynamically
 *
 * @param items - Array of wardrobe items
 * @param field - Field to extract unique values from
 * @returns Array of unique values
 */
export function getUniqueValues<K extends keyof ClothResponse>(
  items: ClothResponse[],
  field: K
): Array<ClothResponse[K]> {
  const values = items.map((item) => item[field]);
  return Array.from(new Set(values));
}

/**
 * Get all unique tags across all items
 *
 * @param items - Array of wardrobe items
 * @returns Array of unique tags
 */
export function getAllTags(items: ClothResponse[]): string[] {
  const allTags = items.flatMap((item) => item.tags);
  return Array.from(new Set(allTags)).sort();
}

/**
 * Search wardrobe items with fuzzy matching
 *
 * Provides more flexible search than exact matching
 *
 * @param items - Array of wardrobe items
 * @param searchTerm - Search query
 * @param threshold - Minimum match score (0-1)
 * @returns Filtered and scored items
 */
export function fuzzySearchWardrobeItems(
  items: ClothResponse[],
  searchTerm: string,
  threshold: number = 0.3
): Array<{ item: ClothResponse; score: number }> {
  if (!searchTerm.trim()) {
    return items.map((item) => ({ item, score: 1 }));
  }

  const searchLower = searchTerm.toLowerCase().trim();

  const results = items
    .map((item) => {
      const searchableText = [
        item.name,
        item.subcategory,
        item.brand || "",
        ...item.tags,
      ]
        .join(" ")
        .toLowerCase();

      // Simple scoring: count of matching words
      const searchWords = searchLower.split(/\s+/);
      const matchCount = searchWords.filter((word) =>
        searchableText.includes(word)
      ).length;

      const score = matchCount / searchWords.length;

      return { item, score };
    })
    .filter((result) => result.score >= threshold)
    .sort((a, b) => b.score - a.score);

  return results;
}

/**
 * Calculate filter statistics
 *
 * Returns counts for various filter criteria to display
 * in the UI (e.g., "Tops (23)", "Summer (15)")
 *
 * @param items - Array of wardrobe items
 * @returns Object with filter statistics
 */
export function calculateFilterStats(items: ClothResponse[]) {
  const stats = {
    byCategory: {} as Record<string, number>,
    bySeason: {} as Record<string, number>,
    byStatus: {} as Record<string, number>,
    byStyleType: {} as Record<string, number>,
    favorites: 0,
    total: items.length,
  };

  items.forEach((item) => {
    // Category counts
    stats.byCategory[item.category] =
      (stats.byCategory[item.category] || 0) + 1;

    // Season counts (items can have multiple seasons)
    item.season.forEach((season) => {
      stats.bySeason[season] = (stats.bySeason[season] || 0) + 1;
    });

    // Status counts
    stats.byStatus[item.status] = (stats.byStatus[item.status] || 0) + 1;

    // Style type counts
    if (item.styleType) {
      stats.byStyleType[item.styleType] =
        (stats.byStyleType[item.styleType] || 0) + 1;
    }

    // Favorites count
    if (item.favorite) {
      stats.favorites += 1;
    }
  });

  return stats;
}

/**
 * Check if any filters are active
 *
 * @param filters - Filter object
 * @returns True if any filter is active
 */
export function hasActiveFilters(filters: ClothFilters): boolean {
  return Object.values(filters).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && value !== "";
  });
}

/**
 * Clear all filters
 *
 * @returns Empty filter object
 */
export function clearAllFilters(): ClothFilters {
  return {};
}

/**
 * Merge filters (useful for combining multiple filter sources)
 *
 * @param filters - Array of filter objects to merge
 * @returns Merged filter object
 */
export function mergeFilters(...filters: ClothFilters[]): ClothFilters {
  return filters.reduce((acc, filter) => {
    return { ...acc, ...filter };
  }, {} as ClothFilters);
}
