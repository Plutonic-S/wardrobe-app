// src/app/api/outfits/list/route.ts
// Lightweight endpoint for fetching outfit summaries (id, name, previewImage, mode)
// Used by calendar selector modal for fast loading

import { NextRequest, NextResponse } from 'next/server';
import Outfit from '@/lib/db/models/Outfit';
import dbConnect from '@/lib/db/mongoose';
import { ApiResponseHandler } from '@/lib/api-response';
import { authenticate } from '@/lib/middleware/auth-middleware';
import { asyncHandler } from '@/lib/middleware/error-handler';

// ============================================================================
// GET /api/outfits/list - Get lightweight outfit list (no cloth population)
// ============================================================================

export const GET = asyncHandler(
  async (req: NextRequest): Promise<NextResponse> => {
    // Authenticate user
    const { user, error } = await authenticate(req);
    if (error || !user) {
      return error;
    }

    const userId = user.userId;

    // Connect to database
    await dbConnect();

    // Parse query parameters for optional filtering
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode');
    const favorite = searchParams.get('favorite');
    const status = searchParams.get('status');

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = { userId };

    if (mode) {
      query.mode = mode;
    }

    if (favorite === 'true') {
      query['usage.favorite'] = true;
    }

    if (status) {
      query.status = status;
    } else {
      // Default: only show active outfits
      query.status = 'active';
    }

    // Fetch only essential fields - no population needed
    const outfits = await Outfit.find(query)
      .select('_id metadata.name previewImage mode usage.favorite createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // Transform to consistent response format
    const outfitList = outfits.map((outfit) => ({
      id: outfit._id.toString(),
      name: outfit.metadata?.name || 'Unnamed Outfit',
      previewImage: outfit.previewImage || null,
      mode: outfit.mode,
      favorite: outfit.usage?.favorite || false,
    }));

    return ApiResponseHandler.success(
      { outfits: outfitList },
      'Outfit list fetched successfully'
    );
  }
);
