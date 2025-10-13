import jwt from "jsonwebtoken";
import { logger } from "../../../lib/logger";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || ("7d" as string);

if (!JWT_SECRET) throw new Error("Please add JWT_SECRET to your environment");
if (!JWT_EXPIRES_IN)
  throw new Error("Please add JWT_EXPIRES_IN to your environment");

export interface JwtPayload {
  userId: string;
  email: string;
  username: string;
  role: "user" | "moderator" | "admin" | "superadmin";
}

export function signJwt(payload: JwtPayload): string {
  try {
    const token = jwt.sign(payload, JWT_SECRET as string, {
      expiresIn: "7d",
    });
    logger.auth("JWT signed", {
      userId: payload.userId,
      username: payload.username,
    });
    return token;
  } catch (error) {
    logger.error("Error signing JWT", { error });
    throw new Error("Error signing JWT");
  }
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as JwtPayload;
    logger.debug("JWT token verified", { userId: decoded.userId });
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn("JWT token expired");
      throw new Error("Token expired");
    }

    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn("Invalid JWT token");
      throw new Error("Invalid token");
    }

    logger.error("Failed to verify JWT token", error);
    throw new Error("Token verification failed");
  }
}


export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  // Support "Bearer <token>" format
  const parts = authHeader.split(" ");
  if (parts.length === 2 && parts[0] === "Bearer") {
    return parts[1];
  }

  // Support direct token (no "Bearer" prefix)
  return authHeader;
}


export function decodeToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.decode(token) as JwtPayload;
    return decoded;
  } catch (error) {
    logger.error("Failed to decode JWT token", error);
    return null;
  }
}