/**
 * Authentication Types
 * 
 * Centralized type definitions for authentication-related data structures
 */

// ============================================================================
// User Types
// ============================================================================

/**
 * User roles with hierarchical permissions
 */
export enum UserRole {
  USER = "user",
  MODERATOR = "moderator",
  ADMIN = "admin",
  SUPERADMIN = "superadmin",
}

/**
 * Complete user data structure
 */
export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User data returned from API (sanitized, no password)
 */
export interface UserResponse {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: UserRole;
}

/**
 * Minimal user info for JWT payload
 * Used in JWT tokens for authentication
 */
export interface JwtPayload {
  userId: string;
  email: string;
  username: string;
  role: UserRole;
}

// ============================================================================
// Authentication Request Types
// ============================================================================

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Signup data for new user registration
 */
export interface SignupData {
  email: string;
  username: string;
  password: string;
  displayName: string;
}

/**
 * Profile update data (all fields optional)
 */
export interface UpdateProfileData {
  username?: string;
  displayName?: string;
  email?: string;
}

/**
 * Password change data
 */
export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password reset confirmation
 */
export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// ============================================================================
// Authentication Response Types
// ============================================================================

/**
 * Successful authentication response
 */
export interface AuthResponse {
  user: UserResponse;
  token: string;
  message?: string;
}

/**
 * Authentication error response
 */
export interface AuthError {
  message: string;
  code?: string;
  details?: Record<string, string[]>;
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: AuthError;
  message?: string;
}

// ============================================================================
// Authentication State Types (for useAuth hook)
// ============================================================================

/**
 * Authentication state
 */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Authentication context methods
 */
export interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  changePassword: (data: ChangePasswordData) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

// ============================================================================
// Form State Types
// ============================================================================

/**
 * Form field error
 */
export interface FieldError {
  field: string;
  message: string;
}

/**
 * Form submission state
 */
export interface FormState {
  isSubmitting: boolean;
  errors: FieldError[];
  generalError: string | null;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Omit password from user type
 */
export type UserWithoutPassword = Omit<User, "password">;

/**
 * Optional fields for user updates
 */
export type PartialUser = Partial<User>;

/**
 * Authentication result from service layer
 */
export interface AuthServiceResult {
  user: UserResponse;
  token: string;
}
