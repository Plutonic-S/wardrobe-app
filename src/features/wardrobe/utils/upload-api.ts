/**
 * API client utilities for wardrobe image uploads
 * Provides type-safe API calls with error handling
 */

/**
 * Upload response from backend
 */
export interface UploadResponse {
  success: boolean;
  imageId: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  message?: string;
}

/**
 * Processing status response
 */
export interface ProcessingStatusResponse {
  imageId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  currentStep?: string;
  progress?: number;
  error?: string;
  completedAt?: string;
}

/**
 * Metadata submission data
 */
export interface MetadataSubmission {
  name: string;
  category: string;
  tags?: string[];
  subcategory?: string;
  season?: string[];
  styleType?: string;
  brand?: string;
  purchaseDate?: Date | string;
  price?: number;
}

/**
 * API error response
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  message?: string;
  code?: string;
  statusCode?: number;
}

/**
 * Custom API error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public details?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Upload options for XMLHttpRequest-based upload with progress
 */
export interface UploadWithProgressOptions {
  /**
   * Callback for progress updates (0-100)
   */
  onProgress?: (progress: number) => void;

  /**
   * Abort signal for cancellation
   */
  signal?: AbortSignal;

  /**
   * Upload timeout in milliseconds
   */
  timeout?: number;
}

/**
 * Uploads an image file with real-time progress tracking using XMLHttpRequest
 * @param file - File to upload
 * @param endpoint - Upload endpoint (default: /api/wardrobe/upload)
 * @param options - Upload options including progress callback
 * @returns Promise with upload response
 */
export async function uploadImageWithProgress(
  file: File,
  endpoint: string = '/api/wardrobe/upload',
  options: UploadWithProgressOptions = {}
): Promise<UploadResponse> {
  const { onProgress, signal, timeout = 30000 } = options;

  return new Promise<UploadResponse>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Handle abort signal
    if (signal) {
      signal.addEventListener('abort', () => {
        xhr.abort();
        reject(new ApiError('Upload cancelled', undefined, 'ABORTED'));
      });
    }

    // Set timeout
    xhr.timeout = timeout;

    // Upload progress event
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress?.(progress);
      }
    });

    // Load event (successful response)
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const rawResponse = JSON.parse(xhr.responseText);
          
          // Handle ApiResponseHandler format { success, data, message }
          let response: UploadResponse;
          if (rawResponse.data && typeof rawResponse.data === 'object') {
            // Response is wrapped in data field
            response = {
              success: rawResponse.success ?? true,
              imageId: rawResponse.data.imageId,
              processingStatus: rawResponse.data.processingStatus,
              message: rawResponse.data.message || rawResponse.message,
            };
          } else {
            // Direct response (backward compatibility)
            response = rawResponse;
          }
          
          resolve(response);
        } catch {
          reject(
            new ApiError(
              'Invalid response format',
              xhr.status,
              'INVALID_RESPONSE',
              'Failed to parse server response'
            )
          );
        }
      } else {
        try {
          const errorData: ApiErrorResponse = JSON.parse(xhr.responseText);
          reject(
            new ApiError(
              errorData.error || 'Upload failed',
              xhr.status,
              errorData.code || `HTTP_${xhr.status}`,
              errorData.message
            )
          );
        } catch {
          reject(
            new ApiError(
              'Upload failed',
              xhr.status,
              `HTTP_${xhr.status}`,
              xhr.statusText
            )
          );
        }
      }
    });

    // Error event
    xhr.addEventListener('error', () => {
      reject(
        new ApiError(
          'Network error',
          undefined,
          'NETWORK_ERROR',
          'Failed to connect to server. Please check your connection.'
        )
      );
    });

    // Timeout event
    xhr.addEventListener('timeout', () => {
      reject(
        new ApiError(
          'Upload timeout',
          undefined,
          'TIMEOUT',
          `Upload took longer than ${timeout / 1000} seconds and was cancelled.`
        )
      );
    });

    // Abort event
    xhr.addEventListener('abort', () => {
      reject(
        new ApiError('Upload cancelled', undefined, 'ABORTED', 'Upload was cancelled by user.')
      );
    });

    // Prepare form data
    const formData = new FormData();
    formData.append('file', file);

    // Open and send request
    xhr.open('POST', endpoint);
    xhr.withCredentials = true; // Include cookies for authentication
    xhr.send(formData);
  });
}

/**
 * Fetches processing status for an image
 * @param imageId - Image ID to check status for
 * @returns Promise with processing status response
 */
export async function fetchProcessingStatus(
  imageId: string
): Promise<ProcessingStatusResponse> {
  try {
    const response = await fetch(`/api/wardrobe/${imageId}/status`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData: ApiErrorResponse = await response.json().catch(() => ({
        success: false,
        error: 'Failed to fetch status',
      }));

      throw new ApiError(
        errorData.error || 'Failed to fetch status',
        response.status,
        errorData.code || `HTTP_${response.status}`,
        errorData.message
      );
    }

    const data: ProcessingStatusResponse = await response.json();
    return data;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }

    throw new ApiError(
      'Network error',
      undefined,
      'NETWORK_ERROR',
      'Failed to connect to server. Please check your connection.'
    );
  }
}

/**
 * Submits metadata for an uploaded image
 * @param imageId - Image ID to attach metadata to
 * @param metadata - Metadata to submit
 * @returns Promise with success status
 */
export async function submitMetadata(
  imageId: string,
  metadata: MetadataSubmission
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`/api/wardrobe/${imageId}/metadata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData: ApiErrorResponse = await response.json().catch(() => ({
        success: false,
        error: 'Failed to save metadata',
      }));

      throw new ApiError(
        errorData.error || 'Failed to save metadata',
        response.status,
        errorData.code || `HTTP_${response.status}`,
        errorData.message
      );
    }

    const data = await response.json();
    return data;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }

    throw new ApiError(
      'Network error',
      undefined,
      'NETWORK_ERROR',
      'Failed to connect to server. Please check your connection.'
    );
  }
}

/**
 * Deletes an uploaded image
 * @param imageId - Image ID to delete
 * @returns Promise with success status
 */
export async function deleteImage(imageId: string): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`/api/wardrobe/${imageId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData: ApiErrorResponse = await response.json().catch(() => ({
        success: false,
        error: 'Failed to delete image',
      }));

      throw new ApiError(
        errorData.error || 'Failed to delete image',
        response.status,
        errorData.code || `HTTP_${response.status}`,
        errorData.message
      );
    }

    const data = await response.json();
    return data;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }

    throw new ApiError(
      'Network error',
      undefined,
      'NETWORK_ERROR',
      'Failed to connect to server. Please check your connection.'
    );
  }
}
