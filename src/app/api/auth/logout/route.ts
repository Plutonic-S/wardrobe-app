import { ApiResponseHandler } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { asyncHandler } from "@/lib/middleware/error-handler";
import { NextResponse } from "next/server";

export const POST = asyncHandler(async (): Promise<NextResponse> => {
  // 1. Create request logger
  const logResponse = logger.createRequestLogger("POST", "/api/auth/logout");

  // 2. Create response
  const response = ApiResponseHandler.success(
    { message: "Logged out successfully" },
    "Logout successful"
  );

  // 3. Clear authentication cookie
  response.cookies.delete("auth_token");

  logResponse(200);
  return response;
});