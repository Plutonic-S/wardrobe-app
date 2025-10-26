/**
 * Custom hook for handling image uploads with real-time progress tracking using XMLHttpRequest
 */

import { useState, useCallback, useRef } from 'react';
import { validateFile, FileValidationError } from '../utils/upload-utils';
import { uploadImageWithProgress, ApiError, UploadResponse } from '../utils/upload-api';

/**
 * Upload state type
 */
export type UploadState = 'idle' | 'uploading' | 'success' | 'error';

/**
 * Upload error
 */
export interface UploadError {
  message: string;
  details?: string;
  code?: string;
}

/**
 * Hook return type
 */
export interface UseImageUploadReturn {
  // State
  uploadState: UploadState;
  uploadProgress: number;
  uploadError: UploadError | FileValidationError | null;
  uploadedImageId: string | null;

  // Actions
  uploadImage: (file: File) => Promise<UploadResponse | null>;
  resetUpload: () => void;
  cancelUpload: () => void;

  // Computed
  isUploading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isIdle: boolean;
}

/**
 * Upload configuration options
 */
export interface UseImageUploadOptions {
  /**
   * API endpoint for upload (default: /api/wardrobe/upload)
   */
  endpoint?: string;

  /**
   * Upload timeout in milliseconds (default: 30000)
   */
  timeout?: number;

  /**
   * Callback when upload succeeds
   */
  onSuccess?: (response: UploadResponse) => void;

  /**
   * Callback when upload fails
   */
  onError?: (error: UploadError | FileValidationError) => void;

  /**
   * Callback for progress updates (0-100)
   */
  onProgress?: (progress: number) => void;
}

/**
 * Custom hook for image upload with real-time progress tracking
 * Uses XMLHttpRequest for accurate upload progress monitoring
 */
export function useImageUpload(options: UseImageUploadOptions = {}): UseImageUploadReturn {
  const {
    endpoint = '/api/wardrobe/upload',
    timeout = 30000,
    onSuccess,
    onError,
    onProgress,
  } = options;

  // State
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<UploadError | FileValidationError | null>(null);
  const [uploadedImageId, setUploadedImageId] = useState<string | null>(null);

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Updates upload progress with callback
   */
  const updateProgress = useCallback(
    (progress: number) => {
      setUploadProgress(progress);
      onProgress?.(progress);
    },
    [onProgress]
  );

  /**
   * Resets upload state
   */
  const resetUpload = useCallback(() => {
    // Abort any ongoing upload
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setUploadState('idle');
    setUploadProgress(0);
    setUploadError(null);
    setUploadedImageId(null);
  }, []);

  /**
   * Cancels ongoing upload
   */
  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setUploadState('idle');
    setUploadProgress(0);
    setUploadError({
      message: 'Upload cancelled',
      details: 'The upload was cancelled by the user',
      code: 'CANCELLED',
    });
  }, []);

  /**
   * Uploads image file to backend with real-time progress tracking
   */
  const uploadImage = useCallback(
    async (file: File): Promise<UploadResponse | null> => {
      // Reset previous state
      setUploadError(null);
      setUploadedImageId(null);

      // Validate file
      const validation = validateFile(file);
      if (!validation.valid && validation.error) {
        setUploadState('error');
        setUploadError(validation.error);
        onError?.(validation.error);
        return null;
      }

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      // Set uploading state
      setUploadState('uploading');
      updateProgress(0);

      try {
        // Upload with real-time progress tracking using XMLHttpRequest
        const response = await uploadImageWithProgress(file, endpoint, {
          onProgress: updateProgress,
          signal: abortControllerRef.current.signal,
          timeout,
        });

        // Set success state
        setUploadState('success');
        setUploadProgress(100);
        setUploadedImageId(response.imageId);
        onSuccess?.(response);

        return response;
      } catch (error) {
        // Handle API errors
        if (error instanceof ApiError) {
          const uploadError: UploadError = {
            message: error.message,
            details: error.details,
            code: error.code,
          };

          setUploadState('error');
          setUploadError(uploadError);
          onError?.(uploadError);
          return null;
        }

        // Handle generic errors
        const genericError: UploadError = {
          message: 'Upload failed',
          details: error instanceof Error ? error.message : 'An unexpected error occurred during upload',
          code: 'UNKNOWN_ERROR',
        };

        setUploadState('error');
        setUploadError(genericError);
        onError?.(genericError);
        return null;
      }
    },
    [endpoint, timeout, updateProgress, onSuccess, onError]
  );

  return {
    // State
    uploadState,
    uploadProgress,
    uploadError,
    uploadedImageId,

    // Actions
    uploadImage,
    resetUpload,
    cancelUpload,

    // Computed
    isUploading: uploadState === 'uploading',
    isSuccess: uploadState === 'success',
    isError: uploadState === 'error',
    isIdle: uploadState === 'idle',
  };
}

// Re-export types for convenience
export type { UploadResponse };
