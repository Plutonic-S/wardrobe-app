"use client";

import { cn } from "@/lib/utils";

/**
 * Props for WardrobeGridSkeleton component
 */
export interface WardrobeGridSkeletonProps {
  /** Number of skeleton cards to show */
  count?: number;

  /** Additional CSS classes */
  className?: string;
}

/**
 * WardrobeGridSkeleton Component
 *
 * Simple and clean loading skeleton for the wardrobe grid.
 * Uses a minimal design with just rounded boxes and pulse animation.
 *
 * @features
 * - Simple pulse animation
 * - Responsive grid matching actual layout
 * - Configurable skeleton count
 * - Clean and minimal design
 *
 * @accessibility
 * - ARIA live region for loading state
 * - Screen reader friendly loading messages
 */
export function WardrobeGridSkeleton({
  count = 12,
  className,
}: WardrobeGridSkeletonProps) {
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
          <div
            key={index}
            className="aspect-square rounded-lg bg-muted animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
