"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { ClothResponse } from "../types/wardrobe.types";
import { formatRelativeDate } from "../utils/date-utils";
import { cn } from "@/lib/utils";

interface WardrobeItemCardProps {
  item: ClothResponse;
  onFavoriteToggle?: (itemId: string, isFavorite: boolean) => Promise<void>;
  onClick?: (item: ClothResponse) => void;
  className?: string;
}

export function WardrobeItemCard({
  item,
  onFavoriteToggle,
  onClick,
  className,
}: WardrobeItemCardProps) {
  const [isFavorite, setIsFavorite] = useState(item.favorite);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event

    if (isTogglingFavorite || !onFavoriteToggle) return;

    setIsTogglingFavorite(true);
    const newFavoriteState = !isFavorite;

    try {
      // Optimistic update
      setIsFavorite(newFavoriteState);
      await onFavoriteToggle(item.id, newFavoriteState);
    } catch (error) {
      // Revert on error
      setIsFavorite(!newFavoriteState);
      console.error("Failed to toggle favorite:", error);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(item);
    }
  };

  // Format the last worn date
  const lastWornText = formatRelativeDate(item.lastWornDate);

  // Get the thumbnail URL or fallback to optimized/original
  const imageUrl = item.thumbnailUrl || item.optimizedUrl || item.originalUrl;

  return (
    <Card
      className={cn(
        "overflow-hidden cursor-pointer transition-all duration-300 ease-in-out",
        "hover:shadow-lg hover:-translate-y-1",
        "rounded-[14px] border bg-card",
        className
      )}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Section */}
      <div className="relative aspect-square w-full overflow-hidden">
        <Image
          src={imageUrl}
          alt={item.name}
          fill
          unoptimized
          className="object-cover transition-transform duration-500 ease-out"
          style={{
            transform: isHovered ? "scale(1.03)" : "scale(1)",
          }}
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={false}
        />

        {/* Favorite Heart Icon - Using shadcn Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleFavoriteClick}
          disabled={isTogglingFavorite}
          className={cn(
            "absolute top-3 right-3",
            "bg-white/90 backdrop-blur-sm shadow-md",
            "transition-all duration-200 ease-in-out",
            "hover:scale-110 hover:bg-white",
            "rounded-full",
            "disabled:opacity-50"
          )}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            className={cn(
              "transition-all duration-300 ease-in-out",
              isFavorite
                ? "fill-red-500 stroke-red-500 scale-110"
                : "fill-none stroke-gray-600 hover:stroke-red-400"
            )}
            strokeWidth={2}
          />
        </Button>

        {/* Processing Status Badge (if still processing) */}
        {item.processingStatus === "processing" && (
          <div className="absolute bottom-3 left-3 px-3 py-1 bg-primary/90 backdrop-blur-sm rounded-full">
            <span className="text-xs font-medium text-primary-foreground">Processing...</span>
          </div>
        )}

        {item.processingStatus === "failed" && (
          <div className="absolute bottom-3 left-3 px-3 py-1 bg-destructive/90 backdrop-blur-sm rounded-full">
            <span className="text-xs font-medium text-destructive-foreground">Processing Failed</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-2">
        {/* Item Name */}
        <h3 className="font-semibold text-foreground text-base leading-tight line-clamp-1">
          {item.name}
        </h3>

        {/* Subcategory */}
        <p className="text-sm text-muted-foreground capitalize">
          {item.subcategory}
        </p>

        {/* Last Worn Date */}
        <p className="text-xs text-muted-foreground/70 pt-1">
          {lastWornText === "Never worn" ? (
            <span className="italic">{lastWornText}</span>
          ) : (
            <>Last worn {lastWornText}</>
          )}
        </p>
      </div>
    </Card>
  );
}
