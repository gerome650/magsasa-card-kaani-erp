import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo, useState } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Auth readiness: true after first auth.me attempt completes (success or failure)
  // Use a simple check: if not loading, we've attempted the query
  const isAuthReady = !meQuery.isLoading && (meQuery.data !== undefined || meQuery.error !== undefined);

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
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  // DEV-only: Check for demo session cookie for logging and state
  const hasSessionCookie = useMemo(() => {
    if (typeof window === "undefined") return false;
    if (import.meta.env.PROD) return false;
    
    const cookies = document.cookie.split(';').map(c => c.trim());
    return cookies.some(c => c.startsWith('app_session_id='));
  }, []);

  // Grace window: after demo login, prevent redirects for 2 seconds
  const [graceWindowEnd, setGraceWindowEnd] = useState<number | null>(null);
  
  useEffect(() => {
    if (hasSessionCookie && !meQuery.data && isAuthReady) {
      // If cookie exists but auth.me hasn't returned user yet, extend grace window
      const now = Date.now();
      if (!graceWindowEnd || now < graceWindowEnd) {
        const newEnd = now + 2000; // 2 second grace window
        if (!graceWindowEnd || newEnd > graceWindowEnd) {
          setGraceWindowEnd(newEnd);
        }
      }
    }
  }, [hasSessionCookie, meQuery.data, isAuthReady, graceWindowEnd]);

  const isInGraceWindow = useMemo(() => {
    if (!import.meta.env.DEV) return false;
    if (!graceWindowEnd) return false;
    return Date.now() < graceWindowEnd;
  }, [graceWindowEnd]);

  // DEV-only: Log auth state changes
  useEffect(() => {
    if (import.meta.env.DEV && typeof window !== "undefined") {
      if (hasSessionCookie && !meQuery.data && !meQuery.isLoading) {
        console.log("[Auth] DEV: Session cookie present but auth.me query returned no user");
      }
      
      if (meQuery.data) {
        console.log("[Auth] DEV: auth.me succeeded, user:", meQuery.data.email || meQuery.data.name);
      }
      
      if (meQuery.error && hasSessionCookie) {
        console.warn("[Auth] DEV: auth.me failed but session cookie exists - treating as authenticated");
      }
    }
  }, [meQuery.data, meQuery.error, meQuery.isLoading, hasSessionCookie]);

  const state = useMemo(() => {
    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(meQuery.data)
    );
    
    // DEV-only: If auth.me fails but session cookie exists, treat as authenticated
    const isAuthenticatedDev = import.meta.env.DEV && hasSessionCookie && !meQuery.data && !meQuery.isLoading;
    
    return {
      user: meQuery.data ?? null,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data) || isAuthenticatedDev,
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
    hasSessionCookie,
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
    
    // DEV-only: Don't redirect if demo session cookie exists or in grace window
    if (import.meta.env.DEV && (hasSessionCookie || isInGraceWindow)) {
      if (import.meta.env.DEV) {
        console.log("[Auth] DEV: Keeping route - cookie present or in grace window");
      }
      return;
    }

    if (import.meta.env.DEV) {
      console.log("[Auth] Redirecting to login - no user and no session cookie");
    }
    window.location.href = redirectPath
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    isAuthReady,
    state.user,
    hasSessionCookie,
    isInGraceWindow,
  ]);

  return {
    ...state,
    isAuthReady, // Expose readiness state for route guards
    refresh: () => meQuery.refetch(),
    logout,
  };
}
