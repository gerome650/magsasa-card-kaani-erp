export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "MAGSASA-CARD";

export const APP_LOGO = "https://placehold.co/128x128/E1E7EF/1F2937?text=App";

// Lite Mode: Reduced UI for Account Officers
export const IS_LITE_MODE = import.meta.env.VITE_APP_MODE === 'lite';

// Role normalization for defensive role checking
export type NormalizedRole = "farmer" | "staff";

/**
 * Normalizes user role from various possible fields and formats.
 * Defensively checks multiple fields and handles various role string formats.
 * 
 * @param user - User object (can be any shape)
 * @returns "farmer" if user is a farmer, "staff" otherwise
 */
export function normalizeRole(user: any): NormalizedRole {
  // Check localStorage demo role override ONLY when demo session is active (for demo account switching)
  try {
    const demoSessionPresent = localStorage.getItem("demo_session_present") === "1";
    const override = localStorage.getItem("demo_role_override");
    
    // Auto-heal: Remove stale demo_role_override if demo_session_present is not "1"
    if (override && !demoSessionPresent) {
      localStorage.removeItem("demo_role_override");
      localStorage.removeItem("demo_role_switch_end");
      localStorage.removeItem("demo_grace_window_end");
      if (import.meta.env.DEV) {
        console.log("[auth] Auto-healed: Removed stale demo_role_override (demo_session_present !== '1')");
      }
    }
    
    // Only honor demo_role_override when:
    // 1. DEV mode is enabled, AND
    // 2. demo_session_present === "1"
    if (override && import.meta.env.DEV && demoSessionPresent) {
      const overrideLower = override.trim().toLowerCase();
      // If override includes "farmer", treat as farmer
      if (overrideLower.includes("farmer")) {
        if (import.meta.env.DEV) {
          console.log("[auth] demo_role_override=", override, "normalized=farmer");
        }
        return "farmer";
      }
      // If override exists (officer/manager), treat as staff
      if (import.meta.env.DEV) {
        console.log("[auth] demo_role_override=", override, "normalized=staff");
      }
      return "staff";
    }
  } catch (e) {
    // localStorage may not be available (SSR, private mode, etc.)
    if (import.meta.env.DEV) {
      console.warn("[auth] localStorage not available for demo_role_override check");
    }
  }

  if (!user) return "staff";

  // Extract candidate role strings from likely fields
  const candidates = [
    user?.role,
    user?.userRole,
    user?.type,
    user?.userType,
    user?.profile?.role,
    user?.claims?.role,
    user?.identity?.role,
  ].filter(Boolean);

  // Convert to string, trim, lowercase
  const normalizedCandidates = candidates.map((c) => String(c).trim().toLowerCase());

  // Check if any candidate indicates farmer
  for (const candidate of normalizedCandidates) {
    // If includes "farmer", treat as farmer
    if (candidate.includes("farmer")) {
      if (import.meta.env.DEV) {
        console.log("[auth] raw role=", candidate, "normalized=farmer");
      }
      return "farmer";
    }
    // Also check for common farmer aliases
    if (["member", "client", "borrower", "farmer_user"].includes(candidate)) {
      if (import.meta.env.DEV) {
        console.log("[auth] raw role=", candidate, "normalized=farmer (alias)");
      }
      return "farmer";
    }
  }

  // Default to staff
  if (import.meta.env.DEV && normalizedCandidates.length > 0) {
    console.log("[auth] raw role=", normalizedCandidates[0], "normalized=staff");
  }
  return "staff";
}

/**
 * Maps server role ('user' | 'admin') to client UserRole.
 * Uses localStorage demo_role_override if available (for demo account switching).
 * This is the same logic as getClientRole in ProtectedRoute.tsx, but exported for reuse.
 */
export function getClientRole(user: any): import("@/data/usersData").UserRole | null {
  if (!user) return null;
  
  // Check localStorage demo role override ONLY when demo session is active (for demo account switching)
  try {
    const demoSessionPresent = localStorage.getItem("demo_session_present") === "1";
    const override = localStorage.getItem("demo_role_override");
    
    // Auto-heal: Remove stale demo_role_override if demo_session_present is not "1"
    if (override && !demoSessionPresent) {
      localStorage.removeItem("demo_role_override");
      localStorage.removeItem("demo_role_switch_end");
      localStorage.removeItem("demo_grace_window_end");
      if (import.meta.env.DEV) {
        console.log("[auth] Auto-healed: Removed stale demo_role_override (demo_session_present !== '1')");
      }
    }
    
    // Only honor demo_role_override when:
    // 1. DEV mode is enabled, AND
    // 2. demo_session_present === "1"
    if (override && import.meta.env.DEV && demoSessionPresent) {
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

/**
 * Normalizes audience value to backend enum values (snake_case).
 * Defensive fix for Zod validation errors.
 * 
 * @param value - Audience value (can be any format)
 * @returns "loan_officer" | "farmer" (snake_case)
 */
export function normalizeAudience(value: unknown): "loan_officer" | "farmer" {
  const s = String(value ?? "").trim().toLowerCase();
  // Handle snake_case
  if (s === "loan_officer" || s === "loanofficer") return "loan_officer";
  if (s === "farmer") return "farmer";
  // Handle space-separated
  if (s === "loan officer" || s.includes("loan") && s.includes("officer")) return "loan_officer";
  // Default conservative: loan_officer
  return "loan_officer";
}

// Module-level flag to prevent warning spam
let warnedInvalidLoginUrl = false;

/**
 * Check if a string is an absolute HTTP(S) URL.
 */
function isAbsoluteHttpUrl(s: string): boolean {
  return /^https?:\/\//i.test(s);
}

/**
 * Get the current origin in DEV, fallback to localhost:3000.
 * Uses window.location.origin to automatically handle port changes (3000 → 3001).
 */
function getDevOrigin(): string {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }
  return "http://localhost:3000";
}

/**
 * Safely join origin and path, ensuring no double slashes.
 */
function safeJoin(origin: string, path: string): string {
  const cleanOrigin = origin.replace(/\/+$/, ""); // Remove trailing slashes
  const cleanPath = path.startsWith("/") ? path : `/${path}`; // Ensure leading slash
  return `${cleanOrigin}${cleanPath}`;
}

/**
 * Generate login URL at runtime so redirect URI reflects the current origin.
 * NEVER throws - always returns a valid string (either the configured URL or "/login" fallback).
 * 
 * In DEV, uses window.location.origin to automatically handle port changes (3000 → 3001).
 * 
 * @returns OAuth login URL or "/login" fallback if configuration is invalid
 */
export function getLoginUrl(): string {
  // Read candidate from environment variables
  const oauthPortalUrl = String(import.meta.env.VITE_OAUTH_PORTAL_URL ?? "").trim();
  const appId = String(import.meta.env.VITE_APP_ID ?? "").trim();

  // If oauthPortalUrl is empty or not a string, return safe fallback
  if (!oauthPortalUrl) {
    if (import.meta.env.DEV && !warnedInvalidLoginUrl) {
      warnedInvalidLoginUrl = true;
      console.warn("[auth] VITE_OAUTH_PORTAL_URL not set, falling back to /login");
    }
    return "/login";
  }

  // If candidate starts with "/", it's a relative path - return as-is (do NOT call new URL)
  if (oauthPortalUrl.startsWith("/")) {
    return oauthPortalUrl;
  }

  // If candidate is absolute HTTP(S) URL, validate and construct
  if (isAbsoluteHttpUrl(oauthPortalUrl)) {
    try {
      // Get dynamic origin (handles port changes automatically in DEV)
      // In DEV: uses window.location.origin (auto-detects port 3000 → 3001)
      // In PROD: uses window.location.origin (should always be available client-side)
      const origin = typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : (import.meta.env.DEV ? "http://localhost:3000" : "");
      
      if (!origin) {
        throw new Error("Cannot determine origin");
      }
      
      const redirectUri = `${origin}/api/oauth/callback`;
      const state = btoa(redirectUri);

      const url = new URL(`${oauthPortalUrl}/app-auth`);
      url.searchParams.set("appId", appId);
      url.searchParams.set("redirectUri", redirectUri);
      url.searchParams.set("state", state);
      url.searchParams.set("type", "signIn");

      return url.toString();
    } catch (error) {
      // URL construction failed - return safe fallback
      if (import.meta.env.DEV && !warnedInvalidLoginUrl) {
        warnedInvalidLoginUrl = true;
        console.warn("[auth] Failed to construct OAuth URL, falling back to /login", {
          oauthPortalUrl,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      return "/login";
    }
  }

  // Candidate is not empty, not relative, and not absolute HTTP(S) - treat as invalid
  // Examples: "localhost:3000/login", "invalid-url", etc.
  if (import.meta.env.DEV && !warnedInvalidLoginUrl) {
    warnedInvalidLoginUrl = true;
    console.warn("[auth] Invalid OAuth portal URL format, falling back to /login", {
      oauthPortalUrl,
      hint: "Expected absolute URL (https://...) or relative path (/login)",
    });
  }
  return "/login";
}
