/**
 * Custom hook for file validation with reactive state management
 */

import { useState, useCallback } from 'react';
import {
  validateFile,
  FileValidationError,
  FileValidationResult,
} from '../utils/upload-utils';

/**
 * Hook return type
 */
export interface UseFileValidationReturn {
  /**
   * Validation error (null if valid)
   */
  validationError: FileValidationError | null;

  /**
   * Whether the current file is valid
   */
  isValid: boolean;

  /**
   * Validates a file and updates state
   */
  validate: (file: File | null | undefined) => FileValidationResult;

  /**
   * Clears validation error
   */
  clearError: () => void;

  /**
   * Resets validation state
   */
  reset: () => void;
}

/**
 * Hook options
 */
export interface UseFileValidationOptions {
  /**
   * Callback when validation succeeds
   */
  onValid?: (file: File) => void;

  /**
   * Callback when validation fails
   */
  onInvalid?: (error: FileValidationError) => void;

  /**
   * Auto-clear error after a delay (in milliseconds)
   */
  autoClearErrorDelay?: number;
}

/**
 * Custom hook for file validation
 */
export function useFileValidation(
  options: UseFileValidationOptions = {}
): UseFileValidationReturn {
  const { onValid, onInvalid, autoClearErrorDelay } = options;

  const [validationError, setValidationError] = useState<FileValidationError | null>(null);

  /**
   * Validates a file
   */
  const validate = useCallback(
    (file: File | null | undefined): FileValidationResult => {
      // Clear previous error
      setValidationError(null);

      // Perform validation
      const result = validateFile(file);

      // Handle validation result
      if (result.valid && result.file) {
        onValid?.(result.file);
      } else if (result.error) {
        setValidationError(result.error);
        onInvalid?.(result.error);

        // Auto-clear error after delay if specified
        if (autoClearErrorDelay && autoClearErrorDelay > 0) {
          setTimeout(() => {
            setValidationError(null);
          }, autoClearErrorDelay);
        }
      }

      return result;
    },
    [onValid, onInvalid, autoClearErrorDelay]
  );

  /**
   * Clears validation error
   */
  const clearError = useCallback(() => {
    setValidationError(null);
  }, []);

  /**
   * Resets validation state
   */
  const reset = useCallback(() => {
    setValidationError(null);
  }, []);

  return {
    validationError,
    isValid: validationError === null,
    validate,
    clearError,
    reset,
  };
}
