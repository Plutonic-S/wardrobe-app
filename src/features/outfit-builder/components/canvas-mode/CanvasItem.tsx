'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { CanvasItem as CanvasItemType } from '@/features/outfit-builder/types/outfit.types';
import { X, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOutfitBuilder } from '@/features/outfit-builder/hooks/useOutfitBuilder';

interface CanvasItemProps {
  item: CanvasItemType;
}

export function CanvasItem({ item }: CanvasItemProps) {
  const { wardrobeItems, updateCanvasItem, removeCanvasItem } = useOutfitBuilder();
  const [isSelected, setIsSelected] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Find the cloth data from wardrobe items
  const clothData = wardrobeItems.find((w) => w.id === item.clothItemId);

  // Handle mouse down - start dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click

    setIsSelected(true);
    setIsDragging(true);

    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    e.stopPropagation();
  };

  // Handle mouse move - drag item
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = document.querySelector('[data-canvas="true"]');
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const newX = e.clientX - rect.left - dragOffset.x;
      const newY = e.clientY - rect.top - dragOffset.y;

      updateCanvasItem(item.id, {
        position: { x: newX, y: newY },
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsSelected(false); // Clear selection after dragging
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, item.id, updateCanvasItem]);

  // Handle delete
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[CanvasItem] Deleting item:', item.id);
    removeCanvasItem(item.id);
  };

  if (!clothData) {
    return null; // Cloth item not found in wardrobe
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: `${item.position.x}px`,
        top: `${item.position.y}px`,
        width: `${item.size.width}px`,
        height: `${item.size.height}px`,
        transform: `rotate(${item.rotation}deg)`,
        zIndex: isSelected ? 9999 : item.zIndex,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      className={`
        group transition-shadow duration-200 select-none
        ${isSelected ? 'ring-2 ring-primary shadow-lg' : ''}
      `}
      onMouseDown={handleMouseDown}
    >
      {/* Image */}
      <div className="relative w-full h-full">
        <Image
          src={clothData.thumbnailUrl || clothData.optimizedUrl}
          alt={clothData.name}
          fill
          className="object-contain pointer-events-none"
          draggable={false}
          unoptimized
        />

        {/* Controls - show on hover or when selected */}
        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="destructive"
            size="icon"
            className="h-7 w-7 shadow-md"
            onClick={handleDelete}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            title="Remove"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Drag indicator */}
        {isDragging && (
          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
            <Move className="h-8 w-8 text-primary" />
          </div>
        )}
      </div>

      {/* Item name */}
      <div className="absolute -bottom-6 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-xs bg-background/90 px-2 py-1 rounded border border-border">
          {clothData.name}
        </span>
      </div>
    </div>
  );
}
