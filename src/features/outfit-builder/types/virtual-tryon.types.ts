// src/features/outfit-builder/types/virtual-tryon.types.ts

// ============================================================================
// MIRAGIC API TYPES
// ============================================================================

/**
 * Garment type for virtual try-on
 */
export type GarmentType = 'upper_body' | 'lower_body' | 'full_body' | 'combo';

/**
 * Virtual try-on job status (from Miragic API)
 */
export type VirtualTryOnStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

/**
 * Virtual try-on mode (single item or combo)
 */
export type VirtualTryOnMode = 'SINGLE' | 'TOP_BOTTOM';

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Request to start virtual try-on (to our API)
 */
export interface StartVirtualTryOnRequest {
  outfitId: string;
  humanImageUrl?: string; // Optional: use default mannequin if not provided
  garmentType?: GarmentType; // Auto-detected if not provided
}

/**
 * Response from Miragic API when creating a job
 */
export interface MiragicCreateJobResponse {
  success: boolean;
  message: string;
  data: {
    jobId: string;
    status: VirtualTryOnStatus;
    mode: VirtualTryOnMode;
    createdAt: string;
  };
}

/**
 * Response from Miragic API when checking job status
 */
export interface MiragicJobStatusResponse {
  success: boolean;
  data: {
    id: string;
    status: VirtualTryOnStatus;
    mode: VirtualTryOnMode;
    humanImagePath: string;
    clothImagePath: string;
    bottomClothImagePath: string | null;
    resultImagePath: string | null;
    processedUrl: string | null;
    createdAt: string;
    processingStartedAt: string | null;
    processingCompletedAt: string | null;
    errorMessage: string | null;
  };
}

// ============================================================================
// DATABASE TYPES
// ============================================================================

/**
 * Virtual try-on data stored in Outfit document
 */
export interface VirtualTryOnData {
  jobId: string;
  status: VirtualTryOnStatus;
  mode: VirtualTryOnMode;
  resultUrl?: string;
  humanImageUrl: string;
  garmentType: GarmentType;
  createdAt: Date;
  processingStartedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
}

// ============================================================================
// SERVICE OPTIONS
// ============================================================================

/**
 * Options for starting virtual try-on
 */
export interface VirtualTryOnOptions {
  humanImageUrl?: string;
  garmentType?: GarmentType;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Options for polling job status
 */
export interface PollJobOptions {
  maxAttempts?: number;
  pollInterval?: number; // milliseconds
  onProgress?: (status: VirtualTryOnStatus, progress: number) => void;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Virtual try-on generation result
 */
export interface VirtualTryOnResult {
  jobId: string;
  status: VirtualTryOnStatus;
  mode: VirtualTryOnMode;
  resultUrl?: string;
  errorMessage?: string;
  completedAt?: Date;
}

/**
 * Error types
 */
export enum VirtualTryOnError {
  MISSING_PREVIEW_IMAGE = 'MISSING_PREVIEW_IMAGE',
  API_ERROR = 'API_ERROR',
  TIMEOUT = 'TIMEOUT',
  INVALID_OUTFIT = 'INVALID_OUTFIT',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Virtual try-on error class
 */
export class VirtualTryOnException extends Error {
  constructor(
    public code: VirtualTryOnError,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'VirtualTryOnException';
  }
}
