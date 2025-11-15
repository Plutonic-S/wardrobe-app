// src/features/outfit-builder/validations/outfit.schema.ts
import { z } from 'zod';

// ============================================================================
// OUTFIT QUERY SCHEMA (for GET /api/outfits)
// ============================================================================

/**
 * Schema for validating outfit query parameters
 * Used for filtering, sorting, and pagination
 */
export const outfitQuerySchema = z.object({
  // Filters
  mode: z.enum(['dress-me', 'canvas']).optional(),
  favorite: z.enum(['true', 'false']).optional(),
  tags: z.string().optional(), // Comma-separated tags
  season: z.enum(['spring', 'summer', 'autumn', 'winter']).optional(),
  status: z.enum(['active', 'archived', 'deleted']).optional().default('active'),
  
  // Pagination
  skip: z.string().regex(/^\d+$/).optional().transform((val) => (val ? parseInt(val) : undefined)),
  limit: z.string().regex(/^\d+$/).optional().transform((val) => (val ? parseInt(val) : undefined)),
  
  // Sorting
  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'wearCount']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type OutfitQueryParams = z.infer<typeof outfitQuerySchema>;

// ============================================================================
// CREATE OUTFIT SCHEMA (for POST /api/outfits)
// ============================================================================

/**
 * Schema for validating outfit creation
 * Supports both Dress Me and Canvas modes
 */
export const createOutfitSchema = z.object({
  mode: z.enum(['dress-me', 'canvas'], {
    message: 'Mode must be either "dress-me" or "canvas"',
  }),
  
  // Metadata (required)
  metadata: z.object({
    name: z
      .string()
      .trim()
      .min(1, 'Outfit name is required')
      .max(100, 'Outfit name must be at most 100 characters'),
    description: z
      .string()
      .trim()
      .max(500, 'Description must be at most 500 characters')
      .optional(),
    tags: z
      .array(z.string().trim())
      .max(10, 'Maximum 10 tags allowed')
      .default([]),
    occasion: z.string().trim().optional(),
    season: z
      .array(z.enum(['spring', 'summer', 'autumn', 'winter']))
      .default([]),
  }),
  
  // Dress Me combination (required if mode is 'dress-me')
  combination: z
    .object({
      configuration: z.enum(['2-part', '3-part', '4-part'], {
        message: 'Configuration must be "2-part", "3-part", or "4-part"',
      }),
      items: z.object({
        tops: z.string().optional(),
        outerwear: z.string().optional(),
        bottoms: z.string().optional(),
        footwear: z.string().optional(),
        accessories: z.array(z.string()).default([]),
      }),
    })
    .optional(),
  
  // Canvas state (required if mode is 'canvas')
  canvasState: z
    .object({
      items: z.array(
        z.object({
          clothItemId: z.string().min(1, 'Cloth item ID is required'),
          position: z.object({
            x: z.number(),
            y: z.number(),
          }),
          size: z.object({
            width: z.number().min(1, 'Width must be at least 1'),
            height: z.number().min(1, 'Height must be at least 1'),
          }),
          rotation: z.number().min(0).max(360).default(0),
          zIndex: z.number().default(0),
        })
      ),
      viewport: z.object({
        zoom: z.number().min(0.25).max(4).default(1),
        pan: z.object({
          x: z.number().default(0),
          y: z.number().default(0),
        }),
      }),
    })
    .optional(),
}).refine(
  (data) => {
    // If mode is 'dress-me', combination is required
    if (data.mode === 'dress-me' && !data.combination) {
      return false;
    }
    // If mode is 'canvas', canvasState is required
    if (data.mode === 'canvas' && !data.canvasState) {
      return false;
    }
    return true;
  },
  {
    message: 'Dress Me mode requires combination data, Canvas mode requires canvasState data',
    path: ['mode'],
  }
);

export type CreateOutfitInput = z.infer<typeof createOutfitSchema>;

// ============================================================================
// UPDATE OUTFIT SCHEMA (for PATCH /api/outfits/[id])
// ============================================================================

/**
 * Schema for validating outfit updates
 * All fields are optional (partial update)
 */
export const updateOutfitSchema = z.object({
  // Metadata (optional)
  metadata: z
    .object({
      name: z
        .string()
        .trim()
        .min(1, 'Outfit name cannot be empty')
        .max(100, 'Outfit name must be at most 100 characters')
        .optional(),
      description: z
        .string()
        .trim()
        .max(500, 'Description must be at most 500 characters')
        .optional(),
      tags: z
        .array(z.string().trim())
        .max(10, 'Maximum 10 tags allowed')
        .optional(),
      occasion: z.string().trim().optional(),
      season: z
        .array(z.enum(['spring', 'summer', 'autumn', 'winter']))
        .optional(),
    })
    .optional(),
  
  // Dress Me combination (optional)
  combination: z
    .object({
      configuration: z.enum(['2-part', '3-part', '4-part']),
      items: z.object({
        tops: z.string().optional(),
        outerwear: z.string().optional(),
        bottoms: z.string().optional(),
        footwear: z.string().optional(),
        accessories: z.array(z.string()).default([]),
      }),
    })
    .optional(),
  
  // Canvas state (optional)
  canvasState: z
    .object({
      items: z.array(
        z.object({
          clothItemId: z.string().min(1, 'Cloth item ID is required'),
          position: z.object({
            x: z.number(),
            y: z.number(),
          }),
          size: z.object({
            width: z.number().min(1, 'Width must be at least 1'),
            height: z.number().min(1, 'Height must be at least 1'),
          }),
          rotation: z.number().min(0).max(360).default(0),
          zIndex: z.number().default(0),
        })
      ),
      viewport: z.object({
        zoom: z.number().min(0.25).max(4).default(1),
        pan: z.object({
          x: z.number().default(0),
          y: z.number().default(0),
        }),
      }),
    })
    .optional(),
  
  // Usage tracking (optional)
  usage: z
    .object({
      lastWornDate: z.coerce.date().optional(),
      wearCount: z.number().min(0).optional(),
      favorite: z.boolean().optional(),
    })
    .optional(),

  // Status (optional)
  status: z.enum(['active', 'archived', 'deleted']).optional(),
});

export type UpdateOutfitInput = z.infer<typeof updateOutfitSchema>;

// ============================================================================
// SHUFFLE OUTFIT SCHEMA (for POST /api/outfits/shuffle)
// ============================================================================

/**
 * Schema for validating shuffle/randomize requests
 * Used to generate random outfit combinations
 */
export const shuffleRequestSchema = z.object({
  configuration: z.enum(['2-part', '3-part', '4-part'], {
    message: 'Configuration must be "2-part", "3-part", or "4-part"',
  }),
  
  // Categories to keep locked (won't be randomized)
  lockedCategories: z
    .array(
      z.enum(['tops', 'outerwear', 'bottoms', 'footwear', 'accessories', 'dresses'])
    )
    .default([]),
  
  // Current combination (optional, for reference)
  currentCombination: z
    .object({
      tops: z.string().optional(),
      outerwear: z.string().optional(),
      bottoms: z.string().optional(),
      footwear: z.string().optional(),
      accessories: z.array(z.string()).default([]),
    })
    .optional(),
});

export type ShuffleRequestInput = z.infer<typeof shuffleRequestSchema>;

// ============================================================================
// BARREL EXPORT
// ============================================================================

export const outfitSchemas = {
  query: outfitQuerySchema,
  create: createOutfitSchema,
  update: updateOutfitSchema,
  shuffle: shuffleRequestSchema,
} as const;
