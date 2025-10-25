import type { IClothDocument } from "@/lib/db/models/Cloth";

/**
 * Cloth item with populated image data
 */
export type PopulatedClothItem = Omit<IClothDocument, "imageId"> & {
  imageId: {
    originalUrl: string;
    optimizedUrl: string;
    thumbnailUrl: string;
    dominantColor: string;
    colors: string[];
    processingStatus: string;
    width: number;
    height: number;
  };
};

/**
 * Update data object for PATCH operations
 */
export type ClothUpdateData = {
  [key: string]: string | number | boolean | Date | string[];
};

/**
 * Projection constants for queries
 */
export const CLOTH_PROJECTION = {
  _id: 1,
  userId: 1,
  imageId: 1,
  "metadata.name": 1,
  "metadata.category": 1,
  "metadata.subcategory": 1,
  "metadata.season": 1,
  "metadata.styleType": 1,
  "organization.tags": 1,
  "organization.brand": 1,
  "organization.purchaseDate": 1,
  "organization.price": 1,
  "usage.lastWornDate": 1,
  "usage.wearCount": 1,
  "usage.favorite": 1,
  status: 1,
  createdAt: 1,
  updatedAt: 1,
} as const;

export const IMAGE_PROJECTION = {
  originalUrl: 1,
  optimizedUrl: 1,
  thumbnailUrl: 1,
  dominantColor: 1,
  colors: 1,
  processingStatus: 1,
  width: 1,
  height: 1,
} as const;
