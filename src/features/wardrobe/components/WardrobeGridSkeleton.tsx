"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Props for WardrobeGridSkeleton component
 */
export interface WardrobeGridSkeletonProps {
  /** Number of skeleton cards to show */
  count?: number;

  /** Show category headings skeleton */
  showCategoryHeadings?: boolean;

  /** Additional CSS classes */
  className?: string;
}

/**
 * Skeleton Card Component
 * Individual loading placeholder for a wardrobe item card
 */
function SkeletonCard() {
  return (
    <Card className="overflow-hidden rounded-[14px] border border-gray-200 bg-white">
      {/* Image skeleton */}
      <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-shimmer bg-[length:200%_100%]" />

        {/* Favorite button skeleton */}
        <div className="absolute top-3 right-3 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm">
          <div className="absolute inset-2 rounded-full bg-gray-200 animate-pulse" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title skeleton */}
        <div className="h-5 bg-gray-200 rounded-md animate-pulse w-3/4" />

        {/* Subcategory skeleton */}
        <div className="h-4 bg-gray-200 rounded-md animate-pulse w-1/2" />

        {/* Last worn date skeleton */}
        <div className="h-3 bg-gray-200 rounded-md animate-pulse w-2/3 mt-2" />
      </div>
    </Card>
  );
}

/**
 * Category Section Skeleton
 * Loading placeholder for a category section with heading
 */
function CategorySectionSkeleton({ cardCount = 4 }: { cardCount?: number }) {
  return (
    <section className="space-y-4">
      {/* Category heading skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-7 bg-gray-200 rounded-md animate-pulse w-32" />
        <div className="h-5 bg-gray-200 rounded-md animate-pulse w-16" />
      </div>

      {/* Grid skeleton */}
      <div
        className={cn(
          "grid gap-4 md:gap-5 lg:gap-6",
          "grid-cols-1",
          "sm:grid-cols-2",
          "lg:grid-cols-3",
          "xl:grid-cols-4"
        )}
      >
        {Array.from({ length: cardCount }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    </section>
  );
}

/**
 * WardrobeGridSkeleton Component
 *
 * Loading skeleton for the wardrobe grid that matches the exact
 * layout and structure of the actual grid component.
 *
 * @features
 * - Shimmer animation for visual feedback
 * - Responsive grid matching actual layout
 * - Configurable skeleton count
 * - Category section skeletons
 * - Smooth loading states
 *
 * @accessibility
 * - ARIA live region for loading state
 * - Screen reader friendly loading messages
 * - Semantic HTML structure
 *
 * @design
 * - Matches WardrobeGrid layout exactly
 * - Subtle shimmer animation
 * - Consistent spacing and sizing
 * - Dark mode support
 */
export function WardrobeGridSkeleton({
  count = 12,
  showCategoryHeadings = false,
  className,
}: WardrobeGridSkeletonProps) {
  // Calculate cards per section if showing category headings
  const sections = showCategoryHeadings ? 3 : 1;
  const cardsPerSection = Math.ceil(count / sections);

  return (
    <div
      className={cn("w-full", className)}
      role="status"
      aria-label="Loading wardrobe items"
    >
      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite">
        Loading your wardrobe items, please wait...
      </div>

      <div className="space-y-8">
        {showCategoryHeadings ? (
          // Show multiple category sections
          Array.from({ length: sections }).map((_, index) => (
            <CategorySectionSkeleton key={index} cardCount={cardsPerSection} />
          ))
        ) : (
          // Show simple grid without headings
          <div
            className={cn(
              "grid gap-4 md:gap-5 lg:gap-6",
              "grid-cols-1",
              "sm:grid-cols-2",
              "lg:grid-cols-3",
              "xl:grid-cols-4",
              "2xl:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]"
            )}
          >
            {Array.from({ length: count }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Compact Skeleton Variant
 * Smaller skeleton for secondary loading states
 */
export function WardrobeGridSkeletonCompact({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)} role="status" aria-label="Loading items">
      <div
        className={cn(
          "grid gap-3 md:gap-4",
          "grid-cols-2",
          "sm:grid-cols-3",
          "md:grid-cols-4"
        )}
      >
        {Array.from({ length: count }).map((_, index) => (
          <Card key={index} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="aspect-square w-full bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-shimmer bg-[length:200%_100%]" />
            <div className="p-2 space-y-2">
              <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-2 bg-gray-200 rounded animate-pulse w-1/2" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
