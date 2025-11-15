'use client';

import React from 'react';
import { Shirt, Layers, Sparkles, Wind, Footprints, Watch } from 'lucide-react';
import { ClothResponse, ClothCategory } from '@/features/wardrobe/types/wardrobe.types';
import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { DraggableItem } from './DraggableItem';

interface CategorySectionProps {
  category: ClothCategory;
  items: ClothResponse[];
  onItemDragStart: (itemId: string) => void;
}

const CATEGORY_ICONS: Record<ClothCategory, React.ComponentType<{ className?: string }>> = {
  tops: Shirt,
  bottoms: Layers,
  dresses: Sparkles,
  outerwear: Wind,
  footwear: Footprints,
  accessories: Watch,
};

const CATEGORY_LABELS: Record<ClothCategory, string> = {
  tops: 'Tops',
  bottoms: 'Bottoms',
  dresses: 'Dresses',
  outerwear: 'Outerwear',
  footwear: 'Footwear',
  accessories: 'Accessories',
};

export function CategorySection({
  category,
  items,
  onItemDragStart,
}: CategorySectionProps) {
  const Icon = CATEGORY_ICONS[category];
  const label = CATEGORY_LABELS[category];
  const count = items.length;

  if (count === 0) {
    return null;
  }

  return (
    <AccordionItem value={category} className="border-b">
      <AccordionTrigger className="hover:no-underline py-3 px-4 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3 flex-1">
          <Icon className="h-5 w-5 text-foreground" />
          <span className="font-semibold text-sm">{label}</span>
          <Badge variant="secondary" className="ml-auto text-xs">
            {count}
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent className="p-4 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((item) => (
            <DraggableItem
              key={item.id}
              item={item}
              onDragStart={onItemDragStart}
            />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
