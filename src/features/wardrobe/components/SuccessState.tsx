"use client";

/**
 * SuccessState Component
 * Displays success feedback with action buttons after upload completion
 */

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Eye, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SuccessStateProps {
  /**
   * Preview URL (optional)
   */
  previewUrl?: string | null;

  /**
   * Item ID (for viewing the item)
   */
  itemId?: string | null;

  /**
   * Success title
   */
  title?: string;

  /**
   * Success message
   */
  message?: string;

  /**
   * Callback when "View Item" is clicked
   */
  onViewItem?: () => void;

  /**
   * Callback when "Add Another" is clicked
   */
  onAddAnother?: () => void;

  /**
   * Callback when "Close" is clicked
   */
  onClose?: () => void;

  /**
   * Custom className
   */
  className?: string;

  /**
   * Show preview image
   */
  showPreview?: boolean;

  /**
   * Show action buttons
   */
  showActions?: boolean;

  /**
   * Custom action buttons
   */
  customActions?: React.ReactNode;
}

/**
 * SuccessState component
 */
export function SuccessState({
  previewUrl,
  itemId: _itemId,
  title = 'Item Successfully Added!',
  message = 'Your item has been added to your wardrobe and is ready to use.',
  onViewItem,
  onAddAnother,
  onClose,
  className,
  showPreview = true,
  showActions = true,
  customActions,
}: SuccessStateProps) {
  return (
    <div className={cn('text-center space-y-6 py-8', className)} role="status" aria-live="polite">
      {/* Success icon */}
      <div className="flex justify-center">
        <div className="p-4 bg-green-100 rounded-full">
          <CheckCircle2 className="w-16 h-16 text-green-600" aria-hidden="true" />
        </div>
      </div>

      {/* Success message */}
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        <p className="text-gray-600">{message}</p>
      </div>

      {/* Preview image */}
      {showPreview && previewUrl && (
        <Card className="p-4 max-w-xs mx-auto">
          <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={previewUrl}
              alt="Successfully added item"
              fill
              className="object-contain"
              priority
              sizes="(max-width: 768px) 100vw, 384px"
            />
          </div>
        </Card>
      )}

      {/* Action buttons */}
      {showActions && (
        <div className="flex flex-col gap-3 pt-4">
          {customActions ? (
            customActions
          ) : (
            <>
              {/* View Item button */}
              {onViewItem && (
                <Button onClick={onViewItem} className="w-full" size="lg">
                  <Eye className="w-4 h-4 mr-2" aria-hidden="true" />
                  View Item
                </Button>
              )}

              {/* Add Another button */}
              {onAddAnother && (
                <Button onClick={onAddAnother} variant="outline" className="w-full" size="lg">
                  <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
                  Add Another Item
                </Button>
              )}

              {/* Close button */}
              {onClose && (
                <Button onClick={onClose} variant="ghost" className="w-full">
                  <X className="w-4 h-4 mr-2" aria-hidden="true" />
                  Close
                </Button>
              )}
            </>
          )}
        </div>
      )}

      {/* Screen reader announcement */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {title}. {message}
      </div>
    </div>
  );
}
