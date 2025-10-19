import { extractTokenFromHeader, verifyJwt } from "@/features/auth/utils/jwt";
import type { JwtPayload } from "@/features/auth/types/auth.types";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "../logger";
import { ApiResponseHandler } from "../api-response";

export interface AuthRequest extends NextRequest {
  user: JwtPayload;
}

function extractToken(req: NextRequest): string | null {
  // 1. Check token from the cookies
  const tokenFromCookie = req.cookies.get("auth_token")?.value || null;
  if (tokenFromCookie) {
    logger.debug("Token extracted from cookie");
    return tokenFromCookie;
  }
  // 2. Check token from the Authorization header
  const authHeader = req.headers.get("Authorization");
  const tokenFromHeader = extractTokenFromHeader(authHeader);
  if (tokenFromHeader) {
    logger.debug("Token extracted from Authorization header");
    return tokenFromHeader;
  }

  logger.warn("No auth token found in request");
  return null;
}

export async function authenticate(
  req: NextRequest
): Promise<
  { user: JwtPayload; error: null } | { user: null; error: NextResponse }
> {
  try {
    const token = extractToken(req);

    if (!token) {
      logger.warn("Authentication failed: No token provided");
      return {
        user: null,
        error: ApiResponseHandler.unauthorized("Authentication required"),
      };
    }

    const decoded = verifyJwt(token);

    if (!decoded) {
      logger.warn("Authentication failed: Invalid token");
      return {
        user: null,
        error: ApiResponseHandler.unauthorized("Invalid token"),
      };
    }

    logger.info("User authenticated successfully", {
      userId: decoded.userId,
      email: decoded.email,
    });

    return { user: decoded, error: null };
  } catch (error) {
    logger.error("Authentication failed", error);

    if (error instanceof Error) {
      if (error.message === "Token expired") {
        return {
          user: null,
          error: ApiResponseHandler.unauthorized(
            "Token expired, please login again"
          ),
        };
      }

      if (error.message === "Invalid token") {
        return {
          user: null,
          error: ApiResponseHandler.unauthorized("Invalid token"),
        };
      }
    }

    return {
      user: null,
      error: ApiResponseHandler.unauthorized("Authentication failed"),
    };
  }
}

export async function optionalAuth(
  req: NextRequest
): Promise<JwtPayload | null> {
  try {
    const token = extractToken(req);
    if (!token) {
      return null;
    }

    const decoded = verifyJwt(token);

    if (!decoded) {
      logger.debug("Optional auth: Invalid token");
      return null;
    }

    logger.debug("Optional auth: User authenticated", {
      userId: decoded.userId,
    });
    return decoded;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    logger.debug("Optional auth: No valid token");
    return null;
  }
}

export function hasRole(
  user: JwtPayload,
  allowedRoles: JwtPayload["role"] | JwtPayload["role"][]
): boolean {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  // Role hierarchy: superadmin > admin > moderator > user
  const roleHierarchy: Record<JwtPayload["role"], number> = {
    superadmin: 4,
    admin: 3,
    moderator: 2,
    user: 1,
  };

  const userRoleLevel = roleHierarchy[user.role];
  const requiredLevel = Math.min(...roles.map((r) => roleHierarchy[r]));

  return userRoleLevel >= requiredLevel;
}
