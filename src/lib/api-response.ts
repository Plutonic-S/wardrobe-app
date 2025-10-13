import { NextResponse } from "next/server";

interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export class ApiResponseHandler {
  static success<T>(data: T, message?: string, status = 200) {
    return NextResponse.json(
      {
        success: true,
        data,
        message,
      } as ApiSuccessResponse<T>,
      { status }
    );
  }
  static error(
    message: string,
    status = 500,
    code?: string,
    details?: unknown
  ) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message,
          code,
          details,
        },
      } as ApiErrorResponse,
      { status }
    );
  }

  static created<T>(data: T, message = "Resource created successfully") {
    return this.success(data, message, 201);
  }

  static badRequest(message = "Bad request", details?: unknown) {
    return this.error(message, 400, "BAD_REQUEST", details);
  }

  static unauthorized(message = "Unauthorized") {
    return this.error(message, 401, "UNAUTHORIZED");
  }

  static forbidden(message = "Forbidden") {
    return this.error(message, 403, "FORBIDDEN");
  }

  static notFound(message = "Resource not found") {
    return this.error(message, 404, "NOT_FOUND");
  }

  static conflict(message = "Resource already exists") {
    return this.error(message, 409, "CONFLICT");
  }

  static internal(message = "Internal server error") {
    return this.error(message, 500, "INTERNAL_ERROR");
  }
}
