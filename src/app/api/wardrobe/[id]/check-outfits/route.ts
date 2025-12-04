// src/app/api/wardrobe/[id]/check-outfits/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { authenticate } from "@/lib/middleware/auth-middleware";
import { asyncHandler } from "@/lib/middleware/error-handler";
import { ApiResponseHandler } from "@/lib/api-response";
import dbConnect from "@/lib/db/mongoose";
import Outfit from "@/lib/db/models/Outfit";

/* ------------------------------------------------------------------ */
/*  GET – Check which outfits contain this clothing item              */
/* ------------------------------------------------------------------ */
export const GET = asyncHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ): Promise<NextResponse> => {
    /* 1. Authenticate */
    const { user, error } = await authenticate(req);
    if (error || !user) return error;

    /* 2. Await params and validate ObjectId */
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return ApiResponseHandler.badRequest("Invalid clothing item ID");
    }

    /* 3. Find all outfits containing this item */
    await dbConnect();
    
    const clothIdObj = new Types.ObjectId(id);
    
    // Query for both dress-me and canvas mode outfits
    const affectedOutfits = await Outfit.find({
      userId: user.userId,
      status: { $ne: "deleted" },
      $or: [
        { "combination.items.tops": clothIdObj },
        { "combination.items.outerwear": clothIdObj },
        { "combination.items.bottoms": clothIdObj },
        { "combination.items.dresses": clothIdObj },
        { "combination.items.footwear": clothIdObj },
        { "combination.items.accessories": clothIdObj },
        { "canvasState.items.clothItemId": clothIdObj },
      ],
    })
      .select("_id metadata.name mode previewImage.url")
      .lean();

    /* 4. Return results */
    return ApiResponseHandler.success({
      count: affectedOutfits.length,
      outfits: affectedOutfits.map(outfit => ({
        id: outfit._id.toString(),
        name: outfit.metadata?.name || "Unnamed Outfit",
        mode: outfit.mode,
        previewUrl: outfit.previewImage?.url || null,
      })),
    });
  }
);
