// src/app/api/wardrobe/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { authenticate } from "@/lib/middleware/auth-middleware";
import { asyncHandler } from "@/lib/middleware/error-handler";
import { ApiResponseHandler } from "@/lib/api-response";
import dbConnect from "@/lib/db/mongoose";
import Cloth from "@/lib/db/models/Cloth";
import { clothUpdateSchema } from "@/features/wardrobe/validations/wardrobe.schema";
import {
  type PopulatedClothItem,
  type ClothUpdateData,
  CLOTH_PROJECTION,
  IMAGE_PROJECTION,
} from "@/features/wardrobe/types/cloth-api.types";

/* ------------------------------------------------------------------ */
/*  GET – Retrieve single clothing item                               */
/* ------------------------------------------------------------------ */
export const GET = asyncHandler(
  async (
    req: NextRequest,
    { params }: { params: { id: string } }
  ): Promise<NextResponse> => {
    /* 1. Authenticate */
    const { user, error } = await authenticate(req);
    if (error || !user) return error;

    /* 2. Validate ObjectId */
    if (!Types.ObjectId.isValid(params.id)) {
      return ApiResponseHandler.badRequest("Invalid clothing item ID");
    }

    /* 3. Database query with ownership check */
    await dbConnect();

    const item = await Cloth.findOne({
      _id: params.id,
      userId: user.userId, // Ownership check
    })
      .select(CLOTH_PROJECTION)
      .populate({
        path: "imageId",
        select: IMAGE_PROJECTION,
      })
      .lean<PopulatedClothItem>()
      .exec();

    if (!item) {
      return ApiResponseHandler.notFound("Clothing item not found");
    }

    /* 4. Return success */
    return ApiResponseHandler.success(
      item,
      "Clothing item retrieved successfully"
    );
  }
);

/* ------------------------------------------------------------------ */
/*  PATCH – Update clothing item metadata                             */
/* ------------------------------------------------------------------ */
export const PATCH = asyncHandler(
  async (
    req: NextRequest,
    { params }: { params: { id: string } }
  ): Promise<NextResponse> => {
    /* 1. Authenticate */
    const { user, error } = await authenticate(req);
    if (error || !user) return error;

    /* 2. Validate ObjectId */
    if (!Types.ObjectId.isValid(params.id)) {
      return ApiResponseHandler.badRequest("Invalid clothing item ID");
    }

    /* 3. Parse and validate request body */
    const body = await req.json();
    const validation = clothUpdateSchema.safeParse(body);

    if (!validation.success) {
      const messages = validation.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      return ApiResponseHandler.badRequest(messages);
    }

    /* 4. Map flat updates to nested document structure */
    const updateData: ClothUpdateData = {};

    // Metadata updates
    if (validation.data.name !== undefined)
      updateData["metadata.name"] = validation.data.name;
    if (validation.data.category !== undefined)
      updateData["metadata.category"] = validation.data.category;
    if (validation.data.subcategory !== undefined)
      updateData["metadata.subcategory"] = validation.data.subcategory;
    if (validation.data.season !== undefined)
      updateData["metadata.season"] = validation.data.season;
    if (validation.data.styleType !== undefined)
      updateData["metadata.styleType"] = validation.data.styleType;

    // Organization updates
    if (validation.data.tags !== undefined)
      updateData["organization.tags"] = validation.data.tags;
    if (validation.data.brand !== undefined)
      updateData["organization.brand"] = validation.data.brand;
    if (validation.data.purchaseDate !== undefined)
      updateData["organization.purchaseDate"] = new Date(
        validation.data.purchaseDate
      );
    if (validation.data.price !== undefined)
      updateData["organization.price"] = validation.data.price;

    // Usage updates
    if (validation.data.favorite !== undefined)
      updateData["usage.favorite"] = validation.data.favorite;

    // Status update
    if (validation.data.status !== undefined)
      updateData["status"] = validation.data.status;

    /* 5. Atomic update with ownership check */
    await dbConnect();

    const updated = await Cloth.findOneAndUpdate(
      {
        _id: params.id,
        userId: user.userId, // Atomic ownership check
      },
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      }
    )
      .select(CLOTH_PROJECTION)
      .populate({
        path: "imageId",
        select: IMAGE_PROJECTION,
      })
      .lean<PopulatedClothItem>()
      .exec();

    if (!updated) {
      // Differentiate between not found and forbidden
      const exists = await Cloth.exists({ _id: params.id });
      return exists
        ? ApiResponseHandler.forbidden("You do not own this clothing item")
        : ApiResponseHandler.notFound("Clothing item not found");
    }

    /* 6. Return updated item */
    return ApiResponseHandler.success(
      updated,
      "Clothing item updated successfully"
    );
  }
);

/* ------------------------------------------------------------------ */
/*  DELETE – Soft delete clothing item (mark as disposed)             */
/* ------------------------------------------------------------------ */
export const DELETE = asyncHandler(
  async (
    req: NextRequest,
    { params }: { params: { id: string } }
  ): Promise<NextResponse> => {
    /* 1. Authenticate */
    const { user, error } = await authenticate(req);
    if (error || !user) return error;

    /* 2. Validate ObjectId */
    if (!Types.ObjectId.isValid(params.id)) {
      return ApiResponseHandler.badRequest("Invalid clothing item ID");
    }

    /* 3. Soft delete with ownership check */
    await dbConnect();

    const deleted = await Cloth.findOneAndUpdate(
      {
        _id: params.id,
        userId: user.userId, // Ownership check
        status: { $ne: "disposed" }, // Prevent duplicate deletions
      },
      { $set: { status: "disposed" } },
      { new: true }
    )
      .select("_id status")
      .lean();

    if (!deleted) {
      // Check if item exists but is already deleted or doesn't belong to user
      const item = await Cloth.findById(params.id).select("userId status").lean();
      
      if (!item) {
        return ApiResponseHandler.notFound("Clothing item not found");
      }
      
      if (item.status === "disposed") {
        return ApiResponseHandler.badRequest("Clothing item already deleted");
      }
      
      return ApiResponseHandler.forbidden("You do not own this clothing item");
    }

    /* 4. Return success */
    return ApiResponseHandler.success(
      {
        id: params.id,
        deleted: true,
        status: "disposed",
      },
      "Clothing item deleted successfully"
    );
  }
);