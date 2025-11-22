// src/features/outfit-builder/components/shared/OutfitRenderer.tsx

'use client';

/* eslint-disable @next/next/no-img-element */
// Note: We use <img> instead of Next.js <Image> because this component is
// specifically designed to be captured by html2canvas, which doesn't work
// properly with Next.js Image component's lazy loading and optimization.

import React from 'react';
import { ClothResponse } from '@/features/wardrobe/types/wardrobe.types';
import { DressMeConfiguration, CanvasItem } from '../../types/outfit.types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Slot position configuration
 */
interface SlotPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

/**
 * Dress Me render data
 */
interface DressMeRenderData {
  configuration: DressMeConfiguration;
  items: {
    tops?: ClothResponse;
    outerwear?: ClothResponse;
    bottoms?: ClothResponse;
    dresses?: ClothResponse;
    footwear?: ClothResponse;
    accessories?: ClothResponse[];
  };
}

/**
 * Canvas render data
 */
interface CanvasRenderData {
  items: CanvasItem[];
  wardrobeItems: ClothResponse[];
  viewport?: { zoom: number; pan: { x: number; y: number } };
}

/**
 * OutfitRenderer props
 */
interface OutfitRendererProps {
  mode: 'dress-me' | 'canvas';
  dressMe?: DressMeRenderData;
  canvas?: CanvasRenderData;
  size?: { width: number; height: number };
  onRenderComplete?: () => void;
  className?: string;
}

// ============================================================================
// SLOT POSITION CALCULATOR
// ============================================================================

/**
 * Calculate slot positions based on configuration
 */
const getSlotPositions = (
  config: DressMeConfiguration
): Record<string, SlotPosition> => {
  const baseWidth = 1000;
  const padding = 40;

  switch (config) {
    case '2-part':
      // Vertical stack: dresses + footwear
      return {
        dresses: {
          x: padding,
          y: padding,
          width: baseWidth - 2 * padding,
          height: 450,
          zIndex: 1,
        },
        footwear: {
          x: padding,
          y: 510,
          width: baseWidth - 2 * padding,
          height: 450,
          zIndex: 1,
        },
      };

    case '3-part':
      // Vertical stack: tops + bottoms + footwear
      return {
        tops: {
          x: padding,
          y: padding,
          width: baseWidth - 2 * padding,
          height: 300,
          zIndex: 1,
        },
        bottoms: {
          x: padding,
          y: 360,
          width: baseWidth - 2 * padding,
          height: 300,
          zIndex: 1,
        },
        footwear: {
          x: padding,
          y: 680,
          width: baseWidth - 2 * padding,
          height: 280,
          zIndex: 1,
        },
      };

    case '4-part':
      // Side-by-side: tops + outerwear, then bottoms + footwear
      return {
        tops: {
          x: padding,
          y: padding,
          width: 450,
          height: 350,
          zIndex: 1,
        },
        outerwear: {
          x: 510,
          y: padding,
          width: 450,
          height: 350,
          zIndex: 1,
        },
        bottoms: {
          x: padding,
          y: 410,
          width: baseWidth - 2 * padding,
          height: 300,
          zIndex: 1,
        },
        footwear: {
          x: padding,
          y: 730,
          width: baseWidth - 2 * padding,
          height: 230,
          zIndex: 1,
        },
      };
  }
};

// ============================================================================
// OUTFIT RENDERER COMPONENT
// ============================================================================

/**
 * OutfitRenderer - Renders outfit in snapshot-ready format
 * Hidden component used for html2canvas capture
 */
export const OutfitRenderer: React.FC<OutfitRendererProps> = ({
  mode,
  dressMe,
  canvas,
  size = { width: 1000, height: 1000 },
  onRenderComplete,
  className = '',
}) => {
  // Trigger onRenderComplete after component mounts
  React.useEffect(() => {
    if (onRenderComplete) {
      // Wait for images to potentially load
      const timer = setTimeout(() => {
        onRenderComplete();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [onRenderComplete]);

  // ============================================================================
  // DRESS ME RENDERING
  // ============================================================================

  const renderDressMe = () => {
    if (!dressMe) return null;

    const { configuration, items } = dressMe;
    const slotPositions = getSlotPositions(configuration);

    return (
      <div
        className="relative bg-transparent"
        style={{
          width: `${size.width}px`,
          height: `${size.height}px`,
        }}
      >
        {/* Tops */}
        {items.tops && slotPositions.tops && (
          <div
            className="absolute"
            style={{
              left: `${slotPositions.tops.x}px`,
              top: `${slotPositions.tops.y}px`,
              width: `${slotPositions.tops.width}px`,
              height: `${slotPositions.tops.height}px`,
              zIndex: slotPositions.tops.zIndex,
            }}
          >
            <img
              src={items.tops.optimizedUrl || items.tops.thumbnailUrl}
              alt={items.tops.name}
              style={{
                width: '90%',
                height: '90%',
                objectFit: 'contain',
                margin: 'auto',
                display: 'block',
              }}
              crossOrigin="anonymous"
            />
          </div>
        )}

        {/* Outerwear (4-part only) */}
        {items.outerwear && slotPositions.outerwear && (
          <div
            className="absolute"
            style={{
              left: `${slotPositions.outerwear.x}px`,
              top: `${slotPositions.outerwear.y}px`,
              width: `${slotPositions.outerwear.width}px`,
              height: `${slotPositions.outerwear.height}px`,
              zIndex: slotPositions.outerwear.zIndex,
            }}
          >
            <img
              src={items.outerwear.optimizedUrl || items.outerwear.thumbnailUrl}
              alt={items.outerwear.name}
              style={{
                width: '90%',
                height: '90%',
                objectFit: 'contain',
                margin: 'auto',
                display: 'block',
              }}
              crossOrigin="anonymous"
            />
          </div>
        )}

        {/* Bottoms */}
        {items.bottoms && slotPositions.bottoms && (
          <div
            className="absolute"
            style={{
              left: `${slotPositions.bottoms.x}px`,
              top: `${slotPositions.bottoms.y}px`,
              width: `${slotPositions.bottoms.width}px`,
              height: `${slotPositions.bottoms.height}px`,
              zIndex: slotPositions.bottoms.zIndex,
            }}
          >
            <img
              src={items.bottoms.optimizedUrl || items.bottoms.thumbnailUrl}
              alt={items.bottoms.name}
              style={{
                width: '90%',
                height: '90%',
                objectFit: 'contain',
                margin: 'auto',
                display: 'block',
              }}
              crossOrigin="anonymous"
            />
          </div>
        )}

        {/* Footwear */}
        {items.footwear && slotPositions.footwear && (
          <div
            className="absolute"
            style={{
              left: `${slotPositions.footwear.x}px`,
              top: `${slotPositions.footwear.y}px`,
              width: `${slotPositions.footwear.width}px`,
              height: `${slotPositions.footwear.height}px`,
              zIndex: slotPositions.footwear.zIndex,
            }}
          >
            <img
              src={items.footwear.optimizedUrl || items.footwear.thumbnailUrl}
              alt={items.footwear.name}
              style={{
                width: '90%',
                height: '90%',
                objectFit: 'contain',
                margin: 'auto',
                display: 'block',
              }}
              crossOrigin="anonymous"
            />
          </div>
        )}

        {/* Dresses (2-part only) */}
        {items.dresses && slotPositions.dresses && (
          <div
            className="absolute"
            style={{
              left: `${slotPositions.dresses.x}px`,
              top: `${slotPositions.dresses.y}px`,
              width: `${slotPositions.dresses.width}px`,
              height: `${slotPositions.dresses.height}px`,
              zIndex: slotPositions.dresses.zIndex,
            }}
          >
            <img
              src={items.dresses.optimizedUrl || items.dresses.thumbnailUrl}
              alt={items.dresses.name}
              style={{
                width: '90%',
                height: '90%',
                objectFit: 'contain',
                margin: 'auto',
                display: 'block',
              }}
              crossOrigin="anonymous"
            />
          </div>
        )}

        {/* Accessories - layer on top */}
        {items.accessories &&
          items.accessories.map((accessory, index) => (
            <div
              key={`accessory-${index}`}
              className="absolute"
              style={{
                left: `${40 + index * 100}px`,
                top: `${size.height - 120}px`,
                width: '80px',
                height: '80px',
                zIndex: 10,
              }}
            >
              <img
                src={accessory.optimizedUrl || accessory.thumbnailUrl}
                alt={accessory.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
                crossOrigin="anonymous"
              />
            </div>
          ))}
      </div>
    );
  };

  // ============================================================================
  // CANVAS RENDERING
  // ============================================================================

  const renderCanvas = () => {
    if (!canvas) return null;

    const { items: canvasItems, wardrobeItems } = canvas;

    return (
      <div
        className="relative bg-transparent"
        style={{
          width: `${size.width}px`,
          height: `${size.height}px`,
        }}
      >
        {canvasItems
          .sort((a, b) => a.zIndex - b.zIndex) // Render in zIndex order
          .map((item) => {
            const clothItem = wardrobeItems.find(
              (w) => w.id === item.clothItemId
            );

            if (!clothItem) return null;

            return (
              <div
                key={item.id}
                className="absolute"
                style={{
                  left: `${item.position.x}px`,
                  top: `${item.position.y}px`,
                  width: `${item.size.width * 1.3}px`,
                  height: `${item.size.height * 1.3}px`,
                  transform: `rotate(${item.rotation}deg)`,
                  zIndex: item.zIndex,
                }}
              >
                <img
                  src={clothItem.optimizedUrl || clothItem.thumbnailUrl}
                  alt={clothItem.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                  crossOrigin="anonymous"
                />
              </div>
            );
          })}
      </div>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={className}>
      {mode === 'dress-me' ? renderDressMe() : renderCanvas()}
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export { getSlotPositions };
export type {
  OutfitRendererProps,
  DressMeRenderData,
  CanvasRenderData,
  SlotPosition,
};
