/**
 * Deployment profiles for partner-specific configurations
 * Used to gate features and apply partner-specific policies
 */
export type DeploymentProfile = "CARD_MRI" | "LANDBANK" | "DEV";

/**
 * Feature visibility levels
 * - "off": Feature is disabled
 * - "internal": Feature is available for internal use only (loan officers)
 * - "ui": Feature is visible in the UI for end users
 */
export type FeatureVisibility = "off" | "internal" | "ui";

/**
 * Policy configuration for loan suggestions
 */
export interface LoanSuggestionPolicy {
  enabled: boolean;
  visibility: FeatureVisibility;
  minLoanAmount: number;
  maxLoanAmount: number;
  roundingIncrement: number;
}

/**
 * Partner-specific policy profiles
 */
export const POLICY_PROFILES: Record<DeploymentProfile, LoanSuggestionPolicy> = {
  CARD_MRI: {
    enabled: true,
    visibility: "ui", // Feature is visible to farmers
    minLoanAmount: 5000,
    maxLoanAmount: 150000,
    roundingIncrement: 500,
  },
  LANDBANK: {
    enabled: true,
    visibility: "internal", // Only loan officers can see suggestions
    minLoanAmount: 10000,
    maxLoanAmount: 200000,
    roundingIncrement: 500,
  },
  DEV: {
    enabled: true,
    visibility: "ui", // Full visibility in dev mode
    minLoanAmount: 1000,
    maxLoanAmount: 500000,
    roundingIncrement: 500,
  },
};

/**
 * Get the current deployment profile from environment
 * 
 * Controls partner-specific policies and UI visibility for loan suggestions:
 * - CARD_MRI: UI visible to farmers
 * - LANDBANK: Internal only (loan officers)
 * - DEV: UI visible (development mode)
 * 
 * Must be set per deployment environment via DEPLOYMENT_PROFILE env var.
 * Defaults to DEV if not specified.
 */
export function getCurrentProfile(): DeploymentProfile {
  const profile = process.env.DEPLOYMENT_PROFILE?.toUpperCase() as DeploymentProfile;
  
  // Validate profile
  if (profile && (profile === "CARD_MRI" || profile === "LANDBANK" || profile === "DEV")) {
    return profile;
  }
  
  // Default to DEV
  return "DEV";
}

/**
 * Get the policy configuration for the current deployment profile
 */
export function getLoanSuggestionPolicy(): LoanSuggestionPolicy {
  const profile = getCurrentProfile();
  return POLICY_PROFILES[profile];
}
