'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { ClothResponse, ClothCategory } from '@/features/wardrobe/types/wardrobe.types';
import { Accordion } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { useOutfitBuilder } from '@/features/outfit-builder/hooks/useOutfitBuilder';
import { SearchBar } from './SearchBar';
import { QuickFilters } from './QuickFilters';
import { CategorySection } from './CategorySection';

const ALL_CATEGORIES: ClothCategory[] = [
  'tops',
  'bottoms',
  'dresses',
  'outerwear',
  'footwear',
  'accessories',
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { wardrobeItems, setWardrobeItems } = useOutfitBuilder();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<ClothCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch wardrobe items on mount
  useEffect(() => {
    const fetchWardrobeItems = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/wardrobe?status=active&processingStatus=completed');
        const data = await response.json();
        
        if (data.success && data.data?.items) {
          setWardrobeItems(data.data.items);
        }
      } catch (error) {
        console.error('[Sidebar] Failed to fetch wardrobe items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if we don't have items
    if (wardrobeItems.length === 0) {
      fetchWardrobeItems();
    } else {
      setIsLoading(false);
    }
  }, [wardrobeItems.length, setWardrobeItems]);

  // Filter items based on search query and selected categories
  const filteredItems = useMemo(() => {
    let items = wardrobeItems;

    // Filter by search query (case-insensitive)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter((item) =>
        item.name.toLowerCase().includes(query)
      );
    }

    // Filter by selected categories (AND logic)
    if (selectedCategories.length > 0) {
      items = items.filter((item) =>
        selectedCategories.includes(item.category)
      );
    }

    return items;
  }, [wardrobeItems, searchQuery, selectedCategories]);

  // Group filtered items by category
  const itemsByCategory = useMemo(() => {
    const grouped: Record<ClothCategory, ClothResponse[]> = {
      tops: [],
      bottoms: [],
      dresses: [],
      outerwear: [],
      footwear: [],
      accessories: [],
    };

    filteredItems.forEach((item) => {
      if (grouped[item.category]) {
        grouped[item.category].push(item);
      }
    });

    return grouped;
  }, [filteredItems]);

  // Calculate category counts for all items (not just filtered)
  const categoryCounts = useMemo(() => {
    const counts: Record<ClothCategory, number> = {
      tops: 0,
      bottoms: 0,
      dresses: 0,
      outerwear: 0,
      footwear: 0,
      accessories: 0,
    };

    wardrobeItems.forEach((item) => {
      if (counts[item.category] !== undefined) {
        counts[item.category]++;
      }
    });

    return counts;
  }, [wardrobeItems]);

  // Toggle category filter
  const handleCategoryToggle = (category: ClothCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  // Close sidebar on item drag start (mobile only)
  const handleItemDragStart = (itemId: string) => {
    // On mobile, close sidebar when dragging starts
    if (window.innerWidth < 768) {
      onToggle();
    }
    console.log('[Sidebar] Item drag started:', itemId);
  };

  const sidebarContent = (
    <>
      {/* Header with search and toggle button */}
      <div className="flex-shrink-0 bg-card border-b p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Wardrobe</h2>
          {/* Toggle button - top right */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8"
            aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      {/* Filters */}
      <div className="flex-shrink-0 p-4 border-b">
        <QuickFilters
          selectedCategories={selectedCategories}
          onToggle={handleCategoryToggle}
          categoryCounts={categoryCounts}
        />
      </div>

      {/* Scrollable category sections */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-sm">Loading wardrobe items...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-sm">No items found</p>
            {(searchQuery || selectedCategories.length > 0) && (
              <p className="text-xs mt-2">Try adjusting your filters</p>
            )}
          </div>
        ) : (
          <Accordion type="multiple" className="w-full">
            {ALL_CATEGORIES.map((category) => (
              <CategorySection
                key={category}
                category={category}
                items={itemsByCategory[category]}
                onItemDragStart={handleItemDragStart}
              />
            ))}
          </Accordion>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`
          h-full
          bg-card
          flex flex-col
          transition-all duration-300 ease-in-out
          overflow-hidden
          border-r
          ${isOpen ? 'w-full md:w-[450px]' : 'w-0'}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
