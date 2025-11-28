"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { UserRole } from "@/features/auth/types/auth.types";
import { clientLogger } from "@/lib/client-logger";

/**
 * AuthGuard Props
 */
interface AuthGuardProps {
  children: React.ReactNode;
  /** Require authentication to access this route */
  requireAuth?: boolean;
  /** Redirect unauthenticated users to this path */
  redirectTo?: string;
  /** Required role(s) to access this route */
  requiredRole?: UserRole | UserRole[];
  /** Fallback component while checking auth */
  fallback?: React.ReactNode;
}

/**
 * AuthGuard Component
 * 
 * Protects routes by checking authentication status and user roles.
 * 
 * @example
 * ```tsx
 * // Protect a route (require login)
 * <AuthGuard requireAuth>
 *   <DashboardPage />
 * </AuthGuard>
 * 
 * // Require specific role
 * <AuthGuard requireAuth requiredRole={UserRole.ADMIN}>
 *   <AdminPanel />
 * </AuthGuard>
 * 
 * // Require multiple roles (any of them)
 * <AuthGuard requireAuth requiredRole={[UserRole.ADMIN, UserRole.MODERATOR]}>
 *   <ModeratorPanel />
 * </AuthGuard>
 * 
 * // Custom redirect
 * <AuthGuard requireAuth redirectTo="/custom-login">
 *   <ProtectedContent />
 * </AuthGuard>
 * 
 * // Custom fallback
 * <AuthGuard requireAuth fallback={<CustomLoader />}>
 *   <ProtectedContent />
 * </AuthGuard>
 * ```
 */
export function AuthGuard({
  children,
  requireAuth = false,
  redirectTo = "/login",
  requiredRole,
  fallback,
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, checkAuth } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      // Check authentication status on mount
      await checkAuth();
      setIsChecking(false);
    };

    verifyAuth();
  }, [checkAuth]);

  useEffect(() => {
    // Don't do anything while still checking
    if (isChecking || isLoading) {
      return;
    }

    // If auth is required but user is not authenticated
    if (requireAuth && !isAuthenticated) {
      clientLogger.warn("AuthGuard: Unauthenticated access attempt", {
        pathname,
        redirectTo,
      });

      // Store the attempted URL for redirect after login
      if (typeof window !== "undefined") {
        sessionStorage.setItem("redirectAfterLogin", pathname);
      }

      router.push(redirectTo);
      return;
    }

    // If role is required, check if user has the required role
    if (requireAuth && isAuthenticated && requiredRole && user) {
      const hasRequiredRole = Array.isArray(requiredRole)
        ? requiredRole.includes(user.role)
        : user.role === requiredRole;

      if (!hasRequiredRole) {
        clientLogger.warn("AuthGuard: Insufficient permissions", {
          pathname,
          userRole: user.role,
          requiredRole,
        });

        // Redirect to wardrobe or unauthorized page
        router.push("/wardrobe");
        return;
      }
    }
  }, [
    isChecking,
    isLoading,
    requireAuth,
    isAuthenticated,
    requiredRole,
    user,
    pathname,
    redirectTo,
    router,
  ]);

  // Show fallback while checking authentication
  if (isChecking || isLoading) {
    if (fallback) {
      return <>{fallback}</>;
    }

    // Default loading state
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If auth is required but user is not authenticated, don't render children
  // (redirect will happen in useEffect)
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // If role is required and user doesn't have it, don't render children
  if (requireAuth && isAuthenticated && requiredRole && user) {
    const hasRequiredRole = Array.isArray(requiredRole)
      ? requiredRole.includes(user.role)
      : user.role === requiredRole;

    if (!hasRequiredRole) {
      return null;
    }
  }

  // All checks passed, render children
  return <>{children}</>;
}

/**
 * Hook version of AuthGuard for more control
 * 
 * @example
 * ```tsx
 * function ProtectedPage() {
 *   const { isAuthorized, isChecking } = useAuthGuard({
 *     requireAuth: true,
 *     requiredRole: UserRole.ADMIN,
 *   });
 * 
 *   if (isChecking) return <Loader />;
 *   if (!isAuthorized) return null;
 * 
 *   return <div>Protected Content</div>;
 * }
 * ```
 */
export function useAuthGuard({
  requireAuth = false,
  redirectTo = "/login",
  requiredRole,
}: Omit<AuthGuardProps, "children" | "fallback">) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, checkAuth } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      await checkAuth();
      setIsChecking(false);
    };

    verifyAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isChecking || isLoading) {
      setIsAuthorized(false);
      return;
    }

    // Check authentication
    if (requireAuth && !isAuthenticated) {
      setIsAuthorized(false);

      clientLogger.warn("useAuthGuard: Unauthenticated access attempt", {
        pathname,
        redirectTo,
      });

      if (typeof window !== "undefined") {
        sessionStorage.setItem("redirectAfterLogin", pathname);
      }

      router.push(redirectTo);
      return;
    }

    // Check role
    if (requireAuth && isAuthenticated && requiredRole && user) {
      const hasRequiredRole = Array.isArray(requiredRole)
        ? requiredRole.includes(user.role)
        : user.role === requiredRole;

      setIsAuthorized(hasRequiredRole);

      if (!hasRequiredRole) {
        clientLogger.warn("useAuthGuard: Insufficient permissions", {
          pathname,
          userRole: user.role,
          requiredRole,
        });

        router.push("/wardrobe");
        return;
      }
    } else {
      setIsAuthorized(true);
    }
  }, [
    isChecking,
    isLoading,
    requireAuth,
    isAuthenticated,
    requiredRole,
    user,
    pathname,
    redirectTo,
    router,
  ]);

  return {
    isAuthorized,
    isChecking: isChecking || isLoading,
    user,
    isAuthenticated,
  };
}
