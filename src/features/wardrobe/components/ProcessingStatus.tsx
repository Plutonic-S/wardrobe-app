"use client";

/**
 * ProcessingStatus Component
 * Displays real-time processing status with step-by-step progress
 */

import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProcessingStep } from '../hooks/useProcessingStatus';
import { ProcessingStatus as ProcessingStatusType } from '../types/wardrobe.types';

export interface ProcessingStatusProps {
  /**
   * Overall processing status
   */
  status: ProcessingStatusType;

  /**
   * Processing steps with their individual statuses
   */
  steps: ProcessingStep[];

  /**
   * Current processing step name
   */
  currentStep?: string | null;

  /**
   * Processing progress (0-100)
   */
  progress?: number;

  /**
   * Error message (shown when status is 'failed')
   */
  error?: string | null;

  /**
   * Custom className
   */
  className?: string;

  /**
   * Compact mode (less padding and smaller text)
   */
  compact?: boolean;
}

/**
 * ProcessingStatus component
 */
export function ProcessingStatus({
  status,
  steps,
  currentStep,
  progress = 0,
  error,
  className,
  compact = false,
}: ProcessingStatusProps) {
  const isProcessing = status === 'processing' || status === 'pending';
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';

  return (
    <div
      className={cn('w-full space-y-4', className)}
      role="region"
      aria-label="Processing status"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isProcessing && (
            <>
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" aria-hidden="true" />
              <h3 className="text-base font-semibold text-gray-900">Processing image...</h3>
            </>
          )}

          {isCompleted && (
            <>
              <CheckCircle2 className="w-5 h-5 text-green-600" aria-hidden="true" />
              <h3 className="text-base font-semibold text-green-700">
                Item successfully added!
              </h3>
            </>
          )}

          {isFailed && (
            <>
              <XCircle className="w-5 h-5 text-red-600" aria-hidden="true" />
              <h3 className="text-base font-semibold text-red-700">Processing failed</h3>
            </>
          )}
        </div>

        {/* Progress percentage */}
        {isProcessing && progress > 0 && (
          <span className="text-sm font-semibold text-blue-600 tabular-nums" aria-live="polite">
            {Math.round(progress)}%
          </span>
        )}
      </div>

      {/* Processing steps */}
      <div className={cn('space-y-2', compact && 'space-y-1')}>
        {steps.map((step) => {
          const isStepCompleted = step.status === 'completed';
          const isStepProcessing = step.status === 'processing';
          const isStepFailed = step.status === 'failed';
          const isStepPending = step.status === 'pending';

          return (
            <div
              key={step.name}
              className={cn(
                'flex items-center gap-3 transition-all duration-200',
                compact ? 'py-1.5' : 'py-2'
              )}
            >
              {/* Step icon */}
              <div className="flex-shrink-0">
                {isStepCompleted && (
                  <CheckCircle2
                    className="w-4 h-4 text-green-600"
                    aria-hidden="true"
                  />
                )}

                {isStepProcessing && (
                  <Loader2
                    className="w-4 h-4 text-blue-600 animate-spin"
                    aria-hidden="true"
                  />
                )}

                {isStepFailed && (
                  <XCircle className="w-4 h-4 text-red-600" aria-hidden="true" />
                )}

                {isStepPending && (
                  <Circle className="w-4 h-4 text-gray-300" aria-hidden="true" />
                )}
              </div>

              {/* Step label */}
              <span
                className={cn(
                  'text-sm font-medium transition-colors duration-200',
                  isStepCompleted && 'text-green-700',
                  isStepProcessing && 'text-blue-700',
                  isStepFailed && 'text-red-700',
                  isStepPending && 'text-gray-400',
                  compact && 'text-xs'
                )}
              >
                {step.label}
              </span>

              {/* Current step indicator */}
              {isStepProcessing && (
                <span className="ml-auto text-xs text-blue-600 font-medium">
                  In progress
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Error message */}
      {isFailed && error && (
        <div
          className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"
          role="alert"
        >
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success message with additional context */}
      {isCompleted && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">
            Your item has been successfully processed and added to your wardrobe.
          </p>
        </div>
      )}

      {/* Screen reader announcements */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {isProcessing && currentStep && `Processing: ${currentStep}`}
        {isCompleted && 'Processing completed successfully'}
        {isFailed && `Processing failed: ${error || 'Unknown error'}`}
      </div>
    </div>
  );
}
