'use client';

import React from 'react';
import Image from 'next/image';
import { ClothResponse } from '@/features/wardrobe/types/wardrobe.types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DraggableItemProps {
  item: ClothResponse;
  onDragStart: (itemId: string) => void;
}

const SEASON_COLORS = {
  spring: 'bg-green-100 text-green-700 border-green-300',
  summer: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  autumn: 'bg-orange-100 text-orange-700 border-orange-300',
  winter: 'bg-blue-100 text-blue-700 border-blue-300',
} as const;

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

        {/* Season badges overlay */}
        {item.season && item.season.length > 0 && (
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {item.season.slice(0, 2).map((season) => (
              <Badge
                key={season}
                variant="secondary"
                className={`text-xs px-1.5 py-0.5 ${SEASON_COLORS[season]}`}
              >
                {season.charAt(0).toUpperCase()}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2 space-y-1">
        <p className="text-sm font-medium truncate" title={item.name}>
          {item.name}
        </p>

        {/* Full season badges */}
        {item.season && item.season.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {item.season.map((season) => (
              <Badge
                key={season}
                variant="outline"
                className={`text-xs ${SEASON_COLORS[season]}`}
              >
                {season}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
