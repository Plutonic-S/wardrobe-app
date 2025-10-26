/**
 * Wardrobe Hooks
 *
 * Custom React hooks for managing wardrobe data and state.
 *
 * @module wardrobe/hooks
 */

export {
  useWardrobeData,
  useDebouncedValue,
  useFavorites,
  useOptimisticUpdates,
} from "./useWardrobeData";

export type {
  UseWardrobeDataConfig,
  UseWardrobeDataReturn,
  WardrobeSortOption,
} from "./useWardrobeData";

// Image Upload Hooks
export { useImageUpload } from './useImageUpload';
export type {
  UseImageUploadReturn,
  UseImageUploadOptions,
  UploadState,
  UploadResponse,
  UploadError,
} from './useImageUpload';

export { useProcessingStatus } from './useProcessingStatus';
export type {
  UseProcessingStatusReturn,
  UseProcessingStatusOptions,
  ProcessingStep,
  ProcessingStatusResponse,
} from './useProcessingStatus';

export { useFileValidation } from './useFileValidation';
export type {
  UseFileValidationReturn,
  UseFileValidationOptions,
} from './useFileValidation';

export { useSidebarState } from './useSidebarState';
export type { SidebarState } from './useSidebarState';
