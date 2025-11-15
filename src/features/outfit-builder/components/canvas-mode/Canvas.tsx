'use client';

import React, { useRef, useState } from 'react';
import { useOutfitBuilder } from '@/features/outfit-builder/hooks/useOutfitBuilder';
import { ClothResponse } from '@/features/wardrobe/types/wardrobe.types';
import { Grid3x3, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CanvasItem } from './CanvasItem';

export function Canvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { canvasItems, addCanvasItem, viewport, setViewport } = useOutfitBuilder();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);

  /**
   * Handle drag over - required to allow drop
   */
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  /**
   * Handle drag leave - remove highlight
   */
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  /**
   * Handle drop - add item to canvas
   */
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      // Get item data from drag event
      const itemDataString = e.dataTransfer.getData('application/json');
      if (!itemDataString) {
        console.warn('[Canvas] No item data in drop event');
        return;
      }

      const itemData: ClothResponse = JSON.parse(itemDataString);

      // Calculate drop position relative to canvas
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      console.log('[Canvas] Item dropped:', { itemData, position: { x, y } });

      // Add to canvas items via Zustand
      addCanvasItem({
        id: `canvas-${Date.now()}`,
        clothItemId: itemData.id,
        position: { x, y },
        size: { width: 150, height: 150 },
        rotation: 0,
        zIndex: canvasItems.length,
      });
    } catch (error) {
      console.error('[Canvas] Failed to parse drop data:', error);
    }
  };

  /**
   * Handle zoom in
   */
  const handleZoomIn = () => {
    const newZoom = Math.min(viewport.zoom + 0.2, 3); // Max zoom 3x
    setViewport({ zoom: newZoom });
  };

  /**
   * Handle zoom out
   */
  const handleZoomOut = () => {
    const newZoom = Math.max(viewport.zoom - 0.2, 0.2); // Min zoom 0.2x
    setViewport({ zoom: newZoom });
  };

  /**
   * Handle fit to screen - reset zoom to 1
   */
  const handleFitToScreen = () => {
    setViewport({ zoom: 1, pan: { x: 0, y: 0 } });
  };

  /**
   * Handle canvas panning with mouse
   */
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only pan if clicking directly on the canvas background, not on items
    if (e.target === e.currentTarget || (e.target as HTMLElement).hasAttribute('data-canvas')) {
      setIsPanning(true);
      setPanStart({
        x: e.clientX - viewport.pan.x,
        y: e.clientY - viewport.pan.y,
      });
      e.preventDefault();
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      setViewport({
        pan: {
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        },
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
  };

  /**
   * Calculate distance between two touch points
   */
  const getTouchDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  /**
   * Handle touch start - for pinch and pan on mobile
   */
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      // Pinch gesture
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      setLastTouchDistance(distance);
    } else if (e.touches.length === 1) {
      // Pan gesture
      const touch = e.touches[0];
      setIsPanning(true);
      setPanStart({
        x: touch.clientX - viewport.pan.x,
        y: touch.clientY - viewport.pan.y,
      });
    }
  };

  /**
   * Handle touch move - for pinch zoom and pan
   */
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && lastTouchDistance !== null) {
      // Pinch zoom
      e.preventDefault();
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      const scale = distance / lastTouchDistance;
      const newZoom = Math.max(0.2, Math.min(3, viewport.zoom * scale));

      setViewport({ zoom: newZoom });
      setLastTouchDistance(distance);
    } else if (e.touches.length === 1 && isPanning) {
      // Pan
      e.preventDefault();
      const touch = e.touches[0];
      setViewport({
        pan: {
          x: touch.clientX - panStart.x,
          y: touch.clientY - panStart.y,
        },
      });
    }
  };

  /**
   * Handle touch end
   */
  const handleTouchEnd = () => {
    setIsPanning(false);
    setLastTouchDistance(null);
  };

  /**
   * Handle mouse wheel - for zoom
   */
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();

    // Determine zoom direction and amount
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.2, Math.min(3, viewport.zoom + delta));

    setViewport({ zoom: newZoom });
  };

  return (
    <div className="relative h-full w-full bg-background">
      {/* Canvas Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2 items-center">
        <div className="text-sm font-medium bg-background/90 px-3 py-1.5 rounded border border-border">
          {Math.round(viewport.zoom * 100)}%
        </div>
        <Button variant="outline" size="icon" title="Zoom In" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" title="Zoom Out" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" title="Fit to Screen" onClick={handleFitToScreen}>
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Canvas Drop Zone */}
      <div
        ref={canvasRef}
        data-canvas="true"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        className={`
          h-full w-full relative overflow-hidden
          transition-colors duration-200
          ${isDragOver ? 'bg-primary/5 border-2 border-primary border-dashed' : 'bg-muted/20'}
          ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}
        `}
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)
          `,
          backgroundSize: `${20 * viewport.zoom}px ${20 * viewport.zoom}px`,
          touchAction: 'none', // Prevent default touch behaviors
        }}
      >
        {/* Canvas Content Wrapper with zoom transform */}
        <div
          style={{
            transform: `translate(${viewport.pan.x}px, ${viewport.pan.y}px) scale(${viewport.zoom})`,
            transformOrigin: '0 0',
            width: '100%',
            height: '100%',
            position: 'relative',
            transition: isPanning ? 'none' : 'transform 0.2s ease-out',
          }}
        >
        {/* Empty State */}
        {canvasItems.length === 0 && !isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-muted-foreground">
              <Grid3x3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Start Building Your Outfit</h3>
              <p className="text-sm">
                Drag items from the sidebar to place them on the canvas
              </p>
            </div>
          </div>
        )}

        {/* Drag Over State */}
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-primary">
              <div className="text-6xl mb-4">+</div>
              <p className="text-lg font-semibold">Drop to add item</p>
            </div>
          </div>
        )}

        {/* Rendered Canvas Items */}
        {canvasItems.map((item) => (
          <CanvasItem key={item.id} item={item} />
        ))}
        </div>
      </div>
    </div>
  );
}
