import { ReactNode, useMemo, useEffect, useState, useRef } from 'react';
import React from 'react';
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
 * No client-side mapping or localStorage overrides needed.
 */
function getUserRole(user: any): UserRole | null {
  if (!user || !user.role) return null;
  
  // Role is now server-driven via JWT - use it directly
  const role = String(user.role).toLowerCase();
  
  // Validate against known client roles
  if (role === "farmer" || role === "field_officer" || role === "manager" || role === "supplier" || role === "admin") {
    return role as UserRole;
  }
  
  // Fallback: try to map legacy server roles (user/admin) if present
  // This should not happen for demo users, but keep for backward compatibility
  if (role === "admin") return "manager";
  if (role === "user") return "field_officer"; // Default for legacy "user" role
  
  return null;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const [location] = useLocation();
  const { 
    user, 
    loading, 
    isAuthenticated, 
    isAuthReady,
    isFetching, // Exposed from useAuth to check if auth.me is fetching
    demoSessionPresent,
    isInDemoGraceWindow,
    isInRoleSwitchWindow
  } = useAuth();
  
  // Debounced redirect state: track when unauthenticated state started
  const [unauthSince, setUnauthSince] = useState<number | null>(null);
  const [redirectNow, setRedirectNow] = useState(false);
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Debounce redirect: wait 800-1500ms in DEV, 200ms in PROD before redirecting
  const debounceDelay = import.meta.env.DEV ? 1200 : 200;
  
  // Effect to handle debounced redirect logic
  useEffect(() => {
    // Clear any existing timer
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
    
    // Conditions for starting redirect debounce:
    // - Auth is ready
    // - Not loading
    // - Not fetching
    // - Not authenticated
    // - No demo session markers (DEV only)
    // - Not in grace/role switch windows (DEV only)
    const shouldStartDebounce = isAuthReady && 
      !loading && 
      !isFetching && 
      !isAuthenticated && 
      !demoSessionPresent && 
      !isInDemoGraceWindow && 
      !isInRoleSwitchWindow &&
      !(import.meta.env.DEV && isDemoTransitionActive());
    
    if (shouldStartDebounce) {
      // Start debounce timer
      const now = Date.now();
      if (unauthSince === null) {
        setUnauthSince(now);
      }
      
      // Set timer to trigger redirect after debounce delay
      redirectTimerRef.current = setTimeout(() => {
        // Double-check conditions before redirecting
        if (isAuthReady && !loading && !isFetching && !isAuthenticated) {
          // DEV-only: Log redirect with context
          if (import.meta.env.DEV) {
            const userRole = getUserRole(user);
            console.warn("[Auth] Redirecting to /login (debounced)", {
              isAuthReady,
              loading,
              isFetching,
              isAuthenticated,
              role: userRole,
              path: location,
            });
          }
          setRedirectNow(true);
        }
      }, debounceDelay);
    } else {
      // Auth state changed - cancel debounce and reset state
      setUnauthSince(null);
      setRedirectNow(false);
    }
    
    // Cleanup: clear timer on unmount or when conditions change
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    };
  }, [
    isAuthReady,
    loading,
    isFetching,
    isAuthenticated,
    demoSessionPresent,
    isInDemoGraceWindow,
    isInRoleSwitchWindow,
    unauthSince,
    debounceDelay,
    location,
    user,
  ]);
  
  // DEV-only: Check localStorage directly as fallback
  const demoSessionPresentFallback = typeof window !== "undefined" && import.meta.env.DEV
    ? localStorage.getItem('demo_session_present') === '1'
    : false;
  
  const hasDemoSession = demoSessionPresent || demoSessionPresentFallback;

  // DEV-only: Check role switch window from localStorage as fallback
  const isInRoleSwitchWindowFallback = typeof window !== "undefined" && import.meta.env.DEV
    ? (() => {
        try {
          const stored = localStorage.getItem('demo_role_switch_end');
          if (stored) {
            return Date.now() < parseInt(stored, 10);
          }
        } catch (e) {
          // localStorage not available
        }
        return false;
      })()
    : false;
  
  const inRoleSwitchWindow = isInRoleSwitchWindow || isInRoleSwitchWindowFallback;

  // DEV-only: Check if demo session was just set (within last 500ms)
  // This prevents flicker when navigating immediately after login
  const [justLoggedIn, setJustLoggedIn] = React.useState(() => {
    if (typeof window === "undefined" || import.meta.env.PROD) return false;
    try {
      const graceEnd = localStorage.getItem('demo_grace_window_end');
      if (graceEnd) {
        const timeLeft = parseInt(graceEnd, 10) - Date.now();
        // If grace window has more than 2.5 seconds left, we just logged in
        return timeLeft > 2500;
      }
    } catch (e) {
      // localStorage not available
    }
    return false;
  });

  React.useEffect(() => {
    if (!import.meta.env.DEV || typeof window === "undefined") return;
    
    const checkJustLoggedIn = () => {
      try {
        const graceEnd = localStorage.getItem('demo_grace_window_end');
        if (graceEnd) {
          const timeLeft = parseInt(graceEnd, 10) - Date.now();
          setJustLoggedIn(timeLeft > 2500);
        } else {
          setJustLoggedIn(false);
        }
      } catch (e) {
        // localStorage not available
      }
    };

    checkJustLoggedIn();
    const interval = setInterval(checkJustLoggedIn, 100);
    return () => clearInterval(interval);
  }, []);

  // DEV-ONLY: During demo transitions, show loader (never redirect, never Access Denied)
  // Check this FIRST before any auth/role evaluation to prevent flicker
  const isInDemoTransition = import.meta.env.DEV && isDemoTransitionActive();
  if (isInDemoTransition) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Auth readiness gate: NEVER redirect while auth is still resolving OR fetching
  // This prevents flicker/redirect loops when switching demo accounts
  // CRITICAL: Check isFetching explicitly to prevent redirects during ANY fetch (initial load OR refetch)
  if (!isAuthReady || loading || isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // DEV-only: During role switch window, show loader instead of redirecting or showing Access Denied
  if (inRoleSwitchWindow) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // DEV-only: If we just logged in (within last 500ms), show loader to prevent flicker
  if (import.meta.env.DEV && justLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Debounced redirect: only redirect after debounce timer fires
  // During debounce window, show loader instead of redirecting
  if (redirectNow) {
    return <Redirect to="/login" />;
  }
  
  // If debounce is active (unauthSince is set but redirectNow is false), show loader
  if (unauthSince !== null && !redirectNow) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Role-based access control
  // Use role directly from user object (server-driven via JWT for demo users)
  // CRITICAL: Only show "Access Denied" when auth is stable (not loading/fetching)
  const userRole = useMemo(() => getUserRole(user), [user]);
  if (allowedRoles && userRole) {
    const hasAccess = allowedRoles.includes(userRole);
    
    // CRITICAL: If loading/fetching, show loader instead of Access Denied (prevents flicker during refetches)
    if (!hasAccess && (loading || isFetching)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    // DEV-only: Never show Access Denied if demo session is present or during transition
    const demoBypass = import.meta.env.DEV && (hasDemoSession || isInDemoTransition);
    
    // During role switch window or demo transition, show loader instead of Access Denied
    if (!hasAccess && (inRoleSwitchWindow || isInDemoTransition)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    // Only show "Access Denied" when auth is stable: isAuthReady && !loading && !isFetching && isAuthenticated === true
    if (!hasAccess && !demoBypass && isAuthReady && !loading && !isFetching && isAuthenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }
    
    // If no access but still loading/fetching, show loader (handled above, but keep as fallback)
    if (!hasAccess && (loading || isFetching)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
  }

  return <>{children}</>;
};
