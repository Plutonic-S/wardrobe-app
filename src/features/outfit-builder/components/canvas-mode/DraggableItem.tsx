'use client';

import React from 'react';
import Image from 'next/image';
import { ClothResponse } from '@/features/wardrobe/types/wardrobe.types';
import { Card } from '@/components/ui/card';

interface DraggableItemProps {
  item: ClothResponse;
  onDragStart: (itemId: string) => void;
}

export function DraggableItem({ item, onDragStart }: DraggableItemProps) {
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    // Set drag data
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.setData('application/json', JSON.stringify(item));

    // Visual feedback
    setIsDragging(true);

    // Notify parent
    onDragStart(item.id);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        cursor-grab active:cursor-grabbing
        transition-all duration-200
        hover:scale-105 hover:shadow-lg
        border border-border
        overflow-hidden
        ${isDragging ? 'opacity-50 scale-95' : 'opacity-100'}
      `}
    >
      {/* Thumbnail */}
      <div className="aspect-square relative">
        {item.thumbnailUrl ? (
          <Image
            src={item.thumbnailUrl}
            alt={item.name}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 150px"
            draggable={false}
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-4xl font-bold text-muted-foreground">
              {item.name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2 space-y-0.5">
        <p className="text-sm font-medium truncate" title={item.name}>
          {item.name}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate capitalize">
            {item.subcategory || item.category}
          </span>
          {typeof item.wearCount === 'number' && (
            <span className="ml-1 shrink-0">
              {item.wearCount} wear{item.wearCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
