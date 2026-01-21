import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { trpc } from "@/lib/trpc";

// DEV-only: Auth debugging overlay
export function DevAuthOverlay() {
  if (!import.meta.env.DEV) return null;

  const [location] = useLocation();
  const { user, isAuthenticated, loading, isFetching } = useAuth();
  const [sessionProbe, setSessionProbe] = useState<any>(null);
  const logoutMutation = trpc.auth.logout.useMutation();

  const probeSession = async () => {
    try {
      const response = await fetch("/__debug/session");
      const data = await response.json();
      setSessionProbe(data);
      console.log("[DEV] Session probe result:", data);
    } catch (error) {
      console.error("[DEV] Session probe failed:", error);
      setSessionProbe({ error: String(error) });
    }
  };

  const handleResetDemoSession = async () => {
    try {
      await logoutMutation.mutateAsync();
      // Clear demo-related localStorage keys
      localStorage.removeItem("demo_session_present");
      localStorage.removeItem("demo_role_override");
      localStorage.removeItem("demo_role_switch_end");
      localStorage.removeItem("demo_grace_window_end");
      // Reload page after logout to clear all state
      window.location.reload();
    } catch (error) {
      console.error("[DEV] Reset demo session failed:", error);
      // Still clear localStorage and reload even if logout fails
      localStorage.removeItem("demo_session_present");
      localStorage.removeItem("demo_role_override");
      localStorage.removeItem("demo_role_switch_end");
      localStorage.removeItem("demo_grace_window_end");
      window.location.reload();
    }
  };

  // Route tracing: log every route change + auth state snapshot
  useEffect(() => {
    console.log("[DEV] route", location, {
      userRole: user?.role || null,
      isAuth: isAuthenticated,
      loading,
      isFetching,
      userId: user?.id || null,
      userEmail: user?.email || null,
    });
  }, [location, user?.role, isAuthenticated, loading, isFetching, user?.id, user?.email]);

  return (
    <div className="fixed top-2 left-2 z-[9999] bg-black/90 text-white text-xs p-3 rounded-md font-mono max-w-sm">
      <div className="font-bold mb-2 text-yellow-400">[DEV] Auth Debug</div>
      <div className="space-y-1">
        <div>
          <span className="text-gray-400">Location:</span> {location}
        </div>
        <div>
          <span className="text-gray-400">Role:</span> {user?.role || "—"}
        </div>
        <div>
          <span className="text-gray-400">Auth:</span> {isAuthenticated ? "✓" : "✗"}
        </div>
        <div>
          <span className="text-gray-400">Loading:</span> {loading ? "⏳" : "✓"}
        </div>
        <div>
          <span className="text-gray-400">Fetching:</span> {isFetching ? "⏳" : "✓"}
        </div>
        <div>
          <span className="text-gray-400">User ID:</span> {user?.id || "—"}
        </div>
        <div className="mt-2 pt-2 border-t border-gray-700 space-y-2">
          <Button
            onClick={probeSession}
            className="w-full text-xs py-1 h-auto"
            size="sm"
          >
            Probe Session
          </Button>
          <Button
            onClick={handleResetDemoSession}
            className="w-full text-xs py-1 h-auto bg-red-600 hover:bg-red-700"
            size="sm"
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? "Resetting..." : "Reset Demo Session"}
          </Button>
          {sessionProbe && (
            <div className="mt-2 text-xs">
              <div className="text-yellow-400">Probe Result:</div>
              <pre className="text-[10px] overflow-auto max-h-32">
                {JSON.stringify(sessionProbe, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
