import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { isDemoTransitionActive } from "@/_core/demo/demoTransitionStore";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  // Safely get login URL with fallback - never throw during render
  let defaultRedirectPath = "/login";
  try {
    const loginUrl = getLoginUrl();
    if (loginUrl && typeof loginUrl === "string") {
      defaultRedirectPath = loginUrl;
    }
  } catch (error) {
    // getLoginUrl should never throw after our fix, but guard anyway
    if (import.meta.env.DEV) {
      console.warn("[useAuth] getLoginUrl threw (should not happen), using /login fallback", error);
    }
  }

  const { redirectOnUnauthenticated = false, redirectPath = defaultRedirectPath } =
    options ?? {};
  const utils = trpc.useUtils();

  // Stable query key - never changes, prevents query recreation
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: 0, // No retries to avoid long hangs
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 5000, // Keep data fresh for 5 seconds (reduced from 30s to reduce churn)
    gcTime: 300000, // Keep in cache for 5 minutes
    placeholderData: (prev) => prev, // CRITICAL: Preserve previous user data during refetches to prevent flicker
    // Ensure data is not cleared on refetch (keepPreviousData equivalent)
    refetchOnMount: true,
  });

  // Auth readiness: true after FIRST auth.me attempt completes (success or failure)
  // Once ready, stays ready even if refetches happen
  const [hasCompletedFirstAuth, setHasCompletedFirstAuth] = useState(false);
  
  useEffect(() => {
    // Mark as completed once first query finishes (not loading/refetching and has result or error)
    // Don't mark ready during refetches - only on initial load completion
    if (!meQuery.isLoading && !meQuery.isRefetching && !hasCompletedFirstAuth) {
      if (meQuery.data !== undefined || meQuery.error !== undefined) {
        setHasCompletedFirstAuth(true);
        if (import.meta.env.DEV) {
          console.log("[Auth] DEV: First auth.me completed → isAuthReady = true");
        }
      }
    }
  }, [meQuery.isLoading, meQuery.isRefetching, meQuery.data, meQuery.error, hasCompletedFirstAuth]);
  
  const isAuthReady = hasCompletedFirstAuth;

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      // Clear demo session markers on logout
      if (import.meta.env.DEV && typeof window !== "undefined") {
        try {
          localStorage.removeItem('demo_session_present');
          localStorage.removeItem('demo_grace_window_end');
          localStorage.removeItem('demo_role_switch_end');
        } catch (e) {
          // localStorage not available
        }
      }
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  // DEV-only: Check for demo session marker in localStorage
  // Note: HttpOnly cookies cannot be read from JS, so we use localStorage marker
  // Make this reactive so it updates when localStorage changes
  const [demoSessionPresent, setDemoSessionPresent] = useState(() => {
    if (typeof window === "undefined" || import.meta.env.PROD) return false;
    try {
      return localStorage.getItem('demo_session_present') === '1';
    } catch (e) {
      return false;
    }
  });

  // Poll localStorage for demo_session_present changes (DEV only)
  useEffect(() => {
    if (!import.meta.env.DEV || typeof window === "undefined") return;
    
    const checkDemoSession = () => {
      try {
        const present = localStorage.getItem('demo_session_present') === '1';
        setDemoSessionPresent(present);
      } catch (e) {
        // localStorage not available
      }
    };

    // Check immediately
    checkDemoSession();

    // Poll every 100ms to catch changes quickly
    const interval = setInterval(checkDemoSession, 100);

    // Also listen for storage events (cross-tab)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'demo_session_present') {
        checkDemoSession();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Grace window: after demo login, prevent redirects for 2000ms
  // Store grace window end timestamp in localStorage (survives page reloads)
  const [graceWindowEnd, setGraceWindowEnd] = useState<number | null>(() => {
    if (typeof window === "undefined" || import.meta.env.PROD) return null;
    try {
      const stored = localStorage.getItem('demo_grace_window_end');
      if (stored) {
        const timestamp = parseInt(stored, 10);
        // Only use if still valid (not expired)
        if (Date.now() < timestamp) {
          return timestamp;
        } else {
          localStorage.removeItem('demo_grace_window_end');
        }
      }
    } catch (e) {
      // localStorage not available
    }
    return null;
  });
  
  // Update grace window when demo session marker appears
  useEffect(() => {
    if (!import.meta.env.DEV || typeof window === "undefined") return;
    
    // If demo session marker exists but auth.me hasn't returned user yet, set/extend grace window
    if (demoSessionPresent && !meQuery.data) {
      const now = Date.now();
      const newEnd = now + 2000; // 2 second grace window
      
      if (!graceWindowEnd || newEnd > graceWindowEnd) {
        setGraceWindowEnd(newEnd);
        try {
          localStorage.setItem('demo_grace_window_end', newEnd.toString());
        } catch (e) {
          // localStorage not available
        }
        
        if (import.meta.env.DEV) {
          console.log("[Auth] DEV: Grace window activated until", new Date(newEnd).toISOString());
        }
      }
    }
  }, [demoSessionPresent, meQuery.data, graceWindowEnd]);

  const isInDemoGraceWindow = useMemo(() => {
    if (!import.meta.env.DEV) return false;
    if (!graceWindowEnd) return false;
    const isActive = Date.now() < graceWindowEnd;
    
    // Clean up if expired
    if (!isActive && graceWindowEnd) {
      try {
        localStorage.removeItem('demo_grace_window_end');
      } catch (e) {
        // localStorage not available
      }
    }
    
    return isActive;
  }, [graceWindowEnd]);

  // DEV-only: Role switch window - prevents flicker when demo_role_override changes
  const [roleSwitchWindowEnd, setRoleSwitchWindowEnd] = useState<number | null>(() => {
    if (typeof window === "undefined" || import.meta.env.PROD) return null;
    try {
      const stored = localStorage.getItem('demo_role_switch_end');
      if (stored) {
        const timestamp = parseInt(stored, 10);
        if (Date.now() < timestamp) {
          return timestamp;
        } else {
          localStorage.removeItem('demo_role_switch_end');
        }
      }
    } catch (e) {
      // localStorage not available
    }
    return null;
  });

  // Track last demo_role_override value to detect changes
  const lastDemoRoleOverrideRef = useRef<string | null>(null);

  // Monitor demo_role_override changes (same-tab polling + cross-tab storage event)
  useEffect(() => {
    if (!import.meta.env.DEV || typeof window === "undefined") return;

    const checkRoleOverride = () => {
      try {
        const currentOverride = localStorage.getItem('demo_role_override');
        const lastOverride = lastDemoRoleOverrideRef.current;

        // If override changed, start role switch window
        if (currentOverride !== lastOverride && lastOverride !== null) {
          const switchEnd = Date.now() + 2000; // 2 second role switch window
          setRoleSwitchWindowEnd(switchEnd);
          try {
            localStorage.setItem('demo_role_switch_end', switchEnd.toString());
            if (import.meta.env.DEV) {
              console.log("[Auth] DEV: role override changed -> starting role switch window until", new Date(switchEnd).toISOString());
            }
            
            // Trigger auth.me refetch to get updated user
            // Use refetch() instead of invalidate() to avoid clearing cache temporarily
            void utils.auth.me.refetch();
          } catch (e) {
            // localStorage not available
          }
        }

        lastDemoRoleOverrideRef.current = currentOverride;
      } catch (e) {
        // localStorage not available
      }
    };

    // Initial check
    checkRoleOverride();

    // Poll every 200ms for same-tab changes (storage event only fires cross-tab)
    const pollInterval = setInterval(checkRoleOverride, 200);

    // Listen for cross-tab changes
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'demo_role_override') {
        checkRoleOverride();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('storage', handleStorage);
    };
  }, [utils]);

  const isInRoleSwitchWindow = useMemo(() => {
    if (!import.meta.env.DEV) return false;
    if (!roleSwitchWindowEnd) {
      // Also check localStorage directly (in case state hasn't updated)
      try {
        const stored = localStorage.getItem('demo_role_switch_end');
        if (stored) {
          const timestamp = parseInt(stored, 10);
          const isActive = Date.now() < timestamp;
          if (!isActive) {
            localStorage.removeItem('demo_role_switch_end');
          }
          return isActive;
        }
      } catch (e) {
        // localStorage not available
      }
      return false;
    }
    const isActive = Date.now() < roleSwitchWindowEnd;
    
    // Clean up if expired
    if (!isActive && roleSwitchWindowEnd) {
      try {
        localStorage.removeItem('demo_role_switch_end');
      } catch (e) {
        // localStorage not available
      }
    }
    
    if (import.meta.env.DEV) {
      console.log("[Auth] DEV: isInRoleSwitchWindow =", isActive);
    }
    
    return isActive;
  }, [roleSwitchWindowEnd]);

  // DEV-only: Log auth state changes
  useEffect(() => {
    if (import.meta.env.DEV && typeof window !== "undefined") {
      if (demoSessionPresent && !meQuery.data && !meQuery.isLoading) {
        console.log("[Auth] DEV: Demo session marker present but auth.me query returned no user");
      }
      
      if (meQuery.data) {
        console.log("[Auth] DEV: auth.me succeeded, user:", meQuery.data.email || meQuery.data.name);
      }
      
      if (meQuery.error && demoSessionPresent) {
        console.warn("[Auth] DEV: auth.me failed but demo session marker exists - treating as authenticated");
      }
      
      // Log demo session and grace window status
      if (import.meta.env.DEV) {
        console.log("[Auth] DEV: demo_session_present =", demoSessionPresent, "grace_window =", isInDemoGraceWindow);
      }
    }
  }, [meQuery.data, meQuery.error, meQuery.isLoading, demoSessionPresent, isInDemoGraceWindow]);

  const state = useMemo(() => {
    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(meQuery.data)
    );
    
    // Get current user data (may be placeholder data during refetch)
    // placeholderData: (prev) => prev ensures data never becomes null during refetch
    const currentUser = meQuery.data;
    const hasUser = Boolean(currentUser);
    
    // Stable authentication status: treat as authenticated if:
    // 1. User exists (current data), OR
    // 2. Query is fetching AND we have previous data (placeholderData preserves it)
    // This prevents flicker during refetches - auth state never drops to unauthenticated
    const hasPreviousData = meQuery.isFetching && currentUser !== undefined;
    const isAuthenticatedStable = hasUser || (hasPreviousData && Boolean(currentUser));
    
    // DEV-only: If demo session marker exists or in grace window, treat as authenticated
    // This prevents flicker during account switching
    // Note: placeholderData keeps user from becoming undefined during refetch
    // Don't treat as authenticated during initial load (wait for first result)
    // NO MORE role switch window - role is server-driven via JWT
    const isAuthenticatedDev = import.meta.env.DEV && 
      (demoSessionPresent || isInDemoGraceWindow) && 
      !meQuery.isLoading && hasCompletedFirstAuth;
    
    // In DEV: authenticated if user exists OR demo marker/grace window active OR stable auth
    // In PROD: authenticated only if stable auth (user exists or fetching with previous data)
    // IMPORTANT: meQuery.data is the user object directly (from auth.me query)
    // Use stable auth status to prevent flicker during refetches
    const isAuthenticated = import.meta.env.DEV 
      ? (isAuthenticatedStable || isAuthenticatedDev)
      : isAuthenticatedStable;
    
    // DEV-ONLY: During demo transitions, treat as loading to prevent Access Denied flashes
    const isInDemoTransition = import.meta.env.DEV && isDemoTransitionActive();
    
    return {
      user: meQuery.data ?? null,
      // Include isRefetching and isFetching in loading state to prevent flicker during refetches
      // Also include demo transition state (DEV only)
      // CRITICAL: Include isFetching (not just isRefetching) to prevent redirects during ANY fetch
      // This ensures ProtectedRoute never redirects while auth.me is fetching (initial load OR refetch)
      loading: meQuery.isLoading || meQuery.isFetching || meQuery.isRefetching || logoutMutation.isPending || isInDemoTransition,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated,
      isAuthenticatedStable, // Expose stable auth status for ProtectedRoute
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    meQuery.isFetching, // Include isFetching in deps to react to all fetch states
    meQuery.isRefetching,
    logoutMutation.error,
    logoutMutation.isPending,
    demoSessionPresent,
    isInDemoGraceWindow,
    isInRoleSwitchWindow,
    hasCompletedFirstAuth,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    // NEVER redirect while auth is still resolving
    if (!isAuthReady) {
      if (import.meta.env.DEV) {
        console.log("[Auth] DEV: Waiting for auth readiness before redirect check");
      }
      return;
    }
    if (logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;
    
    // DEV-only: Don't redirect if demo session marker exists, in grace window, or in role switch window
    // Also check localStorage directly as fallback (in case state hasn't updated)
    const demoSessionPresentFallback = import.meta.env.DEV && typeof window !== "undefined"
      ? (() => {
          try {
            return localStorage.getItem('demo_session_present') === '1';
          } catch (e) {
            return false;
          }
        })()
      : false;
    
    const isInDemoGraceWindowFallback = import.meta.env.DEV && typeof window !== "undefined"
      ? (() => {
          try {
            const stored = localStorage.getItem('demo_grace_window_end');
            if (stored) {
              return Date.now() < parseInt(stored, 10);
            }
          } catch (e) {
            // localStorage not available
          }
          return false;
        })()
      : false;
    
    // NO MORE role switch window fallback - role is server-driven via JWT
    const hasDemoProtection = demoSessionPresent || demoSessionPresentFallback || 
                               isInDemoGraceWindow || isInDemoGraceWindowFallback;
    
    if (import.meta.env.DEV && hasDemoProtection) {
      if (import.meta.env.DEV) {
        console.log("[Auth] DEV: Keeping route - demo session/grace/role switch active");
      }
      return;
    }

    if (import.meta.env.DEV) {
      console.log("[Auth] Redirecting to login - no user and no demo session marker");
    }
    window.location.href = redirectPath
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    isAuthReady,
    state.user,
    demoSessionPresent,
    isInDemoGraceWindow,
    isInRoleSwitchWindow,
  ]);

  // Log when placeholderData preserves user during refetch (DEV only)
  useEffect(() => {
    if (import.meta.env.DEV && meQuery.isRefetching && meQuery.data) {
      console.log("[Auth] DEV: placeholderData keeping user during refetch (no flicker)");
    }
  }, [meQuery.isRefetching, meQuery.data]);

  return {
    ...state,
    isAuthReady, // Expose readiness state for route guards
    isFetching: meQuery.isFetching, // Expose isFetching so ProtectedRoute can check it
    demoSessionPresent: import.meta.env.DEV ? demoSessionPresent : false, // DEV only (replaces hasSessionCookie)
    isInDemoGraceWindow: import.meta.env.DEV ? isInDemoGraceWindow : false, // DEV only
    isInRoleSwitchWindow: import.meta.env.DEV ? isInRoleSwitchWindow : false, // DEV only
    refresh: () => meQuery.refetch(),
    logout,
  };
}
