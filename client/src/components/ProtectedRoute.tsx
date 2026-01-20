import { ReactNode, useMemo } from 'react';
import { Redirect, useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { UserRole } from '@/data/usersData';
import { Loader2 } from 'lucide-react';
import { isDemoTransitionActive } from '@/_core/demo/demoTransitionStore';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

/**
 * Get user role directly from user object.
 * For demo users, role is embedded in JWT and returned by auth.me directly (farmer, field_officer, manager, supplier).
 * Server normalizes legacy "user" -> "field_officer" and "admin" -> "manager" in auth.me, so client should never see "user".
 * No client-side mapping needed - use server role directly.
 */
function getUserRole(user: any): UserRole | null {
  if (!user || !user.role) return null;
  
  // Role is server-driven and normalized - use it directly
  // Server ensures we never receive role="user" (normalized to "field_officer")
  const role = String(user.role).toLowerCase();
  
  // Validate against known client roles (server-normalized roles)
  if (role === "farmer" || role === "field_officer" || role === "manager" || role === "supplier") {
    return role as UserRole;
  }
  
  // Legacy admin role normalization (should be handled by server, but keep as fallback)
  if (role === "admin") return "manager";
  
  // If we receive "user" here, it's a bug - server should have normalized it
  // But keep fallback for safety
  if (role === "user") {
    // DEV-only: Warn if server normalization didn't work
    if (import.meta.env.DEV) {
      console.warn("[getUserRole] Received role='user' - server should have normalized this");
    }
    return "field_officer";
  }
  
  return null;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP LEVEL
  const [location] = useLocation();
  const { 
    user, 
    loading, 
    isAuthenticated, 
    isAuthenticatedStable, // Use stable auth status to prevent flicker
    isAuthReady,
    isFetching,
  } = useAuth();
  
  // Compute userRole unconditionally (always call useMemo, even if not used)
  const userRole = useMemo(() => getUserRole(user), [user]);
  
  // DEV-only: Check demo transition status (function call, not a hook)
  // Demo transition must never affect production auth flows
  const isInDemoTransition = import.meta.env.DEV && isDemoTransitionActive();

  // Minimal deterministic logic - no localStorage, no polling, no debounce timers
  
  // Step 1: If demo transition is active, show loader (never redirect, never Access Denied)
  if (isInDemoTransition) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Step 2: If auth is loading/fetching, show loader
  if (!isAuthReady || loading || isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Step 3: If settled unauthenticated (not fetching and no user), redirect to login
  // Use isAuthenticatedStable to prevent redirect during refetches (prevents flicker)
  // Only redirect when auth has settled (not fetching) and user is definitively null
  if (!isAuthenticatedStable && !isFetching && isAuthReady) {
    const redirect = encodeURIComponent(location || "/");
    return <Redirect to={`/login?redirect=${redirect}`} />;
  }

  // Step 4: If role not allowed, show Access Denied (only when auth is stable)
  if (allowedRoles?.length) {
    // If role is null and still fetching, show loader
    if (!userRole && isFetching) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    // If role not allowed, show Access Denied
    if (!userRole || !allowedRoles.includes(userRole)) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }
  }

  // Step 5: Render children
  return <>{children}</>;
};
