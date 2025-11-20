/**
 * Analytics configuration helper
 * Provides type-safe access to analytics environment variables
 * and determines if analytics should be enabled
 */

export interface AnalyticsConfig {
  endpoint: string;
  websiteId: string;
}

/**
 * Get analytics configuration from environment variables
 * Returns null if analytics is not configured
 */
export function getAnalyticsConfig(): AnalyticsConfig | null {
  // In client-side code, use import.meta.env (Vite's way)
  // In build/plugin context, use process.env
  const endpoint =
    typeof import !== "undefined" && import.meta?.env?.VITE_ANALYTICS_ENDPOINT
      ? import.meta.env.VITE_ANALYTICS_ENDPOINT
      : process.env.VITE_ANALYTICS_ENDPOINT;

  const websiteId =
    typeof import !== "undefined" && import.meta?.env?.VITE_ANALYTICS_WEBSITE_ID
      ? import.meta.env.VITE_ANALYTICS_WEBSITE_ID
      : process.env.VITE_ANALYTICS_WEBSITE_ID;

  // Both must be defined and non-empty for analytics to be enabled
  if (endpoint?.trim() && websiteId?.trim()) {
    return {
      endpoint: endpoint.trim(),
      websiteId: websiteId.trim(),
    };
  }

  return null;
}

/**
 * Check if analytics is enabled
 * Returns true only if both endpoint and websiteId are configured
 */
export function isAnalyticsEnabled(): boolean {
  return getAnalyticsConfig() !== null;
}

