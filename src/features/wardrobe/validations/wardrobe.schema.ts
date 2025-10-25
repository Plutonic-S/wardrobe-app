import { z } from "zod";

/**
 * Wardrobe query parameters schema
 */
export const wardrobeQuerySchema = z.object({
  // Filters
  category: z
    .enum([
      "tops",
      "bottoms",
      "dresses",
      "outerwear",
      "footwear",
      "accessories",
    ])
    .optional(),
  season: z.enum(["spring", "summer", "autumn", "winter"]).optional(),
  favorite: z
    .string()
    .refine((val) => val === "true" || val === "false", {
      message: "favorite must be 'true' or 'false'",
    })
    .transform((val) => val === "true")
    .optional(),
  tags: z
    .string()
    .transform((val) => val.split(",").map((tag) => tag.trim()))
    .optional(),
  search: z
    .string()
    .min(1, "Search term must be at least 1 character")
    .max(100, "Search term too long")
    .optional(),
  status: z
    .enum(["active", "archived", "donated", "disposed"])
    .optional()
    .default("active"),

  // Pagination
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "page must be a positive number",
    }),
  limit: z
    .string()
    .optional()
    .default("20")
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0 && val <= 100, {
      message: "limit must be between 1 and 100",
    }),

  // Sorting
  sortBy: z
    .enum([
      "createdAt",
      "updatedAt",
      "name",
      "wearCount",
      "lastWornDate",
      "price",
    ])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type WardrobeQueryParams = z.infer<typeof wardrobeQuerySchema>;

/**
 * Update clothing item schema (PATCH)
 */
export const clothUpdateSchema = z
  .object({
    // Metadata
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(80, "Name too long")
      .optional(),
    category: z
      .enum([
        "tops",
        "bottoms",
        "dresses",
        "outerwear",
        "footwear",
        "accessories",
      ])
      .optional(),
    subcategory: z.string().trim().max(50).optional(),
    season: z
      .array(z.enum(["spring", "summer", "autumn", "winter"]))
      .max(4, "Maximum 4 seasons")
      .optional(),
    styleType: z.string().trim().max(30).optional(),

    // Organization
    tags: z
      .array(z.string().trim().min(1).max(20))
      .max(10, "Maximum 10 tags")
      .optional(),
    brand: z.string().trim().max(40).optional(),
    // z.string().datetime() -> z.iso.datetime() because of deprecation
    purchaseDate: z.iso.datetime().optional(),
    price: z.number().min(0, "Price cannot be negative").optional(),

    // Usage
    favorite: z.boolean().optional(),

    // Status
    status: z.enum(["active", "archived", "donated", "disposed"]).optional(),
  })
  .strict(); // Reject unknown fields

export type ClothUpdateInput = z.infer<typeof clothUpdateSchema>;
