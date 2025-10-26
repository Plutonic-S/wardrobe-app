"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Sidebar state interface
 */
export interface SidebarState {
  /** Whether sidebar is open (mobile drawer) */
  isOpen: boolean;
  /** Whether sidebar is collapsed (desktop/tablet) */
  isCollapsed: boolean;
  /** Whether current viewport is mobile */
  isMobile: boolean;
}

/**
 * Hook for managing responsive sidebar state
 *
 * Handles:
 * - Responsive breakpoint detection
 * - Mobile drawer open/close state
 * - Desktop/tablet collapse state
 * - LocalStorage persistence for user preference
 *
 * @example
 * ```tsx
 * const { isOpen, isCollapsed, isMobile, toggleSidebar, closeSidebar } = useSidebarState();
 * ```
 */
export function useSidebarState() {
  const MOBILE_BREAKPOINT = 768; // px
  const STORAGE_KEY = "wardrobe-sidebar-collapsed";

  // Detect if we're on mobile based on window width
  const [isMobile, setIsMobile] = useState(false);

  // Mobile drawer state (only relevant on mobile)
  const [isOpen, setIsOpen] = useState(false);

  // Collapsed state (only relevant on desktop/tablet)
  const [isCollapsed, setIsCollapsed] = useState(false);

  /**
   * Initialize collapsed state from localStorage
   */
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setIsCollapsed(stored === "true");
    }
  }, []);

  /**
   * Handle window resize to update mobile state
   */
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);

      // Close drawer when switching from mobile to desktop
      if (!mobile && isOpen) {
        setIsOpen(false);
      }
    };

    // Initial check
    checkMobile();

    // Add resize listener
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [isOpen]);

  /**
   * Toggle sidebar (drawer on mobile, collapse on desktop)
   */
  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setIsOpen((prev) => !prev);
    } else {
      setIsCollapsed((prev) => {
        const newValue = !prev;
        localStorage.setItem(STORAGE_KEY, String(newValue));
        return newValue;
      });
    }
  }, [isMobile]);

  /**
   * Open sidebar/drawer
   */
  const openSidebar = useCallback(() => {
    if (isMobile) {
      setIsOpen(true);
    } else {
      setIsCollapsed(false);
      localStorage.setItem(STORAGE_KEY, "false");
    }
  }, [isMobile]);

  /**
   * Close sidebar/drawer
   */
  const closeSidebar = useCallback(() => {
    if (isMobile) {
      setIsOpen(false);
    } else {
      setIsCollapsed(true);
      localStorage.setItem(STORAGE_KEY, "true");
    }
  }, [isMobile]);

  return {
    isOpen,
    isCollapsed,
    isMobile,
    toggleSidebar,
    openSidebar,
    closeSidebar,
    setIsOpen,
  };
}
