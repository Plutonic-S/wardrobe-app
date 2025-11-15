'use client';

import React from 'react';
import { Shirt, Layers, Sparkles, Wind, Footprints, Watch } from 'lucide-react';
import { ClothCategory } from '@/features/wardrobe/types/wardrobe.types';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface QuickFiltersProps {
  selectedCategories: ClothCategory[];
  onToggle: (category: ClothCategory) => void;
  categoryCounts: Record<ClothCategory, number>;
}

interface CategoryOption {
  value: ClothCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CATEGORIES: CategoryOption[] = [
  { value: 'tops', label: 'Tops', icon: Shirt },
  { value: 'bottoms', label: 'Bottoms', icon: Layers },
  { value: 'dresses', label: 'Dresses', icon: Sparkles },
  { value: 'outerwear', label: 'Outerwear', icon: Wind },
  { value: 'footwear', label: 'Footwear', icon: Footprints },
  { value: 'accessories', label: 'Accessories', icon: Watch },
];

export function QuickFilters({
  selectedCategories,
  onToggle,
  categoryCounts,
}: QuickFiltersProps) {
  const hasSelection = selectedCategories.length > 0;

  const handleClearAll = () => {
    selectedCategories.forEach((category) => onToggle(category));
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Categories</h3>
        {hasSelection && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 gap-2">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategories.includes(category.value);
          const count = categoryCounts[category.value] || 0;

          return (
            <div
              key={category.value}
              onClick={() => onToggle(category.value)}
              className={`
                flex items-center gap-2 p-3 rounded-md border cursor-pointer
                transition-all duration-200
                ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }
              `}
            >
              <Checkbox
                id={category.value}
                checked={isSelected}
                onCheckedChange={() => onToggle(category.value)}
                className="pointer-events-none"
              />
              <Label
                htmlFor={category.value}
                className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-medium truncate">{category.label}</span>
              </Label>
              <Badge
                variant="secondary"
                className="ml-auto flex-shrink-0 text-xs px-1.5 min-w-[24px] justify-center"
              >
                {count}
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}
