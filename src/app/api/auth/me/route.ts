import { AuthService } from "@/features/auth/services/auth.service";
import { ApiResponseHandler } from "@/lib/api-response";
import dbConnect from "@/lib/db/mongoose";
import { logger } from "@/lib/logger";
import { authenticate } from "@/lib/middleware/auth-middleware";
import { asyncHandler, assertExists } from "@/lib/middleware/error-handler";
import { NextRequest, NextResponse } from "next/server";

export const GET = asyncHandler(
  async (req: NextRequest): Promise<NextResponse> => {
    // 1. Create request logger
    const logResponse = logger.createRequestLogger("GET", "/api/auth/me");

    // 2. Authenticate request (extract user from token)
    const { user, error } = await authenticate(req);

    if (error) {
      logResponse(error.status || 500, { reason: "Authentication failed" });
      return error;
    }
    assertExists(user, "Unauthorized", 401);

    // 3. Connect to database
    await dbConnect();

    // 4. Call auth service to get current user data
    const currentUser = await AuthService.getCurrentUser(user);

    // 5. Build response
    const response = ApiResponseHandler.success(
      { user: currentUser },
      "User fetched successfully"
    );

    logResponse(200, { userId: user.userId });
    return response;
  }
);
