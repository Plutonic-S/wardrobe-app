"use client";

/**
 * ErrorState Component
 * Displays error feedback with retry and recovery options
 */

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { XCircle, RefreshCw, Upload, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'error' | 'warning' | 'info';

export interface ErrorStateProps {
  /**
   * Error title
   */
  title?: string;

  /**
   * Error message
   */
  message: string;

  /**
   * Additional error details (optional)
   */
  details?: string;

  /**
   * Error severity
   */
  severity?: ErrorSeverity;

  /**
   * Callback when "Retry" is clicked
   */
  onRetry?: () => void;

  /**
   * Callback when "Change Image" is clicked
   */
  onChangeImage?: () => void;

  /**
   * Callback when "Cancel" is clicked
   */
  onCancel?: () => void;

  /**
   * Custom className
   */
  className?: string;

  /**
   * Show retry button
   */
  showRetryButton?: boolean;

  /**
   * Show change image button
   */
  showChangeImageButton?: boolean;

  /**
   * Show cancel button
   */
  showCancelButton?: boolean;

  /**
   * Custom action buttons
   */
  customActions?: React.ReactNode;

  /**
   * Is retrying
   */
  isRetrying?: boolean;
}

/**
 * Severity styles configuration
 */
const SEVERITY_STYLES = {
  error: {
    iconBg: 'bg-red-100',
    icon: 'text-red-600',
    titleColor: 'text-red-900',
    messageColor: 'text-red-700',
    detailsBg: 'bg-red-50',
    detailsBorder: 'border-red-200',
    detailsText: 'text-red-600',
  },
  warning: {
    iconBg: 'bg-orange-100',
    icon: 'text-orange-600',
    titleColor: 'text-orange-900',
    messageColor: 'text-orange-700',
    detailsBg: 'bg-orange-50',
    detailsBorder: 'border-orange-200',
    detailsText: 'text-orange-600',
  },
  info: {
    iconBg: 'bg-blue-100',
    icon: 'text-blue-600',
    titleColor: 'text-blue-900',
    messageColor: 'text-blue-700',
    detailsBg: 'bg-blue-50',
    detailsBorder: 'border-blue-200',
    detailsText: 'text-blue-600',
  },
} as const;

/**
 * ErrorState component
 */
export function ErrorState({
  title,
  message,
  details,
  severity = 'error',
  onRetry,
  onChangeImage,
  onCancel,
  className,
  showRetryButton = true,
  showChangeImageButton = true,
  showCancelButton = false,
  customActions,
  isRetrying = false,
}: ErrorStateProps) {
  const styles = SEVERITY_STYLES[severity];

  // Determine icon based on severity
  const IconComponent =
    severity === 'error' ? XCircle : severity === 'warning' ? AlertTriangle : XCircle;

  // Default title based on severity
  const defaultTitle =
    severity === 'error'
      ? 'Upload Failed'
      : severity === 'warning'
      ? 'Upload Warning'
      : 'Upload Issue';

  return (
    <div className={cn('space-y-6 py-4', className)} role="alert" aria-live="assertive">
      {/* Error icon */}
      <div className="flex justify-center">
        <div className={cn('p-4 rounded-full', styles.iconBg)}>
          <IconComponent className={cn('w-12 h-12', styles.icon)} aria-hidden="true" />
        </div>
      </div>

      {/* Error message */}
      <div className="space-y-2 text-center">
        <h3 className={cn('text-lg font-bold', styles.titleColor)}>{title || defaultTitle}</h3>
        <p className={cn('text-sm', styles.messageColor)}>{message}</p>
      </div>

      {/* Error details */}
      {details && (
        <Card className={cn('p-4', styles.detailsBg, styles.detailsBorder)}>
          <p className={cn('text-sm', styles.detailsText)}>{details}</p>
        </Card>
      )}

      {/* Action buttons */}
      {!customActions && (showRetryButton || showChangeImageButton || showCancelButton) && (
        <div className="flex flex-col gap-3">
          {/* Retry button */}
          {showRetryButton && onRetry && (
            <Button
              onClick={onRetry}
              disabled={isRetrying}
              className="w-full"
              size="lg"
              variant="default"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                  Retry Upload
                </>
              )}
            </Button>
          )}

          {/* Change Image button */}
          {showChangeImageButton && onChangeImage && (
            <Button
              onClick={onChangeImage}
              disabled={isRetrying}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
              Try Different Image
            </Button>
          )}

          {/* Cancel button */}
          {showCancelButton && onCancel && (
            <Button
              onClick={onCancel}
              disabled={isRetrying}
              variant="ghost"
              className="w-full"
            >
              Cancel
            </Button>
          )}
        </div>
      )}

      {/* Custom actions */}
      {customActions && <div className="flex flex-col gap-3">{customActions}</div>}

      {/* Screen reader announcement */}
      <div className="sr-only" role="status" aria-live="assertive" aria-atomic="true">
        {severity === 'error' ? 'Error: ' : severity === 'warning' ? 'Warning: ' : ''}
        {message}
        {details && `. ${details}`}
      </div>
    </div>
  );
}
