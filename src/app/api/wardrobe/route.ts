import { ApiResponseHandler } from "@/lib/api-response";
import Cloth from "@/lib/db/models/Cloth";
import dbConnect from "@/lib/db/mongoose";
import { authenticate } from "@/lib/middleware/auth-middleware";
import { asyncHandler } from "@/lib/middleware/error-handler";
import { NextRequest, NextResponse } from "next/server";
import { wardrobeQuerySchema } from "@/features/wardrobe/validations/wardrobe.schema";
import { ZodError } from "zod";

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
      validatedParams = wardrobeQuerySchema.parse({
        category: searchParams.get("category"),
        season: searchParams.get("season"),
        favorite: searchParams.get("favorite"),
        tags: searchParams.get("tags"),
        search: searchParams.get("search"),
        status: searchParams.get("status"),
        page: searchParams.get("page"),
        limit: searchParams.get("limit"),
        sortBy: searchParams.get("sortBy"),
        sortOrder: searchParams.get("sortOrder"),
      });
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
          items,
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