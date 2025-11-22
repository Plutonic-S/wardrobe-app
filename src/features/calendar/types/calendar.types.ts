// src/features/calendar/types/calendar.types.ts

import type { OutfitDocument, PreviewImage } from '@/features/outfit-builder/types/outfit.types';

/**
 * Outfit with optional preview image
 */
export interface OutfitWithPreview extends OutfitDocument {
  _id?: string; // MongoDB document ID
  previewImage?: PreviewImage;
}

/**
 * Outfit assignment interface
 */
export interface OutfitAssignment {
  _id: string;
  userId: string;
  outfitId?: OutfitWithPreview; // Populated
  assignedDate: Date;
  occasion?: string;
  isWorn: boolean;
  wornDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create assignment request
 */
export interface CreateAssignmentRequest {
  outfitId: string;
  assignedDate: string;
  occasion?: string;
}

/**
 * Update assignment request
 */
export interface UpdateAssignmentRequest {
  outfitId?: string;
  occasion?: string;
  isWorn?: boolean;
}
