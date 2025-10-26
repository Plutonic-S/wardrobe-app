"use client";

/**
 * FilePreview Component
 * Displays image preview with change button and accessibility support
 */

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilePreviewProps {
  /**
   * Preview URL (blob or data URL)
   */
  previewUrl: string;

  /**
   * Alt text for the image
   */
  alt?: string;

  /**
   * Callback when change button is clicked
   */
  onChangeImage?: () => void;

  /**
   * Callback when remove button is clicked
   */
  onRemoveImage?: () => void;

  /**
   * Whether actions are disabled
   */
  disabled?: boolean;

  /**
   * Custom className for the container
   */
  className?: string;

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Show change button
   */
  showChangeButton?: boolean;

  /**
   * Show remove button
   */
  showRemoveButton?: boolean;

  /**
   * File name to display
   */
  fileName?: string;

  /**
   * File size to display (in bytes)
   */
  fileSize?: number;
}

/**
 * Size presets for preview
 */
const SIZE_PRESETS = {
  sm: 'max-w-xs',
  md: 'max-w-md',
  lg: 'max-w-lg',
} as const;

/**
 * Formats file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * FilePreview component
 */
export function FilePreview({
  previewUrl,
  alt = 'Image preview',
  onChangeImage,
  onRemoveImage,
  disabled = false,
  className,
  size = 'md',
  showChangeButton = true,
  showRemoveButton = false,
  fileName,
  fileSize,
}: FilePreviewProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Preview card */}
      <Card className="p-4 relative group">
        {/* Image preview */}
        <div
          className={cn(
            'relative w-full aspect-square mx-auto rounded-lg overflow-hidden bg-gray-100',
            SIZE_PRESETS[size]
          )}
        >
          <Image
            src={previewUrl}
            alt={alt}
            fill
            className="object-contain"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        {/* Remove button overlay (top right) */}
        {showRemoveButton && onRemoveImage && (
          <Button
            onClick={onRemoveImage}
            disabled={disabled}
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
            aria-label="Remove image"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </Button>
        )}

        {/* File info (if provided) */}
        {(fileName || fileSize) && (
          <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
            {fileName && (
              <p className="text-sm font-medium text-gray-700 truncate" title={fileName}>
                {fileName}
              </p>
            )}
            {fileSize && (
              <p className="text-xs text-gray-500">{formatFileSize(fileSize)}</p>
            )}
          </div>
        )}
      </Card>

      {/* Action buttons */}
      <div className="flex gap-2">
        {showChangeButton && onChangeImage && (
          <Button
            onClick={onChangeImage}
            disabled={disabled}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
            Change Image
          </Button>
        )}

        {showRemoveButton && onRemoveImage && !showChangeButton && (
          <Button
            onClick={onRemoveImage}
            disabled={disabled}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" aria-hidden="true" />
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
