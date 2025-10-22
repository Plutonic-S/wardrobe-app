/**
 * Image Model
 * Handles image storage, processing, and metadata
 * Focused on image lifecycle: upload → process → store
 */

import { Schema, model, models, Document, Model, Types } from 'mongoose';
import type { ProcessingStatus } from '@/features/wardrobe/types/wardrobe.types';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Image document interface (instance)
 */
export interface IImageDocument extends Document {
  userId: Types.ObjectId;
  
  // URLs
  originalUrl: string;
  optimizedUrl?: string;
  thumbnailUrl?: string;
  
  // Color Analysis
  dominantColor?: string;
  colors: string[];
  
  // Image Metadata
  width: number;
  height: number;
  size: number; // file size in bytes
  mimeType: string;
  
  // Processing State
  processingStatus: ProcessingStatus;
  processingError?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Instance Methods
  markAsProcessing(): Promise<IImageDocument>;
  markAsCompleted(data: {
    optimizedUrl: string;
    thumbnailUrl: string;
    dominantColor: string;
    colors: string[];
  }): Promise<IImageDocument>;
  markAsFailed(error: string): Promise<IImageDocument>;
}

/**
 * Image model interface (static methods)
 */
export interface IImageModel extends Model<IImageDocument> {
  getPendingImages(limit?: number): Promise<IImageDocument[]>;

  getByUserId(userId: Types.ObjectId | string): Promise<IImageDocument[]>;
  
  getProcessingStats(userId?: Types.ObjectId | string): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }>;
  
}

// ============================================================================
// SCHEMA
// ============================================================================

const imageSchema = new Schema<IImageDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    
    // URLs
    originalUrl: {
      type: String,
      required: true,
    },
    optimizedUrl: {
      type: String,
    },
    thumbnailUrl: {
      type: String,
    },
    
    // Color Analysis
    dominantColor: {
      type: String,
      match: /^#[0-9A-F]{6}$/i,
    },
    colors: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 5,
        message: 'Maximum 5 colors allowed',
      },
    },
    
    // Image Metadata
    width: {
      type: Number,
      required: true,
      min: 1,
    },
    height: {
      type: Number,
      required: true,
      min: 1,
    },
    size: {
      type: Number,
      required: true,
      min: 1,
    },
    mimeType: {
      type: String,
      required: true,
      enum: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    },
    
    // Processing State
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      required: true,
      index: true,
    },
    processingError: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================================
// INDEXES
// ============================================================================

// Compound indexes for common queries
imageSchema.index({ userId: 1, processingStatus: 1 });
imageSchema.index({ userId: 1, createdAt: -1 });
imageSchema.index({ processingStatus: 1, createdAt: 1 }); // For background processing jobs

// ============================================================================
// INSTANCE METHODS
// ============================================================================

/**
 * Mark image as currently processing
 */
imageSchema.methods.markAsProcessing = async function (): Promise<IImageDocument> {
  this.processingStatus = 'processing';
  this.processingError = undefined;
  return this.save();
};

/**
 * Mark image as completed with processed data
 */
imageSchema.methods.markAsCompleted = async function (data: {
  optimizedUrl: string;
  thumbnailUrl: string;
  dominantColor: string;
  colors: string[];
}): Promise<IImageDocument> {
  this.processingStatus = 'completed';
  this.optimizedUrl = data.optimizedUrl;
  this.thumbnailUrl = data.thumbnailUrl;
  this.dominantColor = data.dominantColor;
  this.colors = data.colors.slice(0, 5); // Enforce max 5 colors
  this.processingError = undefined;
  return this.save();
};

/**
 * Mark image as failed with error message
 */
imageSchema.methods.markAsFailed = async function (error: string): Promise<IImageDocument> {
  this.processingStatus = 'failed';
  this.processingError = error;
  return this.save();
};

// ============================================================================
// STATIC METHODS
// ============================================================================

/**
 * Get pending images for background processing
 */
imageSchema.statics.getPendingImages = async function (
  limit: number = 10
): Promise<IImageDocument[]> {
  return this.find({ processingStatus: 'pending' })
    .sort({ createdAt: 1 })
    .limit(limit)
    .exec();
};

/**
 * Get all images for a user
 */
imageSchema.statics.getByUserId = async function (
  userId: Types.ObjectId | string
): Promise<IImageDocument[]> {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .exec();
};

/**
 * Get processing statistics
 */
imageSchema.statics.getProcessingStats = async function (
  userId?: Types.ObjectId | string
): Promise<{
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}> {
  const query = userId ? { userId } : {};
  
  const stats = await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$processingStatus',
        count: { $sum: 1 },
      },
    },
  ]);
  
  const result = {
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  };
  
  stats.forEach((stat) => {
    result[stat._id as keyof typeof result] = stat.count;
    result.total += stat.count;
  });
  
  return result;
};



// ============================================================================
// MODEL EXPORT
// ============================================================================

const Image = (models.Image as IImageModel) || model<IImageDocument, IImageModel>('Image', imageSchema);

export default Image;
