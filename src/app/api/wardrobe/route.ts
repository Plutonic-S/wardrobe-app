import { ApiResponseHandler } from "@/lib/api-response";
import Cloth from "@/lib/db/models/Cloth";
import Image from "@/lib/db/models/Image";
import dbConnect from "@/lib/db/mongoose";
import { authenticate } from "@/lib/middleware/auth-middleware";
import { asyncHandler } from "@/lib/middleware/error-handler";
import { NextRequest, NextResponse } from "next/server";
import { wardrobeQuerySchema } from "@/features/wardrobe/validations/wardrobe.schema";
import { ZodError } from "zod";
import { Types } from "mongoose";
import { IMAGE_PROJECTION } from "@/features/wardrobe/types/cloth-api.types";
import { ClothResponse } from "@/features/wardrobe/types/wardrobe.types";

/**
 * Transform Mongoose Cloth document to flattened ClothResponse
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformClothToResponse(cloth: any): ClothResponse {
  const image = cloth.imageId || {};
  
  return {
    id: cloth._id.toString(),
    userId: cloth.userId.toString(),
    
    // Image data
    originalUrl: image.originalUrl || "",
    optimizedUrl: image.optimizedUrl || "",
    thumbnailUrl: image.thumbnailUrl || "",
    dominantColor: image.dominantColor || "#CCCCCC",
    colors: image.colors || [],
    imageWidth: image.width || 0,
    imageHeight: image.height || 0,
    imageSize: image.size || 0,
    
    // Metadata (flattened)
    name: cloth.metadata?.name || "",
    category: cloth.metadata?.category || "tops",
    subcategory: cloth.metadata?.subcategory || "",
    season: cloth.metadata?.season || [],
    styleType: cloth.metadata?.styleType || "",
    
    // Organization (flattened)
    tags: cloth.organization?.tags || [],
    brand: cloth.organization?.brand,
    purchaseDate: cloth.organization?.purchaseDate,
    price: cloth.organization?.price,
    
    // Usage (flattened)
    lastWornDate: cloth.usage?.lastWornDate,
    wearCount: cloth.usage?.wearCount || 0,
    favorite: cloth.usage?.favorite || false,
    
    // Processing
    processingStatus: image.processingStatus || "pending",
    processingError: image.processingError,
    
    // Status
    status: cloth.status || "active",
    
    // Timestamps
    createdAt: cloth.createdAt,
    updatedAt: cloth.updatedAt,
  };
}

/**
 * GET /api/wardrobe
 * 
 * Fetch user's wardrobe items with filtering, search, and pagination
 * 
 * Query Parameters:
 * - category: Filter by category (tops, bottoms, etc.)
 * - season: Filter by season (spring, summer, autumn, winter)
 * - favorite: Filter favorites (true/false)
 * - tags: Filter by tags (comma-separated)
 * - search: Text search across name, brand, tags
 * - status: Filter by status (active, archived, donated, disposed)
 * - page: Page number (default: 1)
 * - limit: Items per page (max: 100, default: 20)
 * - sortBy: Sort field (createdAt, updatedAt, name, wearCount, lastWornDate, price)
 * - sortOrder: Sort direction (asc, desc)
 */
export const GET = asyncHandler(
  async (req: NextRequest): Promise<NextResponse> => {
    // 1. Authenticate user
    const { user, error } = await authenticate(req);
    if (error || !user) {
      return error; // Return 401 if not authenticated
    }

    // 2. Connect to DB
    await dbConnect();

    // 3. Parse and validate query parameters
    const { searchParams } = new URL(req.url);
    
    let validatedParams;
    try {
      // Only include params that are actually present (not null)
      const params: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        if (value) params[key] = value;
      });
      
      validatedParams = wardrobeQuerySchema.parse(params);
    } catch (err) {
      if (err instanceof ZodError) {
        return ApiResponseHandler.badRequest(
          err.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
        );
      }
      return ApiResponseHandler.badRequest("Invalid query parameters");
    }

    // 4. Calculate pagination
    const skip = (validatedParams.page - 1) * validatedParams.limit;

    // 5. Query database using appropriate method
    let items;
    let total;

    try {
      if (validatedParams.search) {
        // Text search (uses text index)
        items = await Cloth.searchItems(user.userId, validatedParams.search, {
          skip,
          limit: validatedParams.limit,
        });
        total = items.length; // Text search doesn't return count separately
      } else {
        // Filtered query with count
        const result = await Cloth.getFilteredItems(
          user.userId,
          {
            category: validatedParams.category,
            season: validatedParams.season,
            favorite: validatedParams.favorite,
            tags: validatedParams.tags,
            status: validatedParams.status,
          },
          {
            skip,
            limit: validatedParams.limit,
            sortBy: validatedParams.sortBy,
            sortOrder: validatedParams.sortOrder,
          }
        );
        items = result.items;
        total = result.total;
      }

      // 6. Build response
      return ApiResponseHandler.success(
        {
          items: items.map(transformClothToResponse),
          pagination: {
            total,
            page: validatedParams.page,
            limit: validatedParams.limit,
            totalPages: Math.ceil(total / validatedParams.limit),
            hasNext: validatedParams.page * validatedParams.limit < total,
            hasPrev: validatedParams.page > 1,
          },
          filters: {
            category: validatedParams.category,
            season: validatedParams.season,
            favorite: validatedParams.favorite,
            tags: validatedParams.tags,
            status: validatedParams.status,
            search: validatedParams.search,
          },
          sort: {
            sortBy: validatedParams.sortBy,
            sortOrder: validatedParams.sortOrder,
          },
        },
        "Wardrobe items fetched successfully"
      );
    } catch (dbError) {
      return ApiResponseHandler.error(
        dbError instanceof Error ? dbError.message : "Database query failed",
        500
      );
    }
  }
);

/**
 * POST /api/wardrobe
 * 
 * Create a new clothing item with uploaded image
 * 
 * Request Body:
 * - imageId: string (required) - ID of the uploaded Image document
 * - name: string (required) - Name of the clothing item
 * - category: ClothCategory (required) - Category (tops, bottoms, etc.)
 * - tags: string[] (optional) - Array of tags for organization
 * 
 * Response:
 * - 201: Created clothing item with populated image data
 * - 400: Invalid request (missing fields, invalid imageId, image already used)
 * - 401: Not authenticated
 * - 500: Server error
 */
export const POST = asyncHandler(
  async (req: NextRequest): Promise<NextResponse> => {
    // 1. Authenticate user
    const { user, error } = await authenticate(req);
    if (error || !user) {
      return error; // Return 401 if not authenticated
    }

    // 2. Connect to database
    await dbConnect();

    // 3. Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch {
      return ApiResponseHandler.badRequest("Invalid JSON in request body");
    }

    const { imageId, name, category, tags = [] } = body;

    // 4. Validate required fields
    if (!imageId) {
      return ApiResponseHandler.badRequest("imageId is required");
    }
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return ApiResponseHandler.badRequest("name is required and must be a non-empty string");
    }
    if (!category || typeof category !== "string") {
      return ApiResponseHandler.badRequest("category is required");
    }

    // Validate category value
    const validCategories = ["tops", "bottoms", "dresses", "outerwear", "footwear", "accessories"];
    if (!validCategories.includes(category)) {
      return ApiResponseHandler.badRequest(
        `category must be one of: ${validCategories.join(", ")}`
      );
    }

    // Validate imageId is a valid ObjectId
    if (!Types.ObjectId.isValid(imageId)) {
      return ApiResponseHandler.badRequest("Invalid imageId format");
    }

    // Validate tags is an array
    if (!Array.isArray(tags)) {
      return ApiResponseHandler.badRequest("tags must be an array");
    }

    // 5. Verify image exists and belongs to user
    const image = await Image.findOne({
      _id: imageId,
      userId: user.userId,
    });

    if (!image) {
      return ApiResponseHandler.badRequest(
        "Image not found or does not belong to you"
      );
    }

    // 6. Check if image is already used by a clothing item
    const existingCloth = await Cloth.findOne({ imageId });
    if (existingCloth) {
      return ApiResponseHandler.badRequest(
        "This image is already associated with a clothing item"
      );
    }

    // 7. Create clothing item document
    try {
      const cloth = await Cloth.create({
        userId: user.userId,
        imageId: imageId,
        metadata: {
          name: name.trim(),
          category,
          season: [],
        },
        organization: {
          tags: tags.filter((tag: string) => typeof tag === "string" && tag.trim() !== ""),
        },
        usage: {
          wearCount: 0,
          favorite: false,
        },
        status: "active",
      });

      // 8. Populate image data for response
      const populated = await cloth.populate({
        path: "imageId",
        select: IMAGE_PROJECTION,
      });

      // 9. Return created item with 201 status
      return ApiResponseHandler.created(
        populated,
        "Clothing item created successfully"
      );
    } catch (createError) {
      // Handle Mongoose validation errors
      if (createError instanceof Error) {
        return ApiResponseHandler.error(
          `Failed to create clothing item: ${createError.message}`,
          500
        );
      }
      return ApiResponseHandler.error("Failed to create clothing item", 500);
    }
  }
);