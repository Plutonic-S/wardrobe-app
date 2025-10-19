import { AuthService } from "@/features/auth/services/auth.service";
import { ApiResponseHandler } from "@/lib/api-response";
import dbConnect from "@/lib/db/mongoose";
import { logger } from "@/lib/logger";
import { asyncHandler } from "@/lib/middleware/error-handler";
import { NextRequest, NextResponse } from "next/server";

export const POST = asyncHandler(
  async (req: NextRequest): Promise<NextResponse> => {
    // 1. Create request logger
    const logResponse = logger.createRequestLogger("POST", "/api/auth/login");

    // 2. Connect to database
    await dbConnect();

    // 3. Parse request body
    const body = await req.json();

    // 4. Call auth service to handle login logic
    const { user, token } = await AuthService.login(body);

    // 5. Create response
    const response = ApiResponseHandler.success(
      { user },
      "Login successful"
    );

    // 6. Set authentication cookie
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    logResponse(200, { email: user.email });
    return response;
  }
);
