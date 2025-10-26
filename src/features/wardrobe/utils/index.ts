/**
 * Wardrobe Utilities
 *
 * Utility functions for filtering, sorting, and managing wardrobe data.
 *
 * @module wardrobe/utils
 */

export {
  filterWardrobeItems,
  sortWardrobeItems,
  groupWardrobeItems,
  getUniqueValues,
  getAllTags,
  fuzzySearchWardrobeItems,
  calculateFilterStats,
  hasActiveFilters,
  clearAllFilters,
  mergeFilters,
} from "./filter-utils";

// Upload utilities
export {
  validateFile,
  formatFileSize,
  createImagePreview,
  revokeImagePreview,
  getFileExtension,
  eventHasFiles,
  getFileFromDragEvent,
  isValidPreviewUrl,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
} from './upload-utils';

export type {
  FileValidationError,
  FileValidationResult,
  FileValidationErrorType,
} from './upload-utils';

// Upload API
export {
  uploadImageWithProgress,
  fetchProcessingStatus,
  submitMetadata,
  deleteImage,
  ApiError,
} from './upload-api';

export type {
  UploadResponse,
  ProcessingStatusResponse,
  MetadataSubmission,
  ApiErrorResponse,
  UploadWithProgressOptions,
} from './upload-api';
