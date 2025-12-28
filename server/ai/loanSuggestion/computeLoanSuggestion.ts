import { LoanSuggestionArtifact, LoanSummaryArtifact, CostBreakdownArtifact, RiskFlagsArtifact } from "../artifacts/types";
import { getLoanSuggestionPolicy } from "../config/policyProfiles";
import { computeLoanSuggestion as computeFormula } from "./loanSuggestionFormula";

/**
 * Build loan suggestion artifact from existing artifacts
 * This function orchestrates the loan suggestion computation and wraps it in an artifact
 */
export function computeLoanSuggestion(
  loanSummary: LoanSummaryArtifact | undefined,
  costBreakdown: CostBreakdownArtifact | undefined,
  riskFlags: RiskFlagsArtifact | undefined,
  missingFields: string[]
): LoanSuggestionArtifact | null {
  // Get policy configuration for current deployment profile
  const policy = getLoanSuggestionPolicy();

  // Feature gate: check if loan suggestion is enabled for this deployment
  if (!policy.enabled) {
    return null;
  }

  // Prepare input for formula computation
  const input = {
    crop: loanSummary?.data.crop,
    hectares: loanSummary?.data.hectares,
    costBreakdown: costBreakdown?.data ? {
      total: costBreakdown.data.total,
    } : undefined,
    riskFlags: riskFlags?.data.flags,
    missingFields,
  };

  // Compute loan suggestion using formula
  const result = computeFormula(input, policy);

  // Build and return artifact with visibility based on policy
  return {
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
}
