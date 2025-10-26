"use client";

/**
 * UploadProgress Component
 * Displays upload progress with visual feedback and accessibility support
 */

import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UploadProgressProps {
  /**
   * Upload progress (0-100)
   */
  progress: number;

  /**
   * Upload state
   */
  state: 'idle' | 'uploading' | 'success' | 'error';

  /**
   * Error message (shown when state is 'error')
   */
  errorMessage?: string;

  /**
   * Custom className
   */
  className?: string;

  /**
   * Show percentage text
   */
  showPercentage?: boolean;
}

/**
 * UploadProgress component
 */
export function UploadProgress({
  progress,
  state,
  errorMessage,
  className,
  showPercentage = true,
}: UploadProgressProps) {
  // Don't render if idle
  if (state === 'idle') {
    return null;
  }

  const isUploading = state === 'uploading';
  const isSuccess = state === 'success';
  const isError = state === 'error';

  return (
    <div className={cn('w-full space-y-3', className)} role="region" aria-label="Upload progress">
      {/* Status header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isUploading && (
            <>
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" aria-hidden="true" />
              <span className="text-sm font-medium text-gray-700">Uploading...</span>
            </>
          )}

          {isSuccess && (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-600" aria-hidden="true" />
              <span className="text-sm font-medium text-green-700">Upload complete</span>
            </>
          )}

          {isError && (
            <>
              <XCircle className="w-4 h-4 text-red-600" aria-hidden="true" />
              <span className="text-sm font-medium text-red-700">Upload failed</span>
            </>
          )}
        </div>

        {/* Percentage display */}
        {showPercentage && (isUploading || isSuccess) && (
          <span
            className={cn(
              'text-sm font-semibold tabular-nums',
              isSuccess ? 'text-green-600' : 'text-blue-600'
            )}
            aria-live="polite"
            aria-atomic="true"
          >
            {Math.round(progress)}%
          </span>
        )}
      </div>

      {/* Progress bar */}
      <Progress
        value={progress}
        className={cn(
          'h-2 transition-all duration-300',
          isError && 'bg-red-100'
        )}
        indicatorClassName={cn(
          'transition-all duration-300',
          isSuccess && 'bg-green-500',
          isError && 'bg-red-500',
          isUploading && 'bg-blue-500'
        )}
        aria-label={`Upload progress: ${Math.round(progress)}%`}
      />

      {/* Error message */}
      {isError && errorMessage && (
        <p className="text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      )}

      {/* Screen reader announcement */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {isUploading && `Uploading: ${Math.round(progress)} percent complete`}
        {isSuccess && 'Upload completed successfully'}
        {isError && `Upload failed: ${errorMessage || 'Unknown error'}`}
      </div>
    </div>
  );
}
