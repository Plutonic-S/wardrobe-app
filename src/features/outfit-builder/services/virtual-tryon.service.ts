// src/features/outfit-builder/services/virtual-tryon.service.ts

import type {
  GarmentType,
  VirtualTryOnStatus,
  VirtualTryOnMode,
  MiragicCreateJobResponse,
  MiragicJobStatusResponse,
  VirtualTryOnResult,
  VirtualTryOnOptions,
  PollJobOptions,
  VirtualTryOnError,
} from '../types/virtual-tryon.types';
import { VirtualTryOnException } from '../types/virtual-tryon.types';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { OutfitResponse, DressMeConfiguration } from '../types/outfit.types';

// ============================================================================
// CONSTANTS
// ============================================================================

const MIRAGIC_API_BASE = 'https://backend.miragic.ai/api/v1';
const MIRAGIC_API_KEY = process.env.MIRAGIC_API_KEY || '';

const DEFAULT_MANNEQUIN_URL = '/human-model.png'; // Default human model image
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const POLL_INTERVAL = 3000; // 3 seconds
const MAX_POLL_ATTEMPTS = 40; // 2 minutes total (40 * 3 seconds)

// ============================================================================
// GARMENT TYPE DETECTION
// ============================================================================

/**
 * Auto-detect garment type from outfit configuration
 * Since we use the outfit preview image (combined view), we treat combo outfits as full_body
 */
export function detectGarmentType(outfit: OutfitResponse): GarmentType {
  if (outfit.mode === 'dress-me' && outfit.combination) {
    const { items, configuration } = outfit.combination;

    // Check for dresses (full body)
    if (items.tops && configuration === '2-part') {
      // In 2-part, "tops" slot might contain a dress
      return 'full_body';
    }

    // Check for combo (upper + lower)
    // Since we're using the outfit preview (combined image), treat as full_body
    if (items.tops && items.bottoms) {
      return 'full_body';  // Changed from 'combo' to 'full_body'
    }

    // Check for individual items
    if (items.tops || items.outerwear) {
      return 'upper_body';
    }

    if (items.bottoms) {
      return 'lower_body';
    }
  }

  // Canvas mode: analyze items if populated
  if (outfit.mode === 'canvas' && outfit.canvasState) {
    // For canvas, default to full_body since items are arranged freely
    return 'full_body';
  }

  // Default fallback
  return 'full_body';
}

// ============================================================================
// IMAGE FETCHING
// ============================================================================

/**
 * Fetch image as Blob from URL with CORS support
 */
async function fetchImageAsBlob(url: string): Promise<Blob> {
  console.log('[VTO Service] Fetching image:', url);

  // Convert relative URLs to absolute
  const absoluteUrl = url.startsWith('http')
    ? url
    : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${url}`;

  console.log('[VTO Service] Absolute URL:', absoluteUrl);

  const response = await fetch(absoluteUrl);

  if (!response.ok) {
    console.error('[VTO Service] Failed to fetch image:', response.status, response.statusText);
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  const blob = await response.blob();
  console.log('[VTO Service] Image fetched successfully, size:', blob.size, 'bytes, type:', blob.type);
  return blob;
}

// ============================================================================
// MIRAGIC API INTERACTIONS
// ============================================================================

/**
 * Start virtual try-on job with Miragic API
 */
async function startMiragicJob(
  clothImageUrl: string,
  humanImageUrl: string,
  garmentType: GarmentType,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  bottomClothImageUrl?: string
): Promise<MiragicCreateJobResponse> {
  console.log('[VTO Service] Starting Miragic job...');
  console.log('[VTO Service] Cloth image:', clothImageUrl);
  console.log('[VTO Service] Human image:', humanImageUrl);
  console.log('[VTO Service] Garment type:', garmentType);

  if (!MIRAGIC_API_KEY) {
    console.error('[VTO Service] API key is missing!');
    throw new Error('MIRAGIC_API_KEY is not configured');
  }
  console.log('[VTO Service] API key present:', MIRAGIC_API_KEY.substring(0, 10) + '...');

  // Fetch images as blobs
  console.log('[VTO Service] Fetching cloth image...');
  const clothImageBlob = await fetchImageAsBlob(clothImageUrl);

  console.log('[VTO Service] Fetching human image...');
  const humanImageBlob = await fetchImageAsBlob(humanImageUrl);

  // Build form data
  console.log('[VTO Service] Building FormData...');
  const formData = new FormData();
  formData.append('humanImage', humanImageBlob, 'human.jpg');
  formData.append('clothImage', clothImageBlob, 'cloth.jpg');
  formData.append('garmentType', garmentType);

  // Call Miragic API
  console.log('[VTO Service] Calling Miragic API at:', `${MIRAGIC_API_BASE}/virtual-try-on`);
  const response = await fetch(`${MIRAGIC_API_BASE}/virtual-try-on`, {
    method: 'POST',
    headers: {
      'X-API-Key': MIRAGIC_API_KEY,
    },
    body: formData,
  });

  console.log('[VTO Service] Miragic API response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[VTO Service] Miragic API error:', response.status, errorText);
    
    // Parse error response to check for specific error codes
    try {
      const errorData = JSON.parse(errorText);
      
      // Handle insufficient credits error
      if (response.status === 402 || errorData?.error?.code === 'INSUFFICIENT_CREDITS') {
        throw new VirtualTryOnException(
          'RATE_LIMIT' as VirtualTryOnError,
          'Insufficient credits for virtual try-on. Please add more credits to your Miragic account.',
          errorData
        );
      }
    } catch (parseError) {
      // If JSON parsing fails, continue with generic error
      if (parseError instanceof VirtualTryOnException) {
        throw parseError; // Re-throw our custom exception
      }
    }
    
    throw new Error(`Miragic API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('[VTO Service] Miragic API response:', result);
  return result;
}

/**
 * Check Miragic job status
 */
async function checkMiragicJobStatus(
  jobId: string
): Promise<MiragicJobStatusResponse> {
  if (!MIRAGIC_API_KEY) {
    throw new Error('MIRAGIC_API_KEY is not configured');
  }

  const response = await fetch(`${MIRAGIC_API_BASE}/virtual-try-on/${jobId}`, {
    method: 'GET',
    headers: {
      'X-API-Key': MIRAGIC_API_KEY,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Miragic API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// ============================================================================
// MAIN SERVICE FUNCTIONS
// ============================================================================

/**
 * Start virtual try-on for an outfit
 */
export async function startVirtualTryOn(
  outfit: OutfitResponse,
  options: VirtualTryOnOptions = {}
): Promise<{ jobId: string; status: VirtualTryOnStatus; mode: VirtualTryOnMode }> {
  console.log('[VTO Service] startVirtualTryOn called');
  console.log('[VTO Service] Outfit ID:', outfit.id);

  const {
    humanImageUrl = DEFAULT_MANNEQUIN_URL,
    garmentType = detectGarmentType(outfit),
    maxRetries = MAX_RETRIES,
    retryDelay = RETRY_DELAY,
  } = options;

  console.log('[VTO Service] Options:', { humanImageUrl, garmentType, maxRetries, retryDelay });

  // Validate outfit has preview image
  if (!outfit.previewImage?.url) {
    console.error('[VTO Service] No preview image on outfit');
    throw new VirtualTryOnException(
      'MISSING_PREVIEW_IMAGE' as VirtualTryOnError,
      'Outfit must have a preview image. Please save the outfit first.'
    );
  }

  // Use outfit preview for all try-on types (better quality than individual items)
  const clothImageUrl = outfit.previewImage.url;
  console.log('[VTO Service] Using outfit preview for try-on:', clothImageUrl);

  let lastError: Error | null = null;

  // Retry logic
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[VTO Service] Attempt ${attempt} of ${maxRetries}`);
    try {
      const result = await startMiragicJob(
        clothImageUrl,
        humanImageUrl,
        garmentType
      );

      if (!result.success) {
        console.error('[VTO Service] Miragic returned success=false:', result.message);
        throw new Error(result.message || 'Failed to start virtual try-on');
      }

      console.log('[VTO Service] Virtual try-on started successfully!');
      return {
        jobId: result.data.jobId,
        status: result.data.status,
        mode: result.data.mode,
      };
    } catch (error) {
      lastError = error as Error;
      console.error(`[VTO Service] Attempt ${attempt} failed:`, error);
      console.error(`[VTO Service] Error details:`, (error as Error).message);

      // Don't retry on specific errors that won't be fixed by retrying
      if (error instanceof VirtualTryOnException) {
        const errorCode = (error as VirtualTryOnException).code;
        if (errorCode === 'RATE_LIMIT' || errorCode === 'MISSING_PREVIEW_IMAGE') {
          console.error('[VTO Service] Non-retryable error encountered, stopping retries');
          throw error; // Re-throw immediately, don't retry
        }
      }

      if (attempt < maxRetries) {
        const waitTime = retryDelay * attempt;
        console.log(`[VTO Service] Retrying in ${waitTime}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  console.error('[VTO Service] All attempts failed');
  throw new VirtualTryOnException(
    'API_ERROR' as VirtualTryOnError,
    `Failed to start virtual try-on after ${maxRetries} attempts: ${lastError?.message}`,
    lastError
  );
}

/**
 * Check virtual try-on job status
 */
export async function checkJobStatus(jobId: string): Promise<VirtualTryOnResult> {
  try {
    const result = await checkMiragicJobStatus(jobId);

    if (!result.success) {
      throw new Error('Failed to check job status');
    }

    const { data } = result;

    return {
      jobId: data.id,
      status: data.status,
      mode: data.mode,
      resultUrl: data.processedUrl || undefined,
      errorMessage: data.errorMessage || undefined,
      completedAt: data.processingCompletedAt
        ? new Date(data.processingCompletedAt)
        : undefined,
    };
  } catch (error) {
    throw new VirtualTryOnException(
      'API_ERROR' as VirtualTryOnError,
      `Failed to check job status: ${(error as Error).message}`,
      error
    );
  }
}

/**
 * Poll job status until completion or failure
 */
export async function pollJobUntilComplete(
  jobId: string,
  options: PollJobOptions = {}
): Promise<VirtualTryOnResult> {
  const {
    maxAttempts = MAX_POLL_ATTEMPTS,
    pollInterval = POLL_INTERVAL,
    onProgress,
  } = options;

  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;

    try {
      const result = await checkJobStatus(jobId);

      // Calculate approximate progress based on status
      let progress = 0;
      if (result.status === 'PENDING') {
        progress = Math.min(90, (attempts / maxAttempts) * 100);
      } else if (result.status === 'COMPLETED') {
        progress = 100;
      }

      onProgress?.(result.status, progress);

      // Job completed successfully
      if (result.status === 'COMPLETED' && result.resultUrl) {
        return result;
      }

      // Job failed
      if (result.status === 'FAILED') {
        throw new VirtualTryOnException(
          'API_ERROR' as VirtualTryOnError,
          result.errorMessage || 'Virtual try-on job failed',
          result
        );
      }

      // Still pending, wait and retry
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    } catch (error) {
      if (error instanceof VirtualTryOnException) {
        throw error;
      }

      console.error(`Poll attempt ${attempts} failed:`, error);

      // If we've exhausted attempts, throw timeout error
      if (attempts >= maxAttempts) {
        throw new VirtualTryOnException(
          'TIMEOUT' as VirtualTryOnError,
          'Virtual try-on job timed out',
          error
        );
      }

      // Otherwise, continue polling
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  throw new VirtualTryOnException(
    'TIMEOUT' as VirtualTryOnError,
    `Virtual try-on job timed out after ${maxAttempts} attempts`
  );
}

/**
 * Complete virtual try-on flow: start job and wait for completion
 */
export async function generateVirtualTryOn(
  outfit: OutfitResponse,
  options: VirtualTryOnOptions & PollJobOptions = {}
): Promise<VirtualTryOnResult> {
  // Start the job
  const { jobId } = await startVirtualTryOn(outfit, options);

  // Poll until complete
  const result = await pollJobUntilComplete(jobId, options);

  return result;
}

// ============================================================================
// EXPORTS
// ============================================================================

const virtualTryOnService = {
  startVirtualTryOn,
  checkJobStatus,
  pollJobUntilComplete,
  generateVirtualTryOn,
  detectGarmentType,
};

export default virtualTryOnService;
