"use client";

/**
 * DragDropZone Component
 * Provides drag-and-drop interface for file upload with accessibility support
 */

import { useCallback, useRef, useState } from 'react';
import { Upload, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  validateFile,
  eventHasFiles,
  getFileFromDragEvent,
  FileValidationError,
} from '../utils/upload-utils';

export interface DragDropZoneProps {
  /**
   * Callback when valid file is selected
   */
  onFileSelect: (file: File) => void;

  /**
   * Callback when file validation fails
   */
  onValidationError?: (error: FileValidationError) => void;

  /**
   * Whether the zone is disabled
   */
  disabled?: boolean;

  /**
   * Custom className for styling
   */
  className?: string;

  /**
   * Show file type hints
   */
  showFileTypes?: boolean;

  /**
   * Custom accept attribute for file input
   */
  accept?: string;
}

/**
 * DragDropZone component for image upload
 */
export function DragDropZone({
  onFileSelect,
  onValidationError,
  disabled = false,
  className,
  showFileTypes = true,
  accept = 'image/jpeg,image/png,image/webp',
}: DragDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<FileValidationError | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  /**
   * Handles file selection
   */
  const handleFileSelection = useCallback(
    (file: File) => {
      // Clear previous error
      setValidationError(null);

      // Validate file
      const validation = validateFile(file);

      if (!validation.valid && validation.error) {
        setValidationError(validation.error);
        onValidationError?.(validation.error);
        return;
      }

      // Call success callback
      onFileSelect(file);
    },
    [onFileSelect, onValidationError]
  );

  /**
   * Handles file input change
   */
  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        handleFileSelection(files[0]);
      }

      // Reset input value to allow selecting the same file again
      event.target.value = '';
    },
    [handleFileSelection]
  );

  /**
   * Opens file picker dialog
   */
  const handleClick = useCallback(() => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  /**
   * Handles keyboard interaction
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleClick();
      }
    },
    [disabled, handleClick]
  );

  /**
   * Handles drag enter
   */
  const handleDragEnter = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (disabled) return;

      dragCounterRef.current += 1;

      if (eventHasFiles(event)) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  /**
   * Handles drag over
   */
  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (disabled) return;

      // Set correct drop effect
      if (eventHasFiles(event)) {
        event.dataTransfer.dropEffect = 'copy';
      }
    },
    [disabled]
  );

  /**
   * Handles drag leave
   */
  const handleDragLeave = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (disabled) return;

      dragCounterRef.current -= 1;

      if (dragCounterRef.current === 0) {
        setIsDragging(false);
      }
    },
    [disabled]
  );

  /**
   * Handles drop
   */
  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (disabled) return;

      setIsDragging(false);
      dragCounterRef.current = 0;

      const file = getFileFromDragEvent(event);
      if (file) {
        handleFileSelection(file);
      }
    },
    [disabled, handleFileSelection]
  );

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Upload image. Click to select or drag and drop"
      aria-disabled={disabled}
      className={cn(
        'relative flex flex-col items-center justify-center',
        'w-full min-h-[280px] p-8',
        'border-2 border-dashed rounded-lg',
        'transition-all duration-200 ease-in-out',
        'cursor-pointer',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        // Default state
        !isDragging && !validationError && !disabled && [
          'border-gray-300 bg-gray-50/50',
          'hover:border-gray-400 hover:bg-gray-100/50',
          'focus:ring-blue-500 focus:border-blue-400',
        ],
        // Dragging state
        isDragging && !disabled && [
          'border-blue-500 bg-blue-50',
          'scale-[1.02]',
        ],
        // Error state
        validationError && !disabled && [
          'border-red-300 bg-red-50/50',
          'focus:ring-red-500 focus:border-red-400',
        ],
        // Disabled state
        disabled && [
          'border-gray-200 bg-gray-100',
          'cursor-not-allowed opacity-60',
        ],
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        disabled={disabled}
        className="hidden"
        aria-hidden="true"
      />

      {/* Icon */}
      <div
        className={cn(
          'mb-4 p-4 rounded-full transition-colors duration-200',
          isDragging && !disabled && 'bg-blue-100',
          validationError && !disabled && 'bg-red-100',
          !isDragging && !validationError && !disabled && 'bg-gray-100'
        )}
      >
        {validationError ? (
          <AlertCircle className="w-12 h-12 text-red-500" aria-hidden="true" />
        ) : isDragging ? (
          <ImageIcon className="w-12 h-12 text-blue-600" aria-hidden="true" />
        ) : (
          <Upload className="w-12 h-12 text-gray-500" aria-hidden="true" />
        )}
      </div>

      {/* Text content */}
      <div className="text-center space-y-2">
        {validationError ? (
          <>
            <p className="text-base font-semibold text-red-700">
              {validationError.message}
            </p>
            <p className="text-sm text-red-600">{validationError.details}</p>
          </>
        ) : (
          <>
            <p className="text-base font-semibold text-gray-700">
              {isDragging ? 'Drop your image here' : 'Drag your image here'}
            </p>
            <p className="text-sm text-gray-500">
              or <span className="text-blue-600 font-medium">click to select</span>
            </p>
          </>
        )}

        {showFileTypes && !validationError && (
          <p className="text-xs text-gray-400 mt-3">
            Supported formats: JPEG, PNG, WebP (max 10MB)
          </p>
        )}
      </div>
    </div>
  );
}
