"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Shirt,
  Footprints,
  ShoppingBag,
  Sparkles,
  Heart,
  Search,
  X,
  SlidersHorizontal,
  ChevronRight,
  RectangleVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ClothCategory, Season, ClothStatus, ClothFilters } from "../types/wardrobe.types";
import { SidebarToggleButton } from "./SidebarToggleButton";

/**
 * Category navigation item configuration
 */
interface CategoryNavItem {
  id: ClothCategory | "favorites";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
}

/**
 * Sidebar component props
 */
interface WardrobeSidebarProps {
  /** Current active category */
  activeCategory?: ClothCategory | "favorites" | null;

  /** Current filter values */
  filters: ClothFilters;

  /** Callback when navigation item is clicked */
  onNavigate: (category: ClothCategory | "favorites" | null) => void;

  /** Callback when filters change */
  onFiltersChange: (filters: ClothFilters) => void;

  /** Item counts per category (optional) */
  categoryCounts?: Record<ClothCategory, number>;

  /** Favorite items count (optional) */
  favoritesCount?: number;

  /** Whether sidebar is open (mobile drawer) */
  isOpen?: boolean;

  /** Whether sidebar is collapsed (desktop/tablet) */
  isCollapsed?: boolean;

  /** Whether current viewport is mobile */
  isMobile?: boolean;

  /** Callback when sidebar should close (mobile) */
  onClose?: () => void;

  /** Callback to toggle sidebar */
  onToggle?: () => void;

  /** Additional CSS classes */
  className?: string;
}

/**
 * WardrobeSidebar Component
 *
 * Responsive sidebar with navigation and filtering capabilities.
 * Adapts to mobile (drawer), tablet (collapsible), and desktop (full) layouts.
 *
 * @responsive
 * - Mobile (< 768px): Sheet drawer overlay
 * - Tablet/Desktop (≥ 768px): Collapsible sidebar
 *
 * @accessibility
 * - Full keyboard navigation support
 * - ARIA labels and landmarks
 * - Focus management for drawer
 * - Screen reader friendly
 */
export function WardrobeSidebar({
  activeCategory,
  filters,
  onNavigate,
  onFiltersChange,
  categoryCounts,
  favoritesCount,
  isOpen = false,
  isCollapsed = false,
  isMobile = false,
  onClose,
  onToggle,
  className,
}: WardrobeSidebarProps) {
  const [searchTerm, setSearchTerm] = useState(filters.searchTerm || "");
  const [tagInput, setTagInput] = useState("");
  const [localTags, setLocalTags] = useState<string[]>(filters.tags || []);
  const [subcategoryInput, setSubcategoryInput] = useState("");
  const [localSubcategories, setLocalSubcategories] = useState<string[]>(filters.subcategory || []);
  const [brandInput, setBrandInput] = useState("");
  const [localBrands, setLocalBrands] = useState<string[]>(filters.brand || []);
  const [styleInput, setStyleInput] = useState("");
  const [localStyles, setLocalStyles] = useState<string[]>(filters.styleType || []);
  const [priceMin, setPriceMin] = useState(filters.priceMin?.toString() || "");
  const [priceMax, setPriceMax] = useState(filters.priceMax?.toString() || "");
  const [dateFrom, setDateFrom] = useState(
    filters.purchaseDateFrom ? new Date(filters.purchaseDateFrom).toISOString().split('T')[0] : ""
  );
  const [dateTo, setDateTo] = useState(
    filters.purchaseDateTo ? new Date(filters.purchaseDateTo).toISOString().split('T')[0] : ""
  );

  /**
   * Category navigation configuration
   */
  const categoryNavItems: CategoryNavItem[] = [
    {
      id: "favorites",
      label: "Favorites",
      icon: Heart,
      count: favoritesCount,
    },
    {
      id: "tops",
      label: "Tops",
      icon: Shirt,
      count: categoryCounts?.tops,
    },
    {
      id: "bottoms",
      label: "Bottoms",
      icon: RectangleVertical,
      count: categoryCounts?.bottoms,
    },
    {
      id: "dresses",
      label: "Dresses",
      icon: Sparkles,
      count: categoryCounts?.dresses,
    },
    {
      id: "outerwear",
      label: "Outerwear",
      icon: ShoppingBag,
      count: categoryCounts?.outerwear,
    },
    {
      id: "footwear",
      label: "Footwear",
      icon: Footprints,
      count: categoryCounts?.footwear,
    },
    {
      id: "accessories",
      label: "Accessories",
      icon: Sparkles,
      count: categoryCounts?.accessories,
    },
  ];

  /**
   * Handle navigation item click - allow toggling
   */
  const handleNavigationClick = (categoryId: ClothCategory | "favorites" | null) => {
    // If clicking favorites
    if (categoryId === "favorites") {
      // Toggle: if already on favorites, go back to all items
      if (activeCategory === "favorites") {
        onNavigate(null);
        onFiltersChange({ ...filters, favorite: undefined, category: undefined });
      } else {
        onNavigate("favorites");
        onFiltersChange({ ...filters, favorite: true, category: undefined });
      }
    } else if (categoryId === null) {
      // Clicking "All Items" always shows all
      onNavigate(null);
      onFiltersChange({ ...filters, category: undefined, favorite: undefined });
    } else {
      // Toggle: if already on this category, go back to all items
      if (activeCategory === categoryId) {
        onNavigate(null);
        onFiltersChange({ ...filters, category: undefined, favorite: undefined });
      } else {
        onNavigate(categoryId);
        onFiltersChange({ ...filters, category: categoryId, favorite: undefined });
      }
    }

    // Close drawer on mobile after selection
    if (isMobile && onClose) {
      onClose();
    }
  };

  /**
   * Handle search input change with debouncing
   */
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);
      // Update filters with debounced search term
      const trimmedValue = value.trim();
      onFiltersChange({
        ...filters,
        searchTerm: trimmedValue.length > 0 ? trimmedValue : undefined,
      });
    },
    [filters, onFiltersChange]
  );

  /**
   * Handle season filter selection (now supports multiple)
   */
  const handleSeasonToggle = (season: Season) => {
    const currentSeasons = filters.season || [];
    const newSeasons = currentSeasons.includes(season)
      ? currentSeasons.filter(s => s !== season)
      : [...currentSeasons, season];
    
    onFiltersChange({
      ...filters,
      season: newSeasons.length > 0 ? newSeasons : undefined,
    });
  };

  /**
   * Handle status filter toggle
   */
  const handleStatusToggle = (status: ClothStatus) => {
    onFiltersChange({
      ...filters,
      status: filters.status === status ? undefined : status,
    });
  };

  /**
   * Handle tag addition
   */
  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !localTags.includes(trimmedTag)) {
      const newTags = [...localTags, trimmedTag];
      setLocalTags(newTags);
      onFiltersChange({ ...filters, tags: newTags });
      setTagInput("");
    }
  };

  /**
   * Handle tag removal
   */
  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = localTags.filter((tag) => tag !== tagToRemove);
    setLocalTags(newTags);
    onFiltersChange({ ...filters, tags: newTags.length > 0 ? newTags : undefined });
  };

  /**
   * Handle subcategory addition
   */
  const handleAddSubcategory = () => {
    const trimmed = subcategoryInput.trim();
    if (trimmed && !localSubcategories.includes(trimmed)) {
      const newSubcategories = [...localSubcategories, trimmed];
      setLocalSubcategories(newSubcategories);
      onFiltersChange({ ...filters, subcategory: newSubcategories });
      setSubcategoryInput("");
    }
  };

  /**
   * Handle subcategory removal
   */
  const handleRemoveSubcategory = (item: string) => {
    const newSubcategories = localSubcategories.filter((s) => s !== item);
    setLocalSubcategories(newSubcategories);
    onFiltersChange({ ...filters, subcategory: newSubcategories.length > 0 ? newSubcategories : undefined });
  };

  /**
   * Handle brand addition
   */
  const handleAddBrand = () => {
    const trimmed = brandInput.trim();
    if (trimmed && !localBrands.includes(trimmed)) {
      const newBrands = [...localBrands, trimmed];
      setLocalBrands(newBrands);
      onFiltersChange({ ...filters, brand: newBrands });
      setBrandInput("");
    }
  };

  /**
   * Handle brand removal
   */
  const handleRemoveBrand = (item: string) => {
    const newBrands = localBrands.filter((b) => b !== item);
    setLocalBrands(newBrands);
    onFiltersChange({ ...filters, brand: newBrands.length > 0 ? newBrands : undefined });
  };

  /**
   * Handle style type addition
   */
  const handleAddStyle = () => {
    const trimmed = styleInput.trim();
    if (trimmed && !localStyles.includes(trimmed)) {
      const newStyles = [...localStyles, trimmed];
      setLocalStyles(newStyles);
      onFiltersChange({ ...filters, styleType: newStyles });
      setStyleInput("");
    }
  };

  /**
   * Handle style type removal
   */
  const handleRemoveStyle = (item: string) => {
    const newStyles = localStyles.filter((s) => s !== item);
    setLocalStyles(newStyles);
    onFiltersChange({ ...filters, styleType: newStyles.length > 0 ? newStyles : undefined });
  };

  /**
   * Handle price filter change
   */
  const handlePriceChange = (min: string, max: string) => {
    setPriceMin(min);
    setPriceMax(max);
    
    const minNum = min ? parseFloat(min) : undefined;
    const maxNum = max ? parseFloat(max) : undefined;
    
    onFiltersChange({
      ...filters,
      priceMin: minNum && !isNaN(minNum) ? minNum : undefined,
      priceMax: maxNum && !isNaN(maxNum) ? maxNum : undefined,
    });
  };

  /**
   * Handle date filter change
   */
  const handleDateChange = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
    
    onFiltersChange({
      ...filters,
      purchaseDateFrom: from ? new Date(from) : undefined,
      purchaseDateTo: to ? new Date(to) : undefined,
    });
  };

  /**
   * Clear all filters
   */
  const handleClearFilters = () => {
    setSearchTerm("");
    setLocalTags([]);
    setTagInput("");
    setLocalSubcategories([]);
    setSubcategoryInput("");
    setLocalBrands([]);
    setBrandInput("");
    setLocalStyles([]);
    setStyleInput("");
    setPriceMin("");
    setPriceMax("");
    setDateFrom("");
    setDateTo("");
    onFiltersChange({});
    onNavigate(null);
  };

  /**
   * Count active filters
   */
  const activeFilterCount = [
    filters.searchTerm,
    filters.category,
    filters.season?.length,
    filters.subcategory?.length,
    filters.brand?.length,
    filters.styleType?.length,
    filters.favorite,
    filters.status,
    filters.tags?.length,
    filters.priceMin,
    filters.priceMax,
    filters.purchaseDateFrom,
    filters.purchaseDateTo,
  ].filter(Boolean).length;

  /**
   * Sidebar content (shared between desktop and mobile)
   */
  const sidebarContent = (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pr-10">
              <h2 className="text-lg font-bold text-foreground">
                My Wardrobe
              </h2>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeFilterCount} active
                </Badge>
              )}
            </div>
          </div>

          {/* Search Box */}
          <div className="space-y-2">
            <Label htmlFor="wardrobe-search" className="sr-only">
              Search wardrobe items
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="wardrobe-search"
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                maxLength={100}
                className="pl-9 pr-9"
                aria-describedby="search-description"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleSearchChange("")}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p id="search-description" className="sr-only">
              Search for items by name, brand, or description. Maximum 100 characters.
            </p>
          </div>

          <Separator />

          {/* Navigation Section */}
          <nav aria-label="Category navigation">
            <div className="space-y-1">
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Categories
              </h3>
              {categoryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.id === "favorites"
                    ? activeCategory === "favorites"
                    : activeCategory === item.id;

                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    onClick={() => handleNavigationClick(item.id)}
                    className={cn(
                      "w-full justify-start gap-3 px-3 py-2.5 h-auto",
                      "transition-all duration-200",
                      "hover:bg-muted",
                      isActive &&
                        "bg-primary/10 text-primary hover:bg-primary/15 font-medium"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 shrink-0",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    />
                    <span className="flex-1 text-left text-sm">{item.label}</span>
                    {item.count !== undefined && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          "ml-auto text-xs px-2 py-0",
                          isActive && "bg-primary/20 text-primary"
                        )}
                      >
                        {item.count}
                      </Badge>
                    )}
                    {isActive && (
                      <ChevronRight className="h-4 w-4 text-primary" />
                    )}
                  </Button>
                );
              })}
            </div>
          </nav>

          <Separator />

          {/* Filters Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </h3>
            </div>

            <Accordion type="multiple" defaultValue={["season", "status"]} className="space-y-2">
              {/* Season Filter */}
              <AccordionItem value="season" className="border-b-0">
                <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span>Season</span>
                    {filters.season && filters.season.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {filters.season.length}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-4">
                  {(["spring", "summer", "autumn", "winter"] as Season[]).map((season) => (
                    <div key={season} className="flex items-center space-x-2">
                      <Checkbox
                        id={`season-${season}`}
                        checked={(filters.season || []).includes(season)}
                        onCheckedChange={() => handleSeasonToggle(season)}
                        aria-label={`Filter by ${season}`}
                      />
                      <Label
                        htmlFor={`season-${season}`}
                        className="text-sm font-normal capitalize cursor-pointer flex-1"
                      >
                        {season}
                      </Label>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>

              {/* Status Filter */}
              <AccordionItem value="status" className="border-b-0">
                <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span>Status</span>
                    {filters.status && (
                      <Badge variant="secondary" className="text-xs">
                        1
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-4">
                  {(["active", "archived", "donated"] as ClothStatus[]).map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={filters.status === status}
                        onCheckedChange={() => handleStatusToggle(status)}
                        aria-label={`Filter by ${status} status`}
                      />
                      <Label
                        htmlFor={`status-${status}`}
                        className="text-sm font-normal capitalize cursor-pointer flex-1"
                      >
                        {status}
                      </Label>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>

              {/* Tags Filter */}
              <AccordionItem value="tags" className="border-b-0">
                <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span>Tags</span>
                    {localTags.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {localTags.length}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-4">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Add tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      className="flex-1"
                      aria-label="Add filter tag"
                    />
                    <Button
                      onClick={handleAddTag}
                      size="sm"
                      disabled={!tagInput.trim()}
                      aria-label="Add tag"
                    >
                      Add
                    </Button>
                  </div>
                  {localTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {localTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80"
                        >
                          <span className="text-xs">{tag}</span>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleRemoveTag(tag)}
                            className="h-4 w-4 rounded-full hover:bg-destructive/20"
                            aria-label={`Remove ${tag} tag`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Subcategory Filter */}
              <AccordionItem value="subcategory" className="border-b-0">
                <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span>Subcategory</span>
                    {localSubcategories.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {localSubcategories.length}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-4">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Add subcategory..."
                      value={subcategoryInput}
                      onChange={(e) => setSubcategoryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSubcategory();
                        }
                      }}
                      className="flex-1"
                      aria-label="Add subcategory filter"
                    />
                    <Button
                      onClick={handleAddSubcategory}
                      size="sm"
                      disabled={!subcategoryInput.trim()}
                      aria-label="Add subcategory"
                    >
                      Add
                    </Button>
                  </div>
                  {localSubcategories.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {localSubcategories.map((item) => (
                        <Badge
                          key={item}
                          variant="secondary"
                          className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80"
                        >
                          <span className="text-xs">{item}</span>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleRemoveSubcategory(item)}
                            className="h-4 w-4 rounded-full hover:bg-destructive/20"
                            aria-label={`Remove ${item} subcategory`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Brand Filter */}
              <AccordionItem value="brand" className="border-b-0">
                <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span>Brand</span>
                    {localBrands.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {localBrands.length}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-4">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Add brand..."
                      value={brandInput}
                      onChange={(e) => setBrandInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddBrand();
                        }
                      }}
                      className="flex-1"
                      aria-label="Add brand filter"
                    />
                    <Button
                      onClick={handleAddBrand}
                      size="sm"
                      disabled={!brandInput.trim()}
                      aria-label="Add brand"
                    >
                      Add
                    </Button>
                  </div>
                  {localBrands.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {localBrands.map((item) => (
                        <Badge
                          key={item}
                          variant="secondary"
                          className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80"
                        >
                          <span className="text-xs">{item}</span>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleRemoveBrand(item)}
                            className="h-4 w-4 rounded-full hover:bg-destructive/20"
                            aria-label={`Remove ${item} brand`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Style Type Filter */}
              <AccordionItem value="style" className="border-b-0">
                <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span>Style Type</span>
                    {localStyles.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {localStyles.length}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-4">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Add style..."
                      value={styleInput}
                      onChange={(e) => setStyleInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddStyle();
                        }
                      }}
                      className="flex-1"
                      aria-label="Add style filter"
                    />
                    <Button
                      onClick={handleAddStyle}
                      size="sm"
                      disabled={!styleInput.trim()}
                      aria-label="Add style"
                    >
                      Add
                    </Button>
                  </div>
                  {localStyles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {localStyles.map((item) => (
                        <Badge
                          key={item}
                          variant="secondary"
                          className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80"
                        >
                          <span className="text-xs">{item}</span>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleRemoveStyle(item)}
                            className="h-4 w-4 rounded-full hover:bg-destructive/20"
                            aria-label={`Remove ${item} style`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Price Range Filter */}
              <AccordionItem value="price" className="border-b-0">
                <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span>Price Range</span>
                    {(filters.priceMin || filters.priceMax) && (
                      <Badge variant="secondary" className="text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="price-min" className="text-xs text-muted-foreground mb-1 block">
                        Min ($)
                      </Label>
                      <Input
                        id="price-min"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={priceMin}
                        onChange={(e) => handlePriceChange(e.target.value, priceMax)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="price-max" className="text-xs text-muted-foreground mb-1 block">
                        Max ($)
                      </Label>
                      <Input
                        id="price-max"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Any"
                        value={priceMax}
                        onChange={(e) => handlePriceChange(priceMin, e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Purchase Date Range Filter */}
              <AccordionItem value="purchase-date" className="border-b-0">
                <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span>Purchase Date</span>
                    {(filters.purchaseDateFrom || filters.purchaseDateTo) && (
                      <Badge variant="secondary" className="text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-4">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="date-from" className="text-xs text-muted-foreground mb-1 block">
                        From
                      </Label>
                      <Input
                        id="date-from"
                        type="date"
                        value={dateFrom}
                        onChange={(e) => handleDateChange(e.target.value, dateTo)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="date-to" className="text-xs text-muted-foreground mb-1 block">
                        To
                      </Label>
                      <Input
                        id="date-to"
                        type="date"
                        value={dateTo}
                        onChange={(e) => handleDateChange(dateFrom, e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </ScrollArea>

      {/* Footer - Clear Filters Button */}
      {activeFilterCount > 0 && (
        <div className="p-4 border-t border-border">
          <Button
            variant="outline"
            onClick={handleClearFilters}
            className="w-full gap-2"
            aria-label={`Clear all ${activeFilterCount} filters`}
          >
            <X className="h-4 w-4" />
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );

  // Mobile: Render as Sheet drawer
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          side="left"
          className="w-80 p-0 flex flex-col"
          aria-describedby="sidebar-description"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Wardrobe Filters and Navigation</SheetTitle>
            <SheetDescription id="sidebar-description">
              Filter and browse your wardrobe items by category, season, status, and tags.
            </SheetDescription>
          </SheetHeader>
          {sidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop/Tablet: Render as collapsible sidebar
  return (
    <aside
      className={cn(
        "relative flex flex-col h-full",
        "bg-background",
        "border-r border-border",
        "transition-all duration-300 ease-in-out",
        "shrink-0",
        // Width based on collapsed state
        isCollapsed ? "w-0 overflow-hidden" : "w-80",
        className
      )}
      role="complementary"
      aria-label="Wardrobe navigation and filters"
      aria-hidden={isCollapsed}
    >
      {/* Collapse Toggle Button - positioned at top-right */}
      {!isCollapsed && onToggle && (
        <div className="absolute top-4 right-4 z-10">
          <SidebarToggleButton
            isCollapsed={isCollapsed}
            onClick={onToggle}
            isMobile={false}
          />
        </div>
      )}

      {/* Content */}
      {!isCollapsed && sidebarContent}
    </aside>
  );
}
