// src/lib/db/models/Outfit.ts
import { Schema, Document, model, models, Types, Model } from "mongoose";

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Outfit document interface (instance methods)
 */
export interface IOutfitDocument extends Document {
  userId: Types.ObjectId;
  
  // Metadata subdocument
  metadata: {
    name: string;
    description?: string;
    tags: string[];
    occasion?: string;
    season: Array<'spring' | 'summer' | 'autumn' | 'winter'>;
  };
  
  // Mode configuration
  mode: 'dress-me' | 'canvas';
  
  // Dress Me subdocument (conditional)
  combination?: {
    configuration: '2-part' | '3-part' | '4-part';
    items: {
      tops?: Types.ObjectId;
      outerwear?: Types.ObjectId;
      bottoms?: Types.ObjectId;
      footwear?: Types.ObjectId;
      accessories: Types.ObjectId[];
    };
  };
  
  // Canvas subdocument (conditional)
  canvasState?: {
    items: Array<{
      clothItemId: Types.ObjectId; // Reference to Cloth
      position: { x: number; y: number };
      size: { width: number; height: number };
      rotation: number;
      zIndex: number;
    }>;
    viewport: { zoom: number; pan: { x: number; y: number } };
  };
  
  // Usage tracking subdocument
  usage: {
    lastWornDate?: Date;
    wearCount: number;
    favorite: boolean;
  };
  
  // Social subdocument (Phase 4)
  social: {
    isPublic: boolean;
    likes: number;
    views: number;
  };
  
  // Status
  status: 'active' | 'archived' | 'deleted';
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  markAsWorn(): Promise<IOutfitDocument>;
  toggleFavorite(): Promise<IOutfitDocument>;
}

/**
 * Outfit model interface (static methods)
 */
export interface IOutfitModel extends Model<IOutfitDocument> {
  getByUserId(
    userId: Types.ObjectId | string,
    options?: { skip?: number; limit?: number }
  ): Promise<IOutfitDocument[]>;
  
  getFavorites(
    userId: Types.ObjectId | string,
    options?: { skip?: number; limit?: number }
  ): Promise<IOutfitDocument[]>;
  
  getByMode(
    userId: Types.ObjectId | string,
    mode: 'dress-me' | 'canvas',
    options?: { skip?: number; limit?: number }
  ): Promise<IOutfitDocument[]>;
  
  searchOutfits(
    userId: Types.ObjectId | string,
    searchTerm: string,
    options?: { skip?: number; limit?: number }
  ): Promise<IOutfitDocument[]>;
}

// ============================================================================
// EMBEDDED SCHEMAS
// ============================================================================

/**
 * Metadata subdocument schema
 */
const metadataSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500 },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 10,
        message: 'Maximum 10 tags allowed',
      },
    },
    occasion: { type: String, trim: true },
    season: {
      type: [{
        type: String,
        enum: ['spring', 'summer', 'autumn', 'winter'],
      }],
      default: [],
    },
  },
  { _id: false }
);

/**
 * Dress Me combination subdocument schema
 */
const combinationSchema = new Schema(
  {
    configuration: {
      type: String,
      enum: ['2-part', '3-part', '4-part'],
      required: true,
    },
    items: {
      tops: { type: Schema.Types.ObjectId, ref: 'Cloth' },
      outerwear: { type: Schema.Types.ObjectId, ref: 'Cloth' },
      bottoms: { type: Schema.Types.ObjectId, ref: 'Cloth' },
      footwear: { type: Schema.Types.ObjectId, ref: 'Cloth' },
      accessories: [{ type: Schema.Types.ObjectId, ref: 'Cloth' }],
    },
  },
  { _id: false }
);

/**
 * Canvas state subdocument schema
 */
const canvasStateSchema = new Schema(
  {
    items: [
      {
        clothItemId: { type: Schema.Types.ObjectId, ref: 'Cloth', required: true },
        position: {
          x: { type: Number, required: true },
          y: { type: Number, required: true },
        },
        size: {
          width: { type: Number, required: true, min: 1 },
          height: { type: Number, required: true, min: 1 },
        },
        rotation: { type: Number, default: 0, min: 0, max: 360 },
        zIndex: { type: Number, default: 0 },
      },
    ],
    viewport: {
      zoom: { type: Number, default: 1, min: 0.25, max: 4 },
      pan: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
      },
    },
  },
  { _id: false }
);

/**
 * Usage subdocument schema
 */
const usageSchema = new Schema(
  {
    lastWornDate: { type: Date },
    wearCount: { type: Number, default: 0, min: 0 },
    favorite: { type: Boolean, default: false },
  },
  { _id: false }
);

/**
 * Social subdocument schema
 */
const socialSchema = new Schema(
  {
    isPublic: { type: Boolean, default: false },
    likes: { type: Number, default: 0, min: 0 },
    views: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

// ============================================================================
// MAIN SCHEMA
// ============================================================================

const outfitSchema = new Schema<IOutfitDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    metadata: {
      type: metadataSchema,
      required: true,
    },
    mode: {
      type: String,
      enum: ['dress-me', 'canvas'],
      required: true,
    },
    combination: {
      type: combinationSchema,
    },
    canvasState: {
      type: canvasStateSchema,
    },
    usage: {
      type: usageSchema,
      default: {},
    },
    social: {
      type: socialSchema,
      default: {},
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'deleted'],
      default: 'active',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================================
// INDEXES
// ============================================================================

// Compound indexes for common queries (following Phase 2 pattern)
outfitSchema.index({ userId: 1, status: 1 });
outfitSchema.index({ userId: 1, mode: 1 });
outfitSchema.index({ userId: 1, 'usage.favorite': 1 });
outfitSchema.index({ userId: 1, 'metadata.tags': 1 });
outfitSchema.index({ userId: 1, createdAt: -1 });
outfitSchema.index({ createdAt: -1 });

// Text search index (following Phase 2 pattern)
outfitSchema.index({
  'metadata.name': 'text',
  'metadata.description': 'text',
  'metadata.tags': 'text',
});

// ============================================================================
// INSTANCE METHODS
// ============================================================================

/**
 * Mark outfit as worn today (following Cloth.markAsWorn pattern)
 */
outfitSchema.methods.markAsWorn = async function (): Promise<IOutfitDocument> {
  this.usage.lastWornDate = new Date();
  this.usage.wearCount += 1;
  return this.save();
};

/**
 * Toggle favorite status (following Cloth.toggleFavorite pattern)
 */
outfitSchema.methods.toggleFavorite = async function (): Promise<IOutfitDocument> {
  this.usage.favorite = !this.usage.favorite;
  return this.save();
};

// ============================================================================
// STATIC METHODS
// ============================================================================

/**
 * Get outfits by user ID with populated cloth items
 * (following Cloth.getByCategory pattern)
 */
outfitSchema.statics.getByUserId = async function (
  userId: Types.ObjectId | string,
  options: { skip?: number; limit?: number } = {}
): Promise<IOutfitDocument[]> {
  const { skip = 0, limit = 20 } = options;
  
  return this.find({ userId, status: 'active' })
    .populate({
      path: 'combination.items.tops combination.items.outerwear combination.items.bottoms combination.items.footwear combination.items.accessories',
      select: 'metadata.name metadata.category imageId',
      populate: { path: 'imageId', select: 'thumbnailUrl dominantColor' },
    })
    .populate({
      path: 'canvasState.items.clothItemId',
      select: 'metadata.name metadata.category imageId',
      populate: { path: 'imageId', select: 'thumbnailUrl dominantColor' },
    })
    .select('-__v')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
    .exec();
};

/**
 * Get favorite outfits (following Cloth.getFavorites pattern)
 */
outfitSchema.statics.getFavorites = async function (
  userId: Types.ObjectId | string,
  options: { skip?: number; limit?: number } = {}
): Promise<IOutfitDocument[]> {
  const { skip = 0, limit = 20 } = options;
  
  return this.find({
    userId,
    status: 'active',
    'usage.favorite': true,
  })
    .populate({
      path: 'combination.items.tops combination.items.outerwear combination.items.bottoms combination.items.footwear combination.items.accessories',
      select: 'metadata.name metadata.category imageId',
      populate: { path: 'imageId', select: 'thumbnailUrl dominantColor' },
    })
    .populate({
      path: 'canvasState.items.clothItemId',
      select: 'metadata.name metadata.category imageId',
      populate: { path: 'imageId', select: 'thumbnailUrl dominantColor' },
    })
    .select('-__v')
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
    .exec();
};

/**
 * Get outfits by mode (following Phase 2 static method pattern)
 */
outfitSchema.statics.getByMode = async function (
  userId: Types.ObjectId | string,
  mode: 'dress-me' | 'canvas',
  options: { skip?: number; limit?: number } = {}
): Promise<IOutfitDocument[]> {
  const { skip = 0, limit = 20 } = options;
  
  return this.find({ userId, mode, status: 'active' })
    .populate({
      path: 'combination.items.tops combination.items.outerwear combination.items.bottoms combination.items.footwear combination.items.accessories',
      select: 'metadata.name metadata.category imageId',
      populate: { path: 'imageId', select: 'thumbnailUrl dominantColor' },
    })
    .populate({
      path: 'canvasState.items.clothItemId',
      select: 'metadata.name metadata.category imageId',
      populate: { path: 'imageId', select: 'thumbnailUrl dominantColor' },
    })
    .select('-__v')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
    .exec();
};

/**
 * Search outfits by text (following Cloth.searchItems pattern)
 */
outfitSchema.statics.searchOutfits = async function (
  userId: Types.ObjectId | string,
  searchTerm: string,
  options: { skip?: number; limit?: number } = {}
): Promise<IOutfitDocument[]> {
  const { skip = 0, limit = 20 } = options;
  
  return this.find({
    userId,
    status: 'active',
    $text: { $search: searchTerm },
  })
    .populate({
      path: 'combination.items.tops combination.items.outerwear combination.items.bottoms combination.items.footwear combination.items.accessories',
      select: 'metadata.name metadata.category imageId',
      populate: { path: 'imageId', select: 'thumbnailUrl dominantColor' },
    })
    .populate({
      path: 'canvasState.items.clothItemId',
      select: 'metadata.name metadata.category imageId',
      populate: { path: 'imageId', select: 'thumbnailUrl dominantColor' },
    })
    .select('-__v score')
    .sort({ score: { $meta: 'textScore' } })
    .skip(skip)
    .limit(limit)
    .lean()
    .exec();
};

// ============================================================================
// PRE-SAVE HOOKS
// ============================================================================

/**
 * Validate mode-specific data before saving (following Phase 2 pattern)
 */
outfitSchema.pre('save', function (next) {
  // Enforce tag limit
  if (this.metadata.tags && this.metadata.tags.length > 10) {
    this.metadata.tags = this.metadata.tags.slice(0, 10);
  }
  
  // Validate mode-specific data
  if (this.mode === 'dress-me' && !this.combination) {
    return next(new Error('Dress Me mode requires combination data'));
  }
  
  if (this.mode === 'canvas' && !this.canvasState) {
    return next(new Error('Canvas mode requires canvasState data'));
  }
  
  next();
});

// ============================================================================
// MODEL EXPORT
// ============================================================================

const Outfit =
  (models.Outfit as IOutfitModel) ||
  model<IOutfitDocument, IOutfitModel>('Outfit', outfitSchema);

export default Outfit;