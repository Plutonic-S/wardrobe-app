"use client";

/**
 * ImageUploadModal Component
 * Comprehensive modal for uploading clothing items with drag-and-drop,
 * progress tracking, and real-time processing status
 */

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Upload, Eye } from 'lucide-react';

// Import sub-components
import { DragDropZone } from './DragDropZone';
import { UploadProgress } from './UploadProgress';
import { ProcessingStatus } from './ProcessingStatus';
import { MetadataForm, MetadataFormData } from './MetadataForm';

// Import hooks
import { useImageUpload } from '../hooks/useImageUpload';
import { useProcessingStatus } from '../hooks/useProcessingStatus';

// Import utilities
import {
  createImagePreview,
  revokeImagePreview,
  FileValidationError,
} from '../utils/upload-utils';

/**
 * Modal workflow states
 */
type ModalStep = 'select' | 'upload' | 'metadata' | 'processing' | 'success';

export interface ImageUploadModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;

  /**
   * Callback when modal is closed
   */
  onClose: () => void;

  /**
   * Callback when item is successfully added
   */
  onSuccess?: (itemId: string, metadata?: MetadataFormData) => void;

  /**
   * Upload endpoint (default: /api/wardrobe/upload)
   */
  uploadEndpoint?: string;

  /**


  * Metadata submission endpoint (default: /api/wardrobe)
   */
  metadataEndpoint?: string;
}

/**
 * Main ImageUploadModal component
 */
export function ImageUploadModal({
  isOpen,
  onClose,
  onSuccess,
  uploadEndpoint = '/api/wardrobe/upload',
  metadataEndpoint,
}: ImageUploadModalProps) {
  // State
  const [currentStep, setCurrentStep] = useState<ModalStep>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmittingMetadata, setIsSubmittingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [submittedMetadata, setSubmittedMetadata] = useState<MetadataFormData | null>(null);

  // Upload hook
  const {
    uploadImage,
    resetUpload,
    uploadState,
    uploadProgress,
    uploadError,
    uploadedImageId,
    isUploading,
  } = useImageUpload({
    endpoint: uploadEndpoint,
    onSuccess: () => {
      // Move to metadata step after successful upload
      setCurrentStep('metadata');
    },
    onError: (error) => {
      console.error('Upload error:', error);
    },
  });

  // Processing status hook
  const {
    status: processingStatus,
    steps: processingSteps,
    currentStep: processingCurrentStep,
    progress: processingProgress,
    error: processingError,
  } = useProcessingStatus({
    imageId: uploadedImageId,
    autoStart: currentStep === 'processing',
    onComplete: () => {
      setCurrentStep('success');
    },
    onError: (error) => {
      console.error('Processing error:', error);
    },
  });

  /**
   * Handles file selection
   */
  const handleFileSelect = useCallback(
    async (file: File) => {
      setSelectedFile(file);

      // Create preview
      const preview = createImagePreview(file);
      setPreviewUrl(preview);

      // Automatically start upload
      setCurrentStep('upload');
      await uploadImage(file);
    },
    [uploadImage]
  );

  /**
   * Handles validation error
   */
  const handleValidationError = useCallback((_error: FileValidationError) => {
    // Error is already displayed by DragDropZone component
  }, []);

  /**
   * Handles changing the selected image
   */
  const handleChangeImage = useCallback(() => {
    // Revoke previous preview
    revokeImagePreview(previewUrl);

    // Reset state
    setSelectedFile(null);
    setPreviewUrl(null);
    resetUpload();
    setCurrentStep('select');
  }, [previewUrl, resetUpload]);

  /**
   * Handles metadata form submission
   */
  const handleMetadataSubmit = useCallback(
    async (data: MetadataFormData) => {
      console.log('🔵 handleMetadataSubmit called with data:', data);
      console.log('🔵 uploadedImageId:', uploadedImageId);
      
      if (!uploadedImageId) {
        console.error('❌ No uploadedImageId available');
        return;
      }

      setIsSubmittingMetadata(true);
      setMetadataError(null);

      try {
        const endpoint = metadataEndpoint || `/api/wardrobe`;
        console.log('🔵 Sending POST to:', endpoint);

        const requestBody = {
          imageId: uploadedImageId,
          ...data,
        };
        console.log('🔵 Request body:', requestBody);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          credentials: 'include',
        });

        console.log('🔵 Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ Error response:', errorData);
          throw new Error(errorData.error || 'Failed to save metadata');
        }

        const result = await response.json();
        console.log('✅ Success response:', result);

        // Store the metadata for later use
        setSubmittedMetadata(data);

        // Move to processing step
        setCurrentStep('processing');
      } catch (error) {
        console.error('❌ Error in handleMetadataSubmit:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to save metadata';
        setMetadataError(errorMessage);
      } finally {
        setIsSubmittingMetadata(false);
      }
    },
    [uploadedImageId, metadataEndpoint]
  );

  /**
   * Handles adding another item
   */
  const handleAddAnother = useCallback(() => {
    // Call onSuccess to refresh the wardrobe list with the just-added item
    if (uploadedImageId) {
      onSuccess?.(uploadedImageId, submittedMetadata || undefined);
    }

    // Revoke preview
    revokeImagePreview(previewUrl);

    // Reset all state
    setSelectedFile(null);
    setPreviewUrl(null);
    setMetadataError(null);
    setSubmittedMetadata(null);
    resetUpload();
    setCurrentStep('select');
  }, [previewUrl, resetUpload, uploadedImageId, submittedMetadata, onSuccess]);

  /**
   * Handles viewing the item
   */
  const handleViewItem = useCallback(() => {
    if (uploadedImageId) {
      onSuccess?.(uploadedImageId, submittedMetadata || undefined);
    }
    
    // Reset state before closing
    revokeImagePreview(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setMetadataError(null);
    setSubmittedMetadata(null);
    resetUpload();
    setCurrentStep('select');
    
    onClose();
  }, [uploadedImageId, submittedMetadata, onSuccess, onClose, previewUrl, resetUpload]);

  /**
   * Handles modal close with confirmation
   */
  const handleClose = useCallback(() => {
    // Prevent closing during upload or processing
    if (isUploading || currentStep === 'processing') {
      const confirmed = window.confirm(
        'Upload is in progress. Are you sure you want to cancel?'
      );
      if (!confirmed) return;
    }

    // If we're on success screen, trigger the onSuccess callback to refresh items
    if (currentStep === 'success' && uploadedImageId) {
      onSuccess?.(uploadedImageId, submittedMetadata || undefined);
    }

    // Revoke preview
    revokeImagePreview(previewUrl);

    // Reset state
    setSelectedFile(null);
    setPreviewUrl(null);
    setMetadataError(null);
    setSubmittedMetadata(null);
    resetUpload();
    setCurrentStep('select');

    onClose();
  }, [isUploading, currentStep, previewUrl, resetUpload, onClose, uploadedImageId, submittedMetadata, onSuccess]);

  /**
   * Cleanup preview URL on unmount
   */
  useEffect(() => {
    return () => {
      revokeImagePreview(previewUrl);
    };
  }, [previewUrl]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => {
          // Prevent closing on outside click during upload/processing
          if (isUploading || currentStep === 'processing') {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Add Item to Wardrobe</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {currentStep === 'select' && 'Upload an image of your clothing item'}
            {currentStep === 'upload' && 'Uploading your image...'}
            {currentStep === 'metadata' && 'Tell us about your item'}
            {currentStep === 'processing' && 'Processing your image...'}
            {currentStep === 'success' && 'Item successfully added!'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Step 1: File Selection */}
          {currentStep === 'select' && (
            <DragDropZone
              onFileSelect={handleFileSelect}
              onValidationError={handleValidationError}
              showFileTypes={true}
            />
          )}

          {/* Step 2: Upload Progress */}
          {currentStep === 'upload' && (
            <div className="space-y-6">
              {/* Preview */}
              {previewUrl && (
                <Card className="p-4">
                  <div className="relative w-full aspect-square max-w-md mx-auto rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={previewUrl}
                      alt="Selected item preview"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                </Card>
              )}

              {/* Upload progress */}
              <UploadProgress
                progress={uploadProgress}
                state={uploadState}
                errorMessage={uploadError?.message}
              />

              {/* Error actions */}
              {uploadError && (
                <div className="flex gap-3">
                  <Button onClick={handleChangeImage} variant="outline" className="flex-1">
                    Try Different Image
                  </Button>
                  <Button
                    onClick={() => selectedFile && uploadImage(selectedFile)}
                    className="flex-1"
                  >
                    Retry Upload
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Metadata Form */}
          {currentStep === 'metadata' && (
            <div className="space-y-6">
              {/* Preview */}
              {previewUrl && (
                <div className="space-y-3">
                  <Card className="p-4">
                    <div className="relative w-full aspect-square max-w-xs mx-auto rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={previewUrl}
                        alt="Uploaded item preview"
                        fill
                        className="object-contain"
                        priority
                      />
                    </div>
                  </Card>
                  <Button
                    onClick={handleChangeImage}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
                    Change Image
                  </Button>
                </div>
              )}

              {/* Metadata form */}
              <MetadataForm
                onSubmit={handleMetadataSubmit}
                isSubmitting={isSubmittingMetadata}
                submitText="Continue"
              />

              {/* Metadata error */}
              {metadataError && (
                <div
                  className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
                  role="alert"
                >
                  <p className="text-sm text-destructive">{metadataError}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Processing */}
          {currentStep === 'processing' && (
            <ProcessingStatus
              status={processingStatus}
              steps={processingSteps}
              currentStep={processingCurrentStep}
              progress={processingProgress}
              error={processingError}
            />
          )}

          {/* Step 5: Success */}
          {currentStep === 'success' && (
            <div className="text-center space-y-6 py-8">
              {/* Success icon */}
              <div className="flex justify-center">
                <div className="p-4 bg-primary/10 rounded-full">
                  <CheckCircle2 className="w-16 h-16 text-primary" aria-hidden="true" />
                </div>
              </div>

              {/* Success message */}
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">
                  Item Successfully Added!
                </h3>
                <p className="text-muted-foreground">
                  Your item has been added to your wardrobe and is ready to use.
                </p>
              </div>

              {/* Preview */}
              {previewUrl && (
                <Card className="p-4 max-w-xs mx-auto">
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={previewUrl}
                      alt="Added item"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                </Card>
              )}

              {/* Action buttons */}
              <div className="flex flex-col gap-3 pt-4">
                <Button onClick={handleViewItem} className="w-full" size="lg">
                  <Eye className="w-4 h-4 mr-2" aria-hidden="true" />
                  View Item
                </Button>
                <Button onClick={handleAddAnother} variant="outline" className="w-full" size="lg">
                  <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
                  Add Another Item
                </Button>
                <Button onClick={handleClose} variant="ghost" className="w-full">
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
