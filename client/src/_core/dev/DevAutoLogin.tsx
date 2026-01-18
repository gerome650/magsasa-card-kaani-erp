import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

/**
 * DEV-only: Auto-login bypass component
 * 
 * Automatically logs in as a demo user based on:
 * - VITE_DEMO_AUTO_ROLE env var (farmer | field_officer | manager | supplier)
 * - ?demo_role=... URL param (same values)
 * 
 * Prevents loops by:
 * - Checking if already logged in
 * - Using sessionStorage flag (demo_auto_login_done)
 * - Only running once per session
 */
export function DevAutoLogin() {
  if (!import.meta.env.DEV) return null;

  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { data: user } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const demoLoginMutation = trpc.auth.demoLogin.useMutation();

  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);
  const [autoLoginError, setAutoLoginError] = useState<string | null>(null);
  
  const isAuthenticated = Boolean(user);

  useEffect(() => {
    // Check if auto-login should run
    const shouldRunAutoLogin = (): boolean => {
      // Already logged in - skip
      if (isAuthenticated && user) {
        return false;
      }

      // Already ran this session - skip
      try {
        if (sessionStorage.getItem("demo_auto_login_done") === "1") {
          return false;
        }
      } catch (e) {
        // sessionStorage not available
      }

      // Check env var
      const envRole = import.meta.env.VITE_DEMO_AUTO_ROLE;
      if (envRole && ["farmer", "field_officer", "manager", "supplier"].includes(envRole)) {
        return true;
      }

      // Check URL param
      const urlParams = new URLSearchParams(window.location.search);
      const urlRole = urlParams.get("demo_role");
      if (urlRole && ["farmer", "field_officer", "manager", "supplier"].includes(urlRole)) {
        return true;
      }

      return false;
    };

    const getAutoLoginRole = (): "farmer" | "field_officer" | "manager" | "supplier" => {
      // Prefer env var, fallback to URL param
      const envRole = import.meta.env.VITE_DEMO_AUTO_ROLE;
      if (envRole && ["farmer", "field_officer", "manager", "supplier"].includes(envRole)) {
        return envRole as "farmer" | "field_officer" | "manager" | "supplier";
      }

      const urlParams = new URLSearchParams(window.location.search);
      const urlRole = urlParams.get("demo_role");
      if (urlRole && ["farmer", "field_officer", "manager", "supplier"].includes(urlRole)) {
        return urlRole as "farmer" | "field_officer" | "manager" | "supplier";
      }

      // Default fallback (shouldn't happen if shouldRunAutoLogin is correct)
      return "manager";
    };

    const performAutoLogin = async () => {
      if (!shouldRunAutoLogin()) {
        return;
      }

      const role = getAutoLoginRole();
      setIsAutoLoggingIn(true);
      setAutoLoginError(null);

      try {
        console.log(`[DEV] auto-login role=${role} started`);

        // Map role to demo credentials
        const credentials = {
          farmer: { username: "farmer", password: "demo123" },
          field_officer: { username: "officer", password: "demo123" },
          manager: { username: "manager", password: "demo123" },
          supplier: { username: "manager", password: "demo123" }, // Use manager for supplier
        }[role];

        // Call demoLogin
        const demoResult = await demoLoginMutation.mutateAsync({
          username: credentials.username,
          password: credentials.password,
          role,
        });

        if (demoResult.success && demoResult.user) {
          // Optimistically set auth.me cache immediately
          utils.auth.me.setData(undefined, demoResult.user);

          // Set demo session marker
          try {
            localStorage.setItem("demo_session_present", "1");
            const graceWindowEnd = Date.now() + 3000;
            localStorage.setItem("demo_grace_window_end", graceWindowEnd.toString());
          } catch (e) {
            // localStorage not available
          }

          // Mark auto-login as done in sessionStorage
          try {
            sessionStorage.setItem("demo_auto_login_done", "1");
          } catch (e) {
            // sessionStorage not available
          }

          // Refetch auth.me to confirm
          await utils.auth.me.refetch();

          console.log(`[DEV] auto-login role=${role} finished, navigating to dashboard`);

          // Navigate to dashboard
          setLocation("/dashboard");
        } else {
          throw new Error("demoLogin returned success=false or no user");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[DEV] auto-login role=${role} failed:`, errorMessage);
        setAutoLoginError(errorMessage);
      } finally {
        setIsAutoLoggingIn(false);
      }
    };

    // Only run if auth state is ready (not loading)
    if (user !== undefined) {
      performAutoLogin();
    }
  }, [isAuthenticated, user, utils, setLocation, demoLoginMutation]);

  // Show loading screen while auto-login is executing
  if (isAutoLoggingIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Auto-logging in...</p>
        </div>
      </div>
    );
  }

  // Show error if auto-login failed
  if (autoLoginError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold mb-2">Auto-login Failed</h2>
          <p className="text-sm text-muted-foreground mb-4">{autoLoginError}</p>
          <a
            href="/login"
            className="text-primary hover:underline"
          >
            Go to login page
          </a>
        </div>
      </div>
    );
  }

  return null;
}
