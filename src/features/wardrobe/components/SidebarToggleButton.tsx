"use client";

import { Button } from "@/components/ui/button";
import { PanelLeftClose, PanelLeftOpen, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarToggleButtonProps {
  /** Whether sidebar is collapsed */
  isCollapsed: boolean;
  /** Click handler */
  onClick: () => void;
  /** Whether this is for mobile (uses different icon) */
  isMobile?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Toggle button for sidebar collapse/expand
 *
 * Shows different icons based on state and device type
 *
 * @accessibility
 * - Clear aria-label describing action
 * - aria-expanded state
 * - Keyboard accessible
 * - Visible focus indicator
 */
export function SidebarToggleButton({
  isCollapsed,
  onClick,
  isMobile = false,
  className,
}: SidebarToggleButtonProps) {
  if (isMobile) {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={onClick}
        className={cn(
          "h-10 w-10",
          "bg-white dark:bg-gray-950",
          "border-gray-200 dark:border-gray-800",
          "hover:bg-gray-50 dark:hover:bg-gray-900",
          "shadow-lg",
          className
        )}
        aria-label="Open filters"
        aria-expanded={false}
      >
        <SlidersHorizontal className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn(
        "h-8 w-8 shrink-0",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        "transition-transform duration-200",
        className
      )}
      aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      aria-expanded={!isCollapsed}
    >
      {isCollapsed ? (
        <PanelLeftOpen className="h-4 w-4" />
      ) : (
        <PanelLeftClose className="h-4 w-4" />
      )}
    </Button>
  );
}

interface MobileSidebarTriggerProps {
  /** Click handler */
  onClick: () => void;
  /** Active filter count to display */
  activeFilterCount?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Floating action button for mobile sidebar trigger
 *
 * Positioned in bottom-right corner with badge for active filters
 */
export function MobileSidebarTrigger({
  onClick,
  activeFilterCount = 0,
  className,
}: MobileSidebarTriggerProps) {
  return (
    <div
      className={cn(
        "fixed bottom-6 left-4 z-40",
        "md:hidden", // Only show on mobile
        className
      )}
    >
      <Button
        onClick={onClick}
        size="lg"
        className={cn(
          "h-14 w-14 rounded-full shadow-lg",
          "bg-primary hover:bg-primary/90",
          "transition-all duration-200",
          "hover:scale-105 active:scale-95"
        )}
        aria-label={`Open sidebar filters${
          activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ""
        }`}
      >
        <div className="relative">
          <SlidersHorizontal className="h-6 w-6" />
          {activeFilterCount > 0 && (
            <span
              className={cn(
                "absolute -top-2 -right-2",
                "flex items-center justify-center",
                "h-5 w-5 rounded-full",
                "bg-destructive text-destructive-foreground",
                "text-xs font-bold"
              )}
              aria-label={`${activeFilterCount} active filters`}
            >
              {activeFilterCount}
            </span>
          )}
        </div>
      </Button>
    </div>
  );
}
