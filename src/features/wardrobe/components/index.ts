/**
 * Wardrobe Components
 *
 * Comprehensive component system for displaying and managing wardrobe items.
 *
 * @module wardrobe/components
 */

// Main Components
export { WardrobeGrid } from "./WardrobeGrid";
export type { WardrobeGridProps } from "./WardrobeGrid";

export { WardrobeGridSkeleton } from "./WardrobeGridSkeleton";
export type { WardrobeGridSkeletonProps } from "./WardrobeGridSkeleton";

export { WardrobeGridEmpty } from "./WardrobeGridEmpty";
export type { WardrobeGridEmptyProps } from "./WardrobeGridEmpty";

export { WardrobeItemCard } from "./WardrobeItemCard";

export { WardrobeSidebar } from "./WardrobeSidebar";

// Image Upload Components
export { ImageUploadModal } from './ImageUploadModal';
export type { ImageUploadModalProps } from './ImageUploadModal';

export { DragDropZone } from './DragDropZone';
export type { DragDropZoneProps } from './DragDropZone';

export { UploadProgress } from './UploadProgress';
export type { UploadProgressProps } from './UploadProgress';

export { ProcessingStatus } from './ProcessingStatus';
export type { ProcessingStatusProps } from './ProcessingStatus';

export { MetadataForm } from './MetadataForm';
export type { MetadataFormProps, MetadataFormData } from './MetadataForm';

export { FilePreview } from './FilePreview';
export type { FilePreviewProps } from './FilePreview';

export { SuccessState } from './SuccessState';
export type { SuccessStateProps } from './SuccessState';

export { ErrorState } from './ErrorState';
export type { ErrorStateProps, ErrorSeverity } from './ErrorState';
