// src/features/calendar/components/OutfitSelectorModal.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import Image from 'next/image';
import type { OutfitAssignment, OutfitWithPreview } from '../types/calendar.types';

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
  const [outfits, setOutfits] = useState<OutfitWithPreview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOutfitId, setSelectedOutfitId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchOutfits();
    }
  }, [isOpen]);

  const fetchOutfits = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/outfits', {
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
          <div className="h-48 flex items-center justify-center">
            Loading outfits...
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
              {outfits.map((outfit, index) => {
                // Use _id (MongoDB), id (transformed), or fallback to index
                const outfitId = outfit._id || outfit.id || `outfit-${index}`;
                return (
                  <button
                    key={outfitId}
                    onClick={() => setSelectedOutfitId(outfitId)}
                    className={`relative border rounded-lg p-2 transition-all ${
                      selectedOutfitId === outfitId
                        ? 'border-primary ring-2 ring-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                  {outfit.previewImage?.url ? (
                    <div className="relative w-full h-32 mb-2 rounded overflow-hidden">
                      <Image
                        src={outfit.previewImage.url}
                        alt={outfit.metadata?.name || 'Outfit'}
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
                    <p className="text-sm font-medium truncate">
                      {outfit.metadata?.name || 'Unnamed Outfit'}
                    </p>
                  </button>
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
