// src/features/calendar/components/OutfitSelectorModal.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import type { OutfitAssignment } from '../types/calendar.types';
import { Skeleton } from '@/components/ui/skeleton';

// Lightweight outfit type for selector (matches /api/outfits/list response)
interface OutfitListItem {
  id: string;
  name: string;
  previewImage: { url: string } | null;
  mode: 'manual' | 'combination';
  favorite: boolean;
}

interface OutfitSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (outfitId: string, occasion?: string) => void;
  onRemove?: (assignmentId: string) => void;
  selectedDate: Date | null;
  currentAssignment?: OutfitAssignment;
}

export function OutfitSelectorModal({
  isOpen,
  onClose,
  onSelect,
  onRemove,
  selectedDate,
  currentAssignment,
}: OutfitSelectorModalProps) {
  const [outfits, setOutfits] = useState<OutfitListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOutfitId, setSelectedOutfitId] = useState<string>('');
  const hasFetched = useRef(false);

  useEffect(() => {
    if (isOpen && !hasFetched.current) {
      fetchOutfits();
      hasFetched.current = true;
    }
  }, [isOpen]);

  // Reset cache when modal closes so new outfits can be fetched next time
  useEffect(() => {
    if (!isOpen) {
      hasFetched.current = false;
    }
  }, [isOpen]);

  const fetchOutfits = async () => {
    setIsLoading(true);
    try {
      // Use lightweight endpoint for fast loading
      const response = await fetch('/api/outfits/list', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setOutfits(data.data.outfits || []);
      }
    } catch (error) {
      console.error('Failed to fetch outfits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = () => {
    if (selectedOutfitId) {
      onSelect(selectedOutfitId);
      setSelectedOutfitId('');
    }
  };

  const handleRemove = () => {
    if (currentAssignment && onRemove) {
      onRemove(currentAssignment._id);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Select Outfit for {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
          </DialogTitle>
        </DialogHeader>

        {currentAssignment && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Current: {currentAssignment.outfitId?.metadata?.name || 'Unnamed Outfit'}
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border rounded-lg p-2">
                <Skeleton className="w-full h-32 mb-2 rounded" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : outfits.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-muted-foreground">
            <p>No outfits created yet</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => (window.location.href = '/outfits/new')}
            >
              Create Outfit
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {outfits.map((outfit) => {
                const outfitId = outfit.id;
                return (
                  <div
                    key={outfitId}
                    className={`relative border rounded-lg p-2 transition-all ${
                      selectedOutfitId === outfitId
                        ? 'border-primary ring-2 ring-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedOutfitId(outfitId)}
                      className="w-full text-left"
                    >
                      {outfit.previewImage?.url ? (
                        <div className="relative w-full h-32 mb-2 rounded overflow-hidden">
                          <Image
                            src={outfit.previewImage.url}
                            alt={outfit.name || 'Outfit'}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-full h-32 mb-2 bg-muted rounded flex items-center justify-center">
                          <span className="text-muted-foreground text-xs">No preview</span>
                        </div>
                      )}
                    </button>
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-sm font-medium truncate flex-1">
                        {outfit.name || 'Unnamed Outfit'}
                      </p>
                      <Link
                        href={`/outfits/${outfitId}`}
                        target="_blank"
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                        title="View outfit details"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between gap-2 mt-6">
              <div>
                {currentAssignment && onRemove && (
                  <Button variant="destructive" onClick={handleRemove}>
                    Remove Assignment
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleSelect} disabled={!selectedOutfitId}>
                  {currentAssignment ? 'Change Outfit' : 'Assign Outfit'}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
