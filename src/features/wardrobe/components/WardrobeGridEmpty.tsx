"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Search,
  PackageOpen,
  Sparkles,
  Filter,
  Plus,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Props for WardrobeGridEmpty component
 */
export interface WardrobeGridEmptyProps {
  /** Main title/heading */
  title?: string;

  /** Description text */
  description?: string;

  /** Icon variant to display */
  variant?: "empty" | "no-results" | "error" | "loading";

  /** Show clear filters button */
  showClearFilters?: boolean;

  /** Callback when clear filters is clicked */
  onClearFilters?: () => void;

  /** Show add item button */
  showAddButton?: boolean;

  /** Callback when add button is clicked */
  onAddItem?: () => void;

  /** Custom action button label */
  actionLabel?: string;

  /** Custom action button callback */
  onAction?: () => void;

  /** Additional CSS classes */
  className?: string;

  /** Show helpful suggestions */
  showSuggestions?: boolean;
}

/**
 * Get icon component based on variant
 */
function getVariantIcon(variant: WardrobeGridEmptyProps["variant"]) {
  switch (variant) {
    case "no-results":
      return Search;
    case "error":
      return RefreshCw;
    case "loading":
      return RefreshCw;
    case "empty":
    default:
      return PackageOpen;
  }
}

/**
 * Suggestion item for helpful tips
 */
function SuggestionItem({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3 text-left">
      <div className="shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{text}</p>
    </div>
  );
}

/**
 * WardrobeGridEmpty Component
 *
 * Empty state component for the wardrobe grid with multiple variants
 * for different scenarios (empty wardrobe, no results, errors).
 *
 * @features
 * - Multiple visual variants
 * - Contextual suggestions
 * - Action buttons (clear filters, add items)
 * - Responsive design
 * - Helpful user guidance
 *
 * @accessibility
 * - Semantic HTML structure
 * - ARIA labels for actions
 * - Focus-visible states
 * - Screen reader friendly
 * - Clear visual hierarchy
 *
 * @design
 * - Centered layout
 * - Subtle illustrations
 * - Clear call-to-action
 * - Consistent spacing
 * - Dark mode support
 */
export function WardrobeGridEmpty({
  title,
  description,
  variant = "empty",
  showClearFilters = false,
  onClearFilters,
  showAddButton = false,
  onAddItem,
  actionLabel,
  onAction,
  className,
  showSuggestions = false,
}: WardrobeGridEmptyProps) {
  const Icon = getVariantIcon(variant);

  // Default suggestions based on variant
  const defaultSuggestions = {
    empty: [
      {
        icon: Plus,
        text: "Upload photos of your clothing items to get started",
      },
      {
        icon: Sparkles,
        text: "Organize items by category, season, and tags",
      },
      {
        icon: Filter,
        text: "Use filters to quickly find what you need",
      },
    ],
    "no-results": [
      {
        icon: Filter,
        text: "Try removing some filters to see more items",
      },
      {
        icon: Search,
        text: "Check your spelling or try different search terms",
      },
      {
        icon: Sparkles,
        text: "Browse by category to discover your items",
      },
    ],
  };

  const suggestions =
    variant === "empty" || variant === "no-results"
      ? defaultSuggestions[variant]
      : null;

  return (
    <div
      className={cn(
        "flex items-center justify-center min-h-[500px] w-full",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Card className="max-w-2xl mx-auto p-12 text-center border-dashed bg-gray-50/50 dark:bg-gray-900/50">
        <div className="space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div
              className={cn(
                "rounded-full p-6",
                "bg-gradient-to-br from-gray-100 to-gray-200",
                "dark:from-gray-800 dark:to-gray-700",
                variant === "error" && "from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30"
              )}
            >
              <Icon
                className={cn(
                  "h-12 w-12",
                  variant === "error" ? "text-red-600 dark:text-red-400" : "text-gray-400 dark:text-gray-500"
                )}
                strokeWidth={1.5}
              />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {title || "No items found"}
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              {description || "Start building your digital wardrobe"}
            </p>
          </div>

          {/* Suggestions */}
          {showSuggestions && suggestions && (
            <div className="pt-4 space-y-4">
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  Helpful tips:
                </h3>
                <div className="space-y-3 max-w-md mx-auto">
                  {suggestions.map((suggestion, index) => (
                    <SuggestionItem
                      key={index}
                      icon={suggestion.icon}
                      text={suggestion.text}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            {/* Clear filters button */}
            {showClearFilters && onClearFilters && (
              <Button
                variant="outline"
                onClick={onClearFilters}
                className="gap-2 min-w-[140px]"
                aria-label="Clear all active filters"
              >
                <Filter className="h-4 w-4" />
                Clear Filters
              </Button>
            )}

            {/* Add item button */}
            {showAddButton && onAddItem && (
              <Button
                onClick={onAddItem}
                className="gap-2 min-w-[140px]"
                aria-label="Add new wardrobe item"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            )}

            {/* Custom action button */}
            {actionLabel && onAction && (
              <Button
                onClick={onAction}
                variant={variant === "error" ? "default" : "outline"}
                className="gap-2 min-w-[140px]"
              >
                {variant === "error" && <RefreshCw className="h-4 w-4" />}
                {actionLabel}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * Compact Empty State Variant
 * Smaller empty state for inline usage
 */
export function WardrobeGridEmptyCompact({
  message = "No items",
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
      role="status"
    >
      <PackageOpen className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-3" />
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
}
