/**
 * Custom hook for polling image processing status
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ProcessingStatus } from '../types/wardrobe.types';

/**
 * Processing step information
 */
export interface ProcessingStep {
  name: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

/**
 * Processing status response from backend
 */
export interface ProcessingStatusResponse {
  imageId: string;
  status: ProcessingStatus;
  currentStep?: string;
  progress?: number;
  error?: string;
  completedAt?: string;
}

/**
 * Hook options
 */
export interface UseProcessingStatusOptions {
  /**
   * Image ID to poll status for
   */
  imageId: string | null;

  /**
   * Polling interval in milliseconds (default: 2000)
   */
  pollInterval?: number;

  /**
   * Maximum number of poll attempts (default: 60)
   */
  maxAttempts?: number;

  /**
   * Callback when processing completes
   */
  onComplete?: (response: ProcessingStatusResponse) => void;

  /**
   * Callback when processing fails
   */
  onError?: (error: string) => void;

  /**
   * Whether to start polling immediately (default: true)
   */
  autoStart?: boolean;
}

/**
 * Hook return type
 */
export interface UseProcessingStatusReturn {
  // State
  status: ProcessingStatus;
  currentStep: string | null;
  progress: number;
  error: string | null;
  steps: ProcessingStep[];

  // Actions
  startPolling: () => void;
  stopPolling: () => void;

  // Computed
  isPolling: boolean;
  isProcessing: boolean;
  isCompleted: boolean;
  isFailed: boolean;
}

/**
 * Default processing steps
 */
const DEFAULT_STEPS: ProcessingStep[] = [
  { name: 'upload', label: 'Upload', status: 'completed' },
  { name: 'background-removal', label: 'Background removal', status: 'pending' },
  { name: 'optimization', label: 'Optimization', status: 'pending' },
  { name: 'thumbnail', label: 'Thumbnail generation', status: 'pending' },
  { name: 'color-extraction', label: 'Color extraction', status: 'pending' },
];

/**
 * Custom hook for polling image processing status
 */
export function useProcessingStatus(
  options: UseProcessingStatusOptions
): UseProcessingStatusReturn {
  const {
    imageId,
    pollInterval = 2000,
    maxAttempts = 60,
    onComplete,
    onError,
    autoStart = true,
  } = options;

  // State
  const [status, setStatus] = useState<ProcessingStatus>('pending');
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<ProcessingStep[]>(DEFAULT_STEPS);
  const [isPolling, setIsPolling] = useState(false);

  // Refs
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const attemptCountRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);

  // Update callback refs when they change
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  /**
   * Stops polling
   */
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  /**
   * Updates step status based on current processing step
   */
  const updateSteps = useCallback((currentStepName: string, currentStatus: ProcessingStatus) => {
    setSteps((prevSteps) => {
      return prevSteps.map((step) => {
        if (step.name === currentStepName) {
          return {
            ...step,
            status: currentStatus === 'failed' ? 'failed' : 'processing',
          };
        }

        // Mark previous steps as completed
        const currentIndex = prevSteps.findIndex((s) => s.name === currentStepName);
        const stepIndex = prevSteps.findIndex((s) => s.name === step.name);

        if (stepIndex < currentIndex) {
          return { ...step, status: 'completed' as const };
        }

        return step;
      });
    });
  }, []);

  /**
   * Fetches processing status from backend
   */
  const fetchStatus = useCallback(async () => {
    if (!imageId) return;

    try {
      const response = await fetch(`/api/wardrobe/${imageId}/status`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const rawResponse = await response.json();
      
      // Handle ApiResponseHandler format { success, data, message }
      const data: ProcessingStatusResponse = rawResponse.data || rawResponse;

      // Update state
      setStatus(data.status);
      setProgress(data.progress ?? 0);

      if (data.currentStep) {
        setCurrentStep(data.currentStep);
        updateSteps(data.currentStep, data.status);
      }

      // Handle completion
      if (data.status === 'completed') {
        setProgress(100);
        
        // Animate through steps sequentially for better UX
        const animateSteps = async () => {
          const stepOrder = [
            'Upload',
            'Background removal',
            'Optimization',
            'Thumbnail generation',
            'Color extraction'
          ];
          
          for (let i = 0; i < stepOrder.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 150));
            setSteps((prevSteps) =>
              prevSteps.map((step) =>
                step.label === stepOrder[i]
                  ? { ...step, status: 'completed' as const }
                  : step
              )
            );
          }
          
          // Small delay before triggering completion callback
          await new Promise(resolve => setTimeout(resolve, 300));
          onCompleteRef.current?.(data);
        };
        
        animateSteps();
        stopPolling();
      }

      // Handle failure
      if (data.status === 'failed') {
        const errorMessage = data.error || 'Processing failed';
        setError(errorMessage);
        stopPolling();
        onErrorRef.current?.(errorMessage);
      }

      // Reset attempt count on success
      attemptCountRef.current = 0;
    } catch (err) {
      console.error('Error fetching processing status:', err);

      // Increment attempt count
      attemptCountRef.current += 1;

      // Stop polling after max attempts
      if (attemptCountRef.current >= maxAttempts) {
        const timeoutError = 'Processing status check timed out';
        setError(timeoutError);
        setStatus('failed');
        stopPolling();
        onErrorRef.current?.(timeoutError);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageId]); // Only imageId dependency - updateSteps and stopPolling are stable

  /**
   * Starts polling for status
   */
  const startPolling = useCallback(() => {
    if (!imageId || isPolling) return;

    setIsPolling(true);
    attemptCountRef.current = 0;

    // Initial fetch
    fetchStatus();

    // Set up polling interval
    pollIntervalRef.current = setInterval(() => {
      fetchStatus();
    }, pollInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageId, pollInterval]); // fetchStatus is stable with fixed deps

  /**
   * Auto-start polling when imageId changes
   */
  useEffect(() => {
    if (autoStart && imageId) {
      startPolling();
    }

    return () => {
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageId, autoStart]); // Only re-run when imageId or autoStart changes

  return {
    // State
    status,
    currentStep,
    progress,
    error,
    steps,

    // Actions
    startPolling,
    stopPolling,

    // Computed
    isPolling,
    isProcessing: status === 'processing' || status === 'pending',
    isCompleted: status === 'completed',
    isFailed: status === 'failed',
  };
}
