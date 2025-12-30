import { LoanSuggestionArtifact, LoanSummaryArtifact, CostBreakdownArtifact, RiskFlagsArtifact } from "../artifacts/types";
import { getLoanSuggestionPolicy, getCurrentProfile } from "../config/policyProfiles";
import { computeLoanSuggestion as computeFormula } from "./loanSuggestionFormula";
import { hashFarmerId, getCorrelationId, logEvent } from "./logging";

/**
 * Build loan suggestion artifact from existing artifacts
 * This function orchestrates the loan suggestion computation and wraps it in an artifact
 */
export function computeLoanSuggestion(
  loanSummary: LoanSummaryArtifact | undefined,
  costBreakdown: CostBreakdownArtifact | undefined,
  riskFlags: RiskFlagsArtifact | undefined,
  missingFields: string[],
  loggingContext?: {
    farmerProfileId?: string | null;
    req?: { headers?: Record<string, string | string[] | undefined> };
  }
): LoanSuggestionArtifact | null {
  const startTime = Date.now();
  // Get policy configuration for current deployment profile
  const policy = getLoanSuggestionPolicy();

  // Feature gate: check if loan suggestion is enabled for this deployment
  if (!policy.enabled) {
    return null;
  }

  // Prepare input for formula computation (with defensive guards)
  const input = {
    crop: loanSummary?.data.crop,
    hectares: loanSummary?.data.hectares, // May be undefined/0 - formula handles this
    costBreakdown: costBreakdown?.data && costBreakdown.data.total ? {
      total: costBreakdown.data.total,
    } : undefined,
    riskFlags: riskFlags?.data?.flags || [], // Guard: default to empty array if missing
    missingFields: missingFields || [], // Guard: default to empty array
  };

  // Compute loan suggestion using formula
  const result = computeFormula(input, policy);

  // Build artifact with visibility based on policy
  const artifact: LoanSuggestionArtifact = {
    id: "loan_suggestion_v1",
    type: "loan_suggestion",
    title: "Loan Amount Suggestion",
    version: "v1",
    visibility: policy.visibility, // Feature flag: determines if shown in UI
    data: {
      suggestedAmount: result.suggestedAmount,
      currency: "PHP",
      baseAmount: result.baseAmount,
      adjustments: result.adjustments,
      disclaimers: result.disclaimers,
      confidence: result.confidence,
    },
  };

  // Log computation event (never crash on logging errors)
  try {
    const computeDurationMs = Date.now() - startTime;
    const deploymentProfile = getCurrentProfile();
    const correlationId = loggingContext?.req ? getCorrelationId(loggingContext.req) : getCorrelationId();
    const farmerIdHash = hashFarmerId(loggingContext?.farmerProfileId ?? null);

    // Extract penalty/adjustment summary
    const penaltiesApplied = result.adjustments
      .filter(adj => adj.penalty !== undefined || (adj.impact && adj.impact < 0))
      .map(adj => adj.reason || "Adjustment");

    // Determine artifact validation status
    let artifactValidation: "ok" | "missing" | "invalid_shape" = "ok";
    if (!artifact.data || typeof artifact.data.suggestedAmount !== "number") {
      artifactValidation = "invalid_shape";
    } else if (missingFields.length > 0 && result.confidence === "low") {
      artifactValidation = "missing";
    }

    // Check for clamps/rounding applied
    const clampsApplied = result.adjustments.some(adj => 
      adj.reason?.includes("minimum") || adj.reason?.includes("maximum")
    );
    const roundingApplied = policy.roundingIncrement > 0; // Always applied if increment > 0

    logEvent("ai.loan_suggestion.computed.v1", {
      deploymentProfile,
      visibility: policy.visibility,
      correlationId,
      farmerIdHash,
      baseAmount: result.baseAmount,
      suggestedAmount: result.suggestedAmount,
      confidence: result.confidence,
      penaltiesApplied: penaltiesApplied.length > 0 ? penaltiesApplied : undefined,
      missingFieldsCount: missingFields.length,
      riskFlagsCount: riskFlags?.data?.flags?.length || 0,
      clampsApplied,
      roundingApplied,
      computeDurationMs,
      artifactValidation,
    });
  } catch (logError) {
    // Never crash on logging errors - silently continue
  }

  return artifact;
}
