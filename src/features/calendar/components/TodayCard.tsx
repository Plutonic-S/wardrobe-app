// src/features/calendar/components/TodayCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Plus, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { OutfitAssignment } from '../types/calendar.types';

interface TodayCardProps {
  assignment: OutfitAssignment | null;
  title?: string;
  onMarkWorn: (id: string) => void;
  onRemove: (id: string) => void;
  onAssign: () => void;
}

export function TodayCard({
  assignment,
  title = "Today's Outfit",
  onMarkWorn,
  onRemove,
  onAssign,
}: TodayCardProps) {
  if (!assignment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <Plus className="w-8 h-8 mb-2" />
            <p className="text-sm mb-2">No outfit planned</p>
            <Button size="sm" onClick={onAssign}>
              Assign Outfit
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const outfit = assignment.outfitId;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          {title}
          {assignment.isWorn && (
            <span className="text-sm text-green-500 flex items-center gap-1">
              <Check className="w-4 h-4" /> Worn
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {outfit?.previewImage?.url ? (
          <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
            <Image
              src={outfit.previewImage.url}
              alt={outfit.metadata?.name || 'Outfit'}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        ) : (
          <div className="w-full h-48 mb-4 rounded-lg bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-sm">
              No preview available
            </span>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">
              {outfit?.metadata?.name || 'Unnamed Outfit'}
            </h4>
            {outfit && (
              <Link
                href={`/outfits/${outfit._id || outfit.id}`}
                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                title="View outfit details"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
            )}
          </div>
          {assignment.occasion && (
            <p className="text-sm text-muted-foreground">
              {assignment.occasion}
            </p>
          )}

          <div className="flex gap-2 mt-4">
            {!assignment.isWorn && (
              <Button
                size="sm"
                onClick={() => onMarkWorn(assignment._id)}
                className="flex-1"
              >
                <Check className="w-4 h-4 mr-1" />
                Mark Worn
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRemove(assignment._id)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
