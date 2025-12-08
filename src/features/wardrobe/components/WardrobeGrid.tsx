"use client";

import { useMemo, useCallback, useState, useRef, useEffect } from "react";
import { ClothResponse, ClothFilters } from "../types/wardrobe.types";
import { WardrobeItemCard } from "./WardrobeItemCard";
import { WardrobeGridSkeleton } from "./WardrobeGridSkeleton";
import { WardrobeGridEmpty } from "./WardrobeGridEmpty";
import { filterWardrobeItems } from "../utils/filter-utils";
import { cn } from "@/lib/utils";

/**
 * Category display order for grouping
 */
const CATEGORY_ORDER = ['tops', 'outerwear', 'bottoms', 'footwear', 'dresses', 'accessories'];

/**
 * Props for WardrobeGrid component
 */
export interface WardrobeGridProps {
  /** Wardrobe items to display */
  items: ClothResponse[];

  /** Active filters */
  filters: ClothFilters;

  /** Loading state */
  isLoading?: boolean;

  /** Error state */
  error?: Error | null;

  /** Callback when favorite is toggled */
  onFavoriteToggle?: (itemId: string, isFavorite: boolean) => Promise<void>;

  /** Callback when item is clicked */
  onItemClick?: (item: ClothResponse) => void;

  /** Callback when add item button is clicked */
  onAddItem?: () => void;

  /** Show section headings by category */
  showCategoryHeadings?: boolean;

  /** Additional CSS classes */
  className?: string;

  /** Custom empty state message */
  emptyMessage?: string;

  /** Custom empty state description */
  emptyDescription?: string;

  /** Disable animations */
  disableAnimations?: boolean;
}

/**
 * WardrobeGrid Component
 *
 * A responsive grid layout for displaying wardrobe items with comprehensive
 * state management, filtering, and accessibility features.
 *
 * @features
 * - Responsive grid (1-4 columns based on viewport)
 * - Client-side filtering with memoization
 * - Loading, empty, and error states
 * - Smooth animations and transitions
 * - Category section grouping
 * - Real-time filter updates
 * - Optimistic favorite updates
 *
 * @accessibility
 * - ARIA live regions for dynamic content updates
 * - Semantic HTML structure
 * - Screen reader announcements for filter changes
 * - Keyboard navigation support
 * - Focus management
 *
 * @performance
 * - Memoized filtering logic
 * - Optimized re-renders with React.memo on cards
 * - CSS Grid for efficient layout
 * - Debounced search handled by parent
 *
 * @responsive
 * - Mobile (<768px): 1 column, 16px gap
 * - Tablet (768-1023px): 2 columns, 20px gap
 * - Desktop (1024px+): 3-4 columns, 24px gap
 */
export function WardrobeGrid({
  items,
  filters,
  isLoading = false,
  error = null,
  onFavoriteToggle,
  onItemClick,
  onAddItem,
  showCategoryHeadings = false,
  className,
  emptyMessage,
  emptyDescription,
  disableAnimations = false,
}: WardrobeGridProps) {
  // Track announcements for screen readers
  const [announcement, setAnnouncement] = useState<string>("");
  const announcementTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Filter items based on active filters
   * Memoized to prevent unnecessary re-filtering
   */
  const filteredItems = useMemo(() => {
    return filterWardrobeItems(items, filters);
  }, [items, filters]);

  /**
   * Group items by category if section headings are enabled
   */
  const itemsByCategory = useMemo(() => {
    if (!showCategoryHeadings) {
      return { all: filteredItems };
    }

    // Group by category
    const grouped = filteredItems.reduce(
      (acc, item) => {
        const category = item.category;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(item);
        return acc;
      },
      {} as Record<string, ClothResponse[]>
    );

    // Sort by predefined order and filter out empty categories
    const sortedGrouped: Record<string, ClothResponse[]> = {};
    CATEGORY_ORDER.forEach(category => {
      if (grouped[category] && grouped[category].length > 0) {
        sortedGrouped[category] = grouped[category];
      }
    });
    
    // Add any remaining categories not in the order list
    Object.keys(grouped).forEach(category => {
      if (!CATEGORY_ORDER.includes(category) && grouped[category].length > 0) {
        sortedGrouped[category] = grouped[category];
      }
    });

    return sortedGrouped;
  }, [filteredItems, showCategoryHeadings]);

  /**
   * Announce filter changes to screen readers
   */
  useEffect(() => {
    // Clear existing timeout
    if (announcementTimeoutRef.current) {
      clearTimeout(announcementTimeoutRef.current);
    }

    if (!isLoading && filteredItems.length > 0) {
      const message = `Showing ${filteredItems.length} ${
        filteredItems.length === 1 ? "item" : "items"
      }`;
      setAnnouncement(message);

      // Clear announcement after 3 seconds
      announcementTimeoutRef.current = setTimeout(() => {
        setAnnouncement("");
      }, 3000);
    }

    return () => {
      if (announcementTimeoutRef.current) {
        clearTimeout(announcementTimeoutRef.current);
      }
    };
  }, [filteredItems.length, isLoading]);

  /**
   * Handle favorite toggle with optimistic update
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
   * Handle item click
   */
  const handleItemClick = useCallback(
    (item: ClothResponse) => {
      if (onItemClick) {
        onItemClick(item);
      }
    },
    [onItemClick]
  );

  /**
   * Get category display name
   */
  const getCategoryDisplayName = (category: string): string => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  // Show loading skeleton
  if (isLoading) {
    return <WardrobeGridSkeleton className={className} />;
  }

  // Show error state
  if (error) {
    return (
      <WardrobeGridEmpty
        title="Something went wrong"
        description={error.message || "Unable to load your wardrobe items. Please try again."}
        actionLabel="Retry"
        className={className}
      />
    );
  }

  // Show empty state
  if (filteredItems.length === 0) {
    const hasActiveFilters = Object.values(filters).some((value) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null && value !== "";
    });

    return (
      <WardrobeGridEmpty
        title={emptyMessage || (hasActiveFilters ? "No items match your filters" : "Your wardrobe is empty")}
        description={
          emptyDescription ||
          (hasActiveFilters
            ? "Try adjusting your filters to see more items."
            : "Start building your digital wardrobe by adding your first item.")
        }
        showClearFilters={hasActiveFilters}
        showAddButton={!hasActiveFilters}
        onAddItem={onAddItem}
        className={className}
      />
    );
  }

  return (
    <div className={cn("w-full", className)} role="region" aria-label="Wardrobe items grid">
      {/* Screen reader announcements */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </div>

      {/* Grid content */}
      <div className="space-y-8">
        {Object.entries(itemsByCategory).map(([category, categoryItems]) => (
          <section
            key={category}
            className={cn(
              "space-y-4",
              disableAnimations ? "" : "animate-in fade-in duration-300"
            )}
            aria-labelledby={showCategoryHeadings ? `category-${category}` : undefined}
          >
            {/* Category heading */}
            {showCategoryHeadings && category !== "all" && (
              <div className="flex items-center justify-between">
                <h2
                  id={`category-${category}`}
                  className="text-xl font-bold text-foreground capitalize"
                >
                  {getCategoryDisplayName(category)}
                </h2>
                <span className="text-sm text-muted-foreground">
                  {categoryItems.length} {categoryItems.length === 1 ? "item" : "items"}
                </span>
              </div>
            )}

            {/* Grid */}
            <div
              className={cn(
                // Base grid styles
                "grid gap-4 md:gap-5 lg:gap-6",
                // Responsive columns
                "grid-cols-1",
                "sm:grid-cols-2",
                "lg:grid-cols-3",
                "xl:grid-cols-4",
                // Auto-fit for very large screens
                "2xl:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]",
                // Animation
                disableAnimations ? "" : "transition-all duration-300 ease-in-out"
              )}
              role="list"
            >
              {categoryItems.map((item, index) => (
                <div
                  key={item.id}
                  role="listitem"
                  className={cn(
                    disableAnimations
                      ? ""
                      : "animate-in fade-in slide-in-from-bottom-4",
                    disableAnimations
                      ? ""
                      : `duration-500 ease-out`
                  )}
                  style={
                    disableAnimations
                      ? undefined
                      : {
                          animationDelay: `${Math.min(index * 50, 300)}ms`,
                        }
                  }
                >
                  <WardrobeItemCard
                    item={item}
                    onFavoriteToggle={handleFavoriteToggle}
                    onClick={handleItemClick}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Results summary for screen readers */}
      <div className="sr-only" role="status">
        {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"}{" "}
        displayed in wardrobe grid
      </div>
    </div>
  );
}
