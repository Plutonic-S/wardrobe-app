import { Schema, Document, model, models, Types, Model } from "mongoose";
import type {
  ClothCategory,
  ClothSubCategory,
  Season,
  ClothStatus,
  WardrobeStats,
} from "@/features/wardrobe/types/wardrobe.types";

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Cloth document interface (instance methods)
 */
export interface IClothDocument extends Document {
  userId: Types.ObjectId;
  imageId: Types.ObjectId; // Reference to Image model
  metadata: {
    name: string;
    category: ClothCategory;
    subcategory?: ClothSubCategory;
    season: Season[];
    styleType?: string;
  };
  organization: {
    tags: string[];
    brand?: string;
    purchaseDate?: Date;
    price?: number;
  };
  usage: {
    lastWornDate?: Date;
    wearCount: number;
    favorite: boolean;
  };
  status: ClothStatus;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  markAsWorn(): Promise<IClothDocument>;
  toggleFavorite(): Promise<IClothDocument>;
}

/**
 * Cloth model interface (static methods)
 */
export interface IClothModel extends Model<IClothDocument> {
  getWardrobeStats(userId: Types.ObjectId | string): Promise<WardrobeStats>;
  getByCategory(
    userId: Types.ObjectId | string,
    category: ClothCategory,
    options?: { skip?: number; limit?: number }
  ): Promise<IClothDocument[]>;
  getFavorites(
    userId: Types.ObjectId | string,
    options?: { skip?: number; limit?: number }
  ): Promise<IClothDocument[]>;
  searchItems(
    userId: Types.ObjectId | string,
    searchTerm: string,
    options?: { skip?: number; limit?: number }
  ): Promise<IClothDocument[]>;
  getBySeason(
    userId: Types.ObjectId | string,
    season: Season,
    options?: { skip?: number; limit?: number }
  ): Promise<IClothDocument[]>;
  getFilteredItems(
    userId: Types.ObjectId | string,
    filters: {
      category?: ClothCategory;
      season?: Season;
      favorite?: boolean;
      tags?: string[];
      status?: ClothStatus;
    },
    options?: {
      skip?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    }
  ): Promise<{ items: IClothDocument[]; total: number }>;
}

// ============================================================================
// EMBEDDED SCHEMAS
// ============================================================================

/**
 * Metadata subdocument schema
 */
const metadataSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        "tops",
        "bottoms",
        "dresses",
        "outerwear",
        "footwear",
        "accessories",
      ],
      required: true,
    },
    subcategory: { type: String },
    season: {
      type: [{
        type: String,
        enum: ["spring", "summer", "autumn", "winter"],
      }],
      default: [],
    },
    styleType: { type: String },
  },
  { _id: false }
);

/**
 * Organization subdocument schema
 */
const organizationSchema = new Schema(
  {
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 10,
        message: "Maximum 10 tags allowed",
      },
    },
    brand: { type: String, trim: true },
    purchaseDate: { type: Date },
    price: { type: Number, min: 0 },
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

// ============================================================================
// MAIN SCHEMA
// ============================================================================

const clothSchema = new Schema<IClothDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    imageId: {
      type: Schema.Types.ObjectId,
      ref: "Image",
      required: true,
      index: true,
    },
    metadata: {
      type: metadataSchema,
      required: true,
    },
    organization: {
      type: organizationSchema,
      default: {},
    },
    usage: {
      type: usageSchema,
      default: {},
    },
    status: {
      type: String,
      enum: ["active", "archived", "donated", "disposed"],
      default: "active",
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

// Compound indexes for common queries
clothSchema.index({ userId: 1, "metadata.category": 1 });
clothSchema.index({ userId: 1, status: 1 });
clothSchema.index({ userId: 1, "usage.favorite": 1 });
clothSchema.index({ userId: 1, "metadata.season": 1 });
clothSchema.index({ userId: 1, "metadata.styleType": 1 });
clothSchema.index({ userId: 1, "organization.tags": 1 });
clothSchema.index({ userId: 1, imageId: 1 }); // For populating image data
clothSchema.index({ createdAt: -1 });

// Text search index
clothSchema.index({
  "metadata.name": "text",
  "organization.brand": "text",
  "organization.tags": "text",
});

// ============================================================================
// VIRTUALS
// ============================================================================

// Virtuals removed - use population with Image model instead

// ============================================================================
// INSTANCE METHODS
// ============================================================================

/**
 * Mark item as worn today
 */
clothSchema.methods.markAsWorn = async function (): Promise<IClothDocument> {
  this.usage.lastWornDate = new Date();
  this.usage.wearCount += 1;
  return this.save();
};

/**
 * Toggle favorite status
 */
clothSchema.methods.toggleFavorite =
  async function (): Promise<IClothDocument> {
    this.usage.favorite = !this.usage.favorite;
    return this.save();
  };

// ============================================================================
// STATIC METHODS
// ============================================================================

/**
 * Get wardrobe statistics with image processing status
 */
clothSchema.statics.getWardrobeStats = async function (
  userId: Types.ObjectId | string
): Promise<WardrobeStats> {
  const stats = await this.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId as string),
        status: "active",
      },
    },
    {
      $lookup: {
        from: "images",
        localField: "imageId",
        foreignField: "_id",
        as: "image",
      },
    },
    { $unwind: "$image" },
    {
      $match: {
        "image.processingStatus": "completed", // Only count items with processed images
      },
    },
    {
      $group: {
        _id: "$metadata.category",
        count: { $sum: 1 },
      },
    },
  ]);

  const byCategory: Record<ClothCategory, number> = {
    tops: 0,
    bottoms: 0,
    dresses: 0,
    outerwear: 0,
    footwear: 0,
    accessories: 0,
  };

  stats.forEach((stat) => {
    byCategory[stat._id as ClothCategory] = stat.count;
  });

  const totalItems = await this.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId as string),
        status: "active",
      },
    },
    {
      $lookup: {
        from: "images",
        localField: "imageId",
        foreignField: "_id",
        as: "image",
      },
    },
    { $unwind: "$image" },
    { $match: { "image.processingStatus": "completed" } },
    { $count: "total" },
  ]);

  const favoriteCount = await this.countDocuments({
    userId,
    status: "active",
    "usage.favorite": true,
  });

  return {
    totalItems: totalItems[0]?.total || 0,
    byCategory,
    favoriteCount,
    mostWornCount: 0, // TODO: Implement most worn count
    totalValue: 0, // TODO: Implement total value calculation
    itemsByStatus: {
      active: 0,
      archived: 0,
      donated: 0,
      disposed: 0,
    }, // TODO: Implement items by status
  };
};

/**
 * Get items by category with populated image data
 */
clothSchema.statics.getByCategory = async function (
  userId: Types.ObjectId | string,
  category: ClothCategory,
  options: { skip?: number; limit?: number } = {}
): Promise<IClothDocument[]> {
  const { skip = 0, limit = 20 } = options;

  return this.find({
    userId,
    "metadata.category": category,
    status: "active",
  })
    .populate({
      path: "imageId",
      select: "originalUrl optimizedUrl thumbnailUrl dominantColor processingStatus",
    })
    .select("-__v")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
    .exec();
};

/**
 * Get favorite items with populated image data
 */
clothSchema.statics.getFavorites = async function (
  userId: Types.ObjectId | string,
  options: { skip?: number; limit?: number } = {}
): Promise<IClothDocument[]> {
  const { skip = 0, limit = 20 } = options;

  return this.find({
    userId,
    "usage.favorite": true,
    status: "active",
  })
    .populate({
      path: "imageId",
      select: "originalUrl optimizedUrl thumbnailUrl dominantColor processingStatus",
    })
    .select("-__v")
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
    .exec();
};

/**
 * Search items by text with populated image data (uses text index)
 */
clothSchema.statics.searchItems = async function (
  userId: Types.ObjectId | string,
  searchTerm: string,
  options: { skip?: number; limit?: number } = {}
): Promise<IClothDocument[]> {
  const { skip = 0, limit = 20 } = options;

  return this.find({
    userId,
    status: "active",
    $text: { $search: searchTerm },
  })
    .populate({
      path: "imageId",
      select: "originalUrl optimizedUrl thumbnailUrl dominantColor processingStatus",
    })
    .select("-__v score")
    .sort({ score: { $meta: "textScore" } })
    .skip(skip)
    .limit(limit)
    .lean()
    .exec();
};

/**
 * Get items by season with populated image data
 */
clothSchema.statics.getBySeason = async function (
  userId: Types.ObjectId | string,
  season: Season,
  options: { skip?: number; limit?: number } = {}
): Promise<IClothDocument[]> {
  const { skip = 0, limit = 20 } = options;

  return this.find({
    userId,
    "metadata.season": season,
    status: "active",
  })
    .populate({
      path: "imageId",
      select: "originalUrl optimizedUrl thumbnailUrl dominantColor processingStatus",
    })
    .select("-__v")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
    .exec();
};

/**
 * Get filtered items with advanced criteria and populated image data
 */
clothSchema.statics.getFilteredItems = async function (
  userId: Types.ObjectId | string,
  filters: {
    category?: ClothCategory;
    season?: Season;
    favorite?: boolean;
    tags?: string[];
    status?: ClothStatus;
  },
  options: {
    skip?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  } = {}
): Promise<{ items: IClothDocument[]; total: number }> {
  const { skip = 0, limit = 20, sortBy = "createdAt", sortOrder = "desc" } = options;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: Record<string, any> = {
    userId,
    status: filters.status || "active",
  };

  if (filters.category) {
    query["metadata.category"] = filters.category;
  }

  if (filters.season) {
    query["metadata.season"] = { $in: [filters.season] };
  }

  if (filters.favorite !== undefined) {
    query["usage.favorite"] = filters.favorite;
  }

  if (filters.tags && filters.tags.length > 0) {
    query["organization.tags"] = { $in: filters.tags };
  }

  // Build sort object
  const sort: Record<string, 1 | -1> = {};
  const sortField = sortBy === "name" ? "metadata.name" :
                    sortBy === "wearCount" ? "usage.wearCount" :
                    sortBy === "lastWornDate" ? "usage.lastWornDate" :
                    sortBy === "price" ? "organization.price" :
                    sortBy; // createdAt or updatedAt
  sort[sortField] = sortOrder === "asc" ? 1 : -1;

  // Execute query with count
  const [items, total] = await Promise.all([
    this.find(query)
      .populate({
        path: "imageId",
        select: "originalUrl optimizedUrl thumbnailUrl dominantColor processingStatus",
      })
      .select("-__v")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    this.countDocuments(query),
  ]);

  return { items, total };
};

// ============================================================================
// PRE-SAVE HOOKS
// ============================================================================

/**
 * Validate arrays before saving
 */
clothSchema.pre("save", function (next) {
  // Enforce tag limit
  if (this.organization.tags && this.organization.tags.length > 10) {
    this.organization.tags = this.organization.tags.slice(0, 10);
  }

  next();
});

// ============================================================================
// MODEL EXPORT
// ============================================================================

const Cloth =
  (models.Cloth as IClothModel) ||
  model<IClothDocument, IClothModel>("Cloth", clothSchema);

export default Cloth;
