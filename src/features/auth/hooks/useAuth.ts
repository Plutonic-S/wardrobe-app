"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clientLogger } from "@/lib/client-logger";
import type { 
  UserResponse, 
  SignupData, 
  LoginCredentials,
  ApiResponse 
} from "@/features/auth/types/auth.types";

/**
 * Auth store state interface
 */
interface AuthState {
  // State
  user: UserResponse | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  // Computed
  isAuthenticated: boolean;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  setUser: (user: UserResponse, token: string) => void;
}

/**
 * Auth store using Zustand with persistence
 * 
 * Features:
 * - Persistent storage (survives page refreshes)
 * - Automatic token management
 * - Centralized error handling
 * - Type-safe state management
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      token: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,

      /**
       * Login user with email and password
       * 
       * @param credentials - Login credentials (email, password)
       * @throws Error if login fails
       */
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });

        try {
          clientLogger.info("Auth: Attempting login", { email: credentials.email });

          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include", // Include httpOnly cookies
            body: JSON.stringify(credentials),
          });

          const data: ApiResponse<{ user: UserResponse; token: string }> = await response.json();

          if (!response.ok || !data.success || !data.data) {
            throw new Error(data.message || "Login failed");
          }

          const { user } = data.data;

          set({
            user,
            token: "cookie", // Real token is in httpOnly cookie
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          clientLogger.info("Auth: Login successful", { userId: user.id });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Login failed";

          clientLogger.error("Auth: Login failed", error);

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      /**
       * Register new user
       * 
       * @param data - Signup data (username, email, password)
       * @throws Error if signup fails
       */
      signup: async (data: SignupData) => {
        set({ isLoading: true, error: null });

        try {
          clientLogger.info("Auth: Attempting signup", { email: data.email });

          const response = await fetch("/api/auth/signup", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include", // Include httpOnly cookies
            body: JSON.stringify(data),
          });

          const responseData: ApiResponse<{ user: UserResponse; token: string }> = await response.json();

          if (!response.ok || !responseData.success || !responseData.data) {
            throw new Error(responseData.message || "Signup failed");
          }

          const { user } = responseData.data;

          set({
            user,
            token: "cookie", // Real token is in httpOnly cookie
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          clientLogger.info("Auth: Signup successful", { userId: user.id });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Signup failed";

          clientLogger.error("Auth: Signup failed", error);

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      /**
       * Logout user
       * Clears both client and server-side session
       */
      logout: async () => {
        try {
          clientLogger.info("Auth: Attempting logout");

          // Call logout API to clear server-side session/cookie
          await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include",
          });

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });

          // Clear token cookie on client side
          document.cookie =
            "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";

          clientLogger.info("Auth: Logout successful");
        } catch (error) {
          clientLogger.error("Auth: Logout failed", error);

          // Still clear local state even if API call fails
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      /**
       * Check authentication status and verify token
       * Should be called on app initialization
       * Note: Relies on httpOnly cookie set by the server
       */
      checkAuth: async () => {
        set({ isLoading: true });

        try {
          clientLogger.debug("Auth: Verifying authentication");

          // Call /api/auth/me which will check the httpOnly cookie
          const response = await fetch("/api/auth/me", {
            credentials: "include", // Important: sends httpOnly cookies
          });

          if (!response.ok) {
            throw new Error("Token verification failed");
          }

          const data: ApiResponse<{ user: UserResponse }> = await response.json();

          if (data.success && data.data?.user) {
            // Token is valid, update state with user data
            set({
              user: data.data.user,
              token: "cookie", // Placeholder since real token is in httpOnly cookie
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            clientLogger.debug("Auth: Authentication verified", { userId: data.data.user.id });
          } else {
            throw new Error("Invalid token response");
          }
        } catch (error) {
          clientLogger.debug("Auth: Not authenticated", error);

          // Clear state if verification fails
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Set user manually (used after successful auth)
       * 
       * @param user - User data
       * @param token - JWT token
       */
      setUser: (user: UserResponse, token: string) => {
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);

/**
 * Hook to access auth state and actions
 * 
 * @example
 * ```tsx
 * const { user, login, logout, isAuthenticated, isLoading, error } = useAuth();
 * 
 * // Login
 * const handleLogin = async () => {
 *   try {
 *     await login({ email, password });
 *     router.push('/dashboard');
 *   } catch (error) {
 *     // Error is already set in state
 *     console.error('Login failed:', error);
 *   }
 * };
 * 
 * // Signup
 * const handleSignup = async () => {
 *   try {
 *     await signup({ username, email, password });
 *     router.push('/dashboard');
 *   } catch (error) {
 *     console.error('Signup failed:', error);
 *   }
 * };
 * 
 * // Logout
 * const handleLogout = async () => {
 *   await logout();
 *   router.push('/login');
 * };
 * 
 * // Check auth on mount
 * useEffect(() => {
 *   checkAuth();
 * }, [checkAuth]);
 * 
 * // Display user info
 * {isAuthenticated && <p>Welcome, {user?.username}!</p>}
 * 
 * // Show loading state
 * {isLoading && <Spinner />}
 * 
 * // Show error
 * {error && <Alert>{error}</Alert>}
 * ```
 */
export function useAuth() {
  return useAuthStore();
}
