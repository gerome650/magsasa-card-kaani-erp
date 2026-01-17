export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "App";

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

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
