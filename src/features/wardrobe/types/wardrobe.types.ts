import { ObjectId } from "mongoose";

/**
 * Clothing item categories
 */
export type ClothCategory =
  | "tops"
  | "bottoms"
  | "dresses"
  | "outerwear"
  | "footwear"
  | "accessories";

/**
 * Clothing item subcategories
 */
export type ClothSubCategory =
  | "Shirt"
  | "T-Shirt"
  | "Sweater"
  | "Jacket"
  | "Coat"
  | "Dress"
  | "Skirt"
  | "Pants"
  | "Shorts"
  | "Shoes"
  | "Sneakers"
  | "Boots"
  | "Sandals"
  | "Hat"
  | "Bracelet"
  | "Necklace"
  | "Earrings"
  | "Scarf"
  | "Belt"
  | "Sunglasses"
  | "Watch"
  | "Bag"
  | "Backpack";

/**
 * Seasons for clothing items
 */
export type Season = "spring" | "summer" | "autumn" | "winter";

/**
 * Style types for clothing items
 */
export type StyleType =
  | "Casual"
  | "Formal"
  | "Sporty"
  | "Business"
  | "Streetwear"
  | "Bohemian"
  | "Vintage"
  | "Chic"
  | "Minimalist"
  | "Luxury"
  | "Grunge"
  | "Preppy"
  | "Punk"
  | "Elegant";

/**
 * Status of clothing items in wardrobe
 */
export type ClothStatus = "active" | "archived" | "donated" | "disposed";

/**
 * Image processing status
 */
export type ProcessingStatus = "pending" | "processing" | "completed" | "failed";

/**
 * Image data embedded in clothing item
 * Contains all image-related information
 */
export interface ClothImage {
  // Image URLs
  originalUrl: string;
  optimizedUrl: string;
  thumbnailUrl: string;

  // Visual properties
  dominantColor: string;
  colors: string[]; // Max 5 colors

  // Image metadata
  width: number;
  height: number;
  size: number; // File size in bytes

  // Processing
  processingStatus: ProcessingStatus;
  processingError?: string;
}

/**
 * Metadata for clothing items
 */
export interface ClothMetadata {
  name: string;
  category: ClothCategory;
  subcategory: ClothSubCategory | string;
  season: Season[];
  styleType: StyleType | string;
}

/**
 * Organization fields for clothing items
 */
export interface ClothOrganization {
  tags: string[]; // Max 10 tags
  brand?: string;
  purchaseDate?: Date;
  price?: number;
}

/**
 * Usage tracking for clothing items
 */
export interface ClothUsage {
  lastWornDate?: Date;
  wearCount: number;
  favorite: boolean;
}

/**
 * Complete clothing item interface (for Mongoose document)
 */
export interface ICloth {
  _id: string;
  userId: ObjectId;

  // Embedded image data (grouped)
  image: ClothImage;

  // Metadata
  metadata: ClothMetadata;

  // Organization
  organization: ClothOrganization;

  // Usage tracking
  usage: ClothUsage;

  // Status
  status: ClothStatus;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Clothing item response for API (flattened for frontend)
 */
export interface ClothResponse {
  id: string;
  userId: string;

  // Image data
  originalUrl: string;
  optimizedUrl: string;
  thumbnailUrl: string;
  dominantColor: string;
  colors: string[];
  imageWidth: number;
  imageHeight: number;
  imageSize: number;

  // Metadata
  name: string;
  category: ClothCategory;
  subcategory: ClothSubCategory | string;
  season: Season[];
  styleType: StyleType | string;

  // Organization
  tags: string[];
  brand?: string;
  purchaseDate?: Date;
  price?: number;

  // Usage
  lastWornDate?: Date;
  wearCount: number;
  favorite: boolean;

  // Processing
  processingStatus: ProcessingStatus;
  processingError?: string;

  // Status
  status: ClothStatus;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating a new clothing item
 */
export interface CreateClothInput {
  name: string;
  category: ClothCategory;
  subcategory: ClothSubCategory | string;
  season?: Season[];
  styleType?: StyleType | string;
  tags?: string[];
  brand?: string;
  purchaseDate?: Date;
  price?: number;
}

/**
 * Input for updating a clothing item
 */
export interface UpdateClothInput {
  name?: string;
  category?: ClothCategory;
  subcategory?: ClothSubCategory | string;
  season?: Season[];
  styleType?: StyleType | string;
  tags?: string[];
  brand?: string;
  purchaseDate?: Date;
  price?: number;
  favorite?: boolean;
  status?: ClothStatus;
}

/**
 * Filters for querying clothing items
 */
export interface ClothFilters {
  category?: ClothCategory;
  season?: Season[];  // Changed to array to support multiple seasons
  subcategory?: string[];
  styleType?: string[];
  brand?: string[];
  favorite?: boolean;
  status?: ClothStatus;
  tags?: string[];
  searchTerm?: string;
  priceMin?: number;
  priceMax?: number;
  purchaseDateFrom?: Date;
  purchaseDateTo?: Date;
}

/**
 * Wardrobe statistics
 */
export interface WardrobeStats {
  totalItems: number;
  byCategory: Record<ClothCategory, number>;
  favoriteCount: number;
  mostWornCount: number;
  totalValue: number;
  itemsByStatus: Record<ClothStatus, number>;
}
