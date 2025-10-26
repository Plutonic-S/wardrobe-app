/**
 * File upload validation utilities
 * Provides comprehensive validation for image uploads with accessibility-friendly error messages
 */

/**
 * Allowed file types for image uploads
 */
export const ALLOWED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
} as const;

/**
 * Maximum file size in bytes (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * File validation error types
 */
export type FileValidationErrorType =
  | 'invalid-type'
  | 'file-too-large'
  | 'file-too-small'
  | 'no-file'
  | 'corrupted';

/**
 * File validation error
 */
export interface FileValidationError {
  type: FileValidationErrorType;
  message: string;
  details?: string;
}

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean;
  error?: FileValidationError;
  file?: File;
}

/**
 * Validates a file for upload
 * @param file - File to validate
 * @returns Validation result with error details if invalid
 */
export function validateFile(file: File | null | undefined): FileValidationResult {
  // Check if file exists
  if (!file) {
    return {
      valid: false,
      error: {
        type: 'no-file',
        message: 'No file selected',
        details: 'Please select an image file to upload',
      },
    };
  }

  // Check file type
  const allowedTypes = Object.keys(ALLOWED_FILE_TYPES);
  if (!allowedTypes.includes(file.type)) {
    const allowedExtensions = Object.values(ALLOWED_FILE_TYPES).flat().join(', ');
    return {
      valid: false,
      error: {
        type: 'invalid-type',
        message: 'Invalid file type',
        details: `Please upload an image file. Allowed formats: ${allowedExtensions}`,
      },
    };
  }

  // Check file size (minimum 1KB to avoid corrupted files)
  if (file.size < 1024) {
    return {
      valid: false,
      error: {
        type: 'file-too-small',
        message: 'File too small',
        details: 'The file appears to be corrupted or empty. Please select a valid image.',
      },
    };
  }

  // Check maximum file size
  if (file.size > MAX_FILE_SIZE) {
    const maxSizeMB = Math.floor(MAX_FILE_SIZE / (1024 * 1024));
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: {
        type: 'file-too-large',
        message: 'File too large',
        details: `File size (${fileSizeMB}MB) exceeds maximum allowed size of ${maxSizeMB}MB`,
      },
    };
  }

  return {
    valid: true,
    file,
  };
}

/**
 * Formats file size in human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Creates a preview URL for an image file
 * @param file - Image file
 * @returns Object URL for preview or null if invalid
 */
export function createImagePreview(file: File): string | null {
  try {
    const validation = validateFile(file);
    if (!validation.valid) return null;

    return URL.createObjectURL(file);
  } catch (error) {
    console.error('Error creating image preview:', error);
    return null;
  }
}

/**
 * Revokes an object URL to free memory
 * @param url - Object URL to revoke
 */
export function revokeImagePreview(url: string | null): void {
  if (url) {
    try {
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error revoking object URL:', error);
    }
  }
}

/**
 * Gets file extension from filename
 * @param filename - Name of the file
 * @returns File extension including the dot, or empty string if no extension
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? '' : filename.substring(lastDot);
}

/**
 * Checks if drag event contains files
 * @param event - Drag event
 * @returns True if event contains files
 */
export function eventHasFiles(event: React.DragEvent<HTMLElement>): boolean {
  return event.dataTransfer?.types?.includes('Files') ?? false;
}

/**
 * Extracts file from drag event
 * @param event - Drag event
 * @returns First file from event or null
 */
export function getFileFromDragEvent(event: React.DragEvent<HTMLElement>): File | null {
  const files = event.dataTransfer?.files;
  return files && files.length > 0 ? files[0] : null;
}

/**
 * Validates if string is a valid data URL or blob URL
 * @param url - URL to validate
 * @returns True if valid preview URL
 */
export function isValidPreviewUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith('data:') || url.startsWith('blob:');
}
