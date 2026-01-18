import { ReactNode, useMemo } from 'react';
import React from 'react';
import { Redirect } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { UserRole } from '@/data/usersData';
import { Loader2 } from 'lucide-react';
import { isDemoTransitionActive } from '@/_core/demo/demoTransitionStore';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

/**
 * Maps server role ('user' | 'admin') to client role for demo accounts.
 * Uses localStorage demo_role_override if available (for demo account switching).
 */
function getClientRole(user: any): UserRole | null {
  if (!user) return null;
  
  // Check localStorage demo role override first (for demo account switching)
  try {
    const override = localStorage.getItem("demo_role_override");
    if (override) {
      const overrideLower = override.trim().toLowerCase();
      if (overrideLower.includes("farmer")) return "farmer";
      if (overrideLower.includes("field_officer") || overrideLower.includes("officer")) return "field_officer";
      if (overrideLower.includes("manager")) return "manager";
      if (overrideLower.includes("supplier")) return "supplier";
      if (overrideLower.includes("admin")) return "admin";
    }
  } catch (e) {
    // localStorage may not be available
  }
  
  // Map server role to client role
  // Server has 'user' | 'admin', client has 'farmer' | 'manager' | 'field_officer' | 'supplier' | 'admin'
  const serverRole = user.role?.toLowerCase();
  if (serverRole === "admin") return "manager"; // admin maps to manager
  if (serverRole === "user") {
    // For 'user', check email or other hints to determine if farmer or field_officer
    // Default to field_officer for staff users
    return "field_officer";
  }
  
  // Fallback: try to extract from user object directly
  const roleStr = String(user.role || "").toLowerCase();
  if (roleStr.includes("farmer")) return "farmer";
  if (roleStr.includes("manager") || roleStr.includes("admin")) return "manager";
  if (roleStr.includes("officer")) return "field_officer";
  if (roleStr.includes("supplier")) return "supplier";
  
  return null;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { 
    user, 
    loading, 
    isAuthenticated, 
    isAuthReady,
    demoSessionPresent,
    isInDemoGraceWindow,
    isInRoleSwitchWindow
  } = useAuth();
  
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

  // Auth readiness gate: NEVER redirect while auth is still resolving
  // This prevents flicker/redirect loops when switching demo accounts
  // Note: loading already includes isRefetching from useAuth hook
  if (!isAuthReady || loading) {
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

  // Only redirect to login if ALL of these are true:
  // 1. Auth is ready
  // 2. Loading is false
  // 3. User is not authenticated
  // 4. No demo session marker exists (DEV only)
  // 5. Not in grace window (DEV only)
  // 6. Not in role switch window (DEV only)
  // 7. Not just logged in (DEV only)
  // 8. Not in demo transition (DEV only)
  // This prevents flicker during demo account switching
  const shouldRedirect = isAuthReady && 
    !loading &&
    !isAuthenticated && 
    !hasDemoSession && 
    !isInDemoGraceWindow &&
    !inRoleSwitchWindow &&
    !(import.meta.env.DEV && justLoggedIn) &&
    !isInDemoTransition;

  if (shouldRedirect) {
    return <Redirect to="/login" />;
  }

  // Role-based access control
  // DEV-only: Bypass allowedRoles check if demo session is present (demo-safe)
  const clientRole = useMemo(() => getClientRole(user), [user]);
  if (allowedRoles && clientRole) {
    const hasAccess = allowedRoles.includes(clientRole);
    
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
    
    // DEV-only: Bypass role check if demo session is present or during transition
    if (!hasAccess && !demoBypass) {
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

  return <>{children}</>;
};
