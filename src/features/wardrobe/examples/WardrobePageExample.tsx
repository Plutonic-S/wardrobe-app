"use client";

import { useState } from "react";
import { WardrobeSidebar } from "../components/WardrobeSidebar";
import { WardrobeGrid } from "../components/WardrobeGrid";
import { useWardrobeData } from "../hooks/useWardrobeData";
import { ClothResponse, ClothFilters } from "../types/wardrobe.types";
import { Button } from "@/components/ui/button";
import { Plus, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Props for WardrobePageExample component
 */
interface WardrobePageExampleProps {
  /** Initial wardrobe items */
  initialItems?: ClothResponse[];

  /** Loading state */
  isLoading?: boolean;

  /** Error state */
  error?: Error | null;

  /** Callback when favorite is toggled */
  onFavoriteToggle?: (itemId: string, isFavorite: boolean) => Promise<void>;

  /** Callback when item is clicked */
  onItemClick?: (item: ClothResponse) => void;

  /** Callback when add item is clicked */
  onAddItem?: () => void;
}

/**
 * WardrobePageExample Component
 *
 * Complete integration example showing how to use WardrobeSidebar and
 * WardrobeGrid together with the useWardrobeData hook.
 *
 * This component demonstrates:
 * - Sidebar and grid integration
 * - Filter synchronization
 * - Category navigation
 * - Responsive layout
 * - Mobile sidebar toggle
 * - Empty states
 * - Loading states
 *
 * @example
 * ```tsx
 * // In your page component
 * export default function WardrobePage() {
 *   const { data: items, isLoading, error } = useWardrobeItems();
 *
 *   const handleFavoriteToggle = async (id: string, isFavorite: boolean) => {
 *     await updateFavoriteMutation.mutateAsync({ id, isFavorite });
 *   };
 *
 *   return (
 *     <WardrobePageExample
 *       initialItems={items}
 *       isLoading={isLoading}
 *       error={error}
 *       onFavoriteToggle={handleFavoriteToggle}
 *     />
 *   );
 * }
 * ```
 */
export function WardrobePageExample({
  initialItems = [],
  isLoading = false,
  error = null,
  onFavoriteToggle,
  onItemClick,
  onAddItem,
}: WardrobePageExampleProps) {
  // Mobile sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Use wardrobe data hook for state management
  const {
    items,
    filters,
    setFilters,
    clearFilters,
    stats,
    hasActiveFilters,
    navigateToCategory,
    activeCategory,
  } = useWardrobeData({
    items: initialItems,
    enableStats: true,
  });

  /**
   * Handle filters change from sidebar
   */
  const handleFiltersChange = (newFilters: ClothFilters) => {
    setFilters(newFilters);
  };

  /**
   * Handle clear filters
   */
  const handleClearFilters = () => {
    clearFilters();
  };

  /**
   * Toggle mobile sidebar
   */
  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50",
          "transform transition-transform duration-300 ease-in-out lg:transform-none",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <WardrobeSidebar
          activeCategory={activeCategory}
          filters={filters}
          onNavigate={navigateToCategory}
          onFiltersChange={handleFiltersChange}
          categoryCounts={stats?.byCategory}
          favoritesCount={stats?.favorites}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="lg:hidden"
                aria-label="Toggle sidebar"
              >
                <SlidersHorizontal className="h-5 w-5" />
              </Button>

              {/* Title and Count */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {activeCategory
                    ? activeCategory === "favorites"
                      ? "Favorites"
                      : activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)
                    : "All Items"}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {items.length} {items.length === 1 ? "item" : "items"}
                  {hasActiveFilters && " (filtered)"}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="gap-2 hidden sm:flex"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              )}

              {/* Add Item */}
              {onAddItem && (
                <Button onClick={onAddItem} className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Item</span>
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Grid Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8">
            <WardrobeGrid
              items={items}
              filters={filters}
              isLoading={isLoading}
              error={error}
              onFavoriteToggle={onFavoriteToggle}
              onItemClick={onItemClick}
              showCategoryHeadings={false}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * Simple Integration Example
 * Minimal example without mobile support
 */
export function SimpleWardrobeExample({
  items,
  isLoading,
}: {
  items: ClothResponse[];
  isLoading?: boolean;
}) {
  const { items: filteredItems, filters, setFilters, navigateToCategory, activeCategory, stats } =
    useWardrobeData({
      items,
      enableStats: true,
    });

  return (
    <div className="flex min-h-screen">
      <WardrobeSidebar
        activeCategory={activeCategory}
        filters={filters}
        onNavigate={navigateToCategory}
        onFiltersChange={setFilters}
        categoryCounts={stats?.byCategory}
        favoritesCount={stats?.favorites}
      />

      <main className="flex-1 p-8">
        <WardrobeGrid items={filteredItems} filters={filters} isLoading={isLoading} />
      </main>
    </div>
  );
}

/**
 * Grid Only Example
 * Shows grid without sidebar for embedded use cases
 */
export function GridOnlyExample({
  items,
  filters,
  isLoading,
  onFavoriteToggle,
}: {
  items: ClothResponse[];
  filters: ClothFilters;
  isLoading?: boolean;
  onFavoriteToggle?: (itemId: string, isFavorite: boolean) => Promise<void>;
}) {
  return (
    <div className="p-6">
      <WardrobeGrid
        items={items}
        filters={filters}
        isLoading={isLoading}
        onFavoriteToggle={onFavoriteToggle}
        showCategoryHeadings={true}
      />
    </div>
  );
}
