import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

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

  // DEV-only: Check for demo session cookie before redirecting
  const hasDemoSessionCookie = useMemo(() => {
    if (typeof window === "undefined") return false;
    if (import.meta.env.PROD) return false; // Only in dev mode
    
    // Check for session cookie (app_session_id)
    const cookies = document.cookie.split(';').map(c => c.trim());
    const hasSessionCookie = cookies.some(c => c.startsWith('app_session_id='));
    
    if (import.meta.env.DEV && hasSessionCookie) {
      console.log("[Auth] DEV mode: Session cookie detected, preventing redirect");
    }
    
    return hasSessionCookie;
  }, []);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;
    
    // DEV-only: Don't redirect if demo session cookie exists
    if (import.meta.env.DEV && hasDemoSessionCookie) {
      if (import.meta.env.DEV) {
        console.log("[Auth] DEV mode: Keeping route despite missing user (session cookie present)");
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
    meQuery.isLoading,
    state.user,
    hasDemoSessionCookie,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
