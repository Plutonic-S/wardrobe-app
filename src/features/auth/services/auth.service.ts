import User from "@/lib/db/models/User";
import { logger } from "@/lib/logger";
import { assertTrue, assertExists } from "@/lib/middleware/error-handler";
import { signupSchema, loginSchema } from "@/features/auth/validations/auth.schema";
import { signJwt } from "@/features/auth/utils/jwt";
import type { JwtPayload, UserResponse, AuthServiceResult } from "@/features/auth/types/auth.types";

/**
 * Authentication Service
 * Handles all authentication-related business logic
 */
export class AuthService {
  /**
   * Register a new user
   */
  static async signup(data: unknown): Promise<AuthServiceResult> {
    logger.info("Auth service: Starting signup process");

    // Validate input data
    const validatedData = signupSchema.parse(data);

    // Create user (password is auto-hashed by User model pre-save hook)
    const user = await User.create(validatedData);
    logger.auth("User created successfully", { userId: user._id.toString() });

    // Generate JWT token
    const token = signJwt({
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    });

    // Return sanitized user data and token
    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
      token,
    };
  }

  /**
   * Login existing user
   */
  static async login(data: unknown): Promise<AuthServiceResult> {
    logger.info("Auth service: Starting login process");

    // Validate input data
    const { email, password } = loginSchema.parse(data);

    // Find user by email (include password field for verification)
    const user = await User.findOne({ email }).select("+password");
    assertTrue(user, "Invalid email or password", 401);

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    assertTrue(isPasswordValid, "Invalid email or password", 401);

    logger.auth("User login successful", { userId: user._id.toString() });

    // Generate JWT token
    const token = signJwt({
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    });

    // Return sanitized user data and token
    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
      token,
    };
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<UserResponse> {
    logger.info("Auth service: Fetching user by ID", { userId });

    const user = await User.findById(userId);
    assertExists(user, "User not found", 404);

    return {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    };
  }

  /**
   * Get current authenticated user (from JWT payload)
   */
  static async getCurrentUser(jwtPayload: JwtPayload): Promise<UserResponse> {
    logger.info("Auth service: Fetching current user", {
      userId: jwtPayload.userId,
    });

    // Fetch fresh user data from database
    const user = await User.findById(jwtPayload.userId);
    assertExists(user, "User not found", 404);

    return {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    };
  }

  /**
   * Validate if user exists
   */
  static async validateUserExists(userId: string): Promise<boolean> {
    const user = await User.findById(userId);
    return !!user;
  }
}
