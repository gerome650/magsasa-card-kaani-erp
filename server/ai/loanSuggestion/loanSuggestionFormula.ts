import { getCropBenchmark } from "../artifacts/data/cropBudgetBenchmarks";
import { LoanSuggestionPolicy } from "../config/policyProfiles";

/**
 * Adjustment record for explainability
 */
export interface LoanAdjustment {
  reason: string;
  multiplier?: number;
  penalty?: number;
  impact: number;
}

/**
 * Loan suggestion formula result
 */
export interface LoanSuggestionResult {
  suggestedAmount: number;
  baseAmount: number;
  adjustments: LoanAdjustment[];
  disclaimers: string[];
  confidence: "low" | "medium" | "high";
}

/**
 * Input data for loan suggestion computation
 */
export interface LoanSuggestionInput {
  crop?: string;
  hectares?: number;
  costBreakdown?: {
    total: { min: number; max: number };
  };
  riskFlags?: Array<{
    severity: "low" | "medium" | "high";
    description: string;
  }>;
  missingFields: string[];
}

/**
 * Compute loan suggestion using formula:
 * 1. Base amount: from cost_breakdown if exists, else hectares * benchmark(crop)
 * 2. Apply risk multipliers based on risk flags
 * 3. Apply missing-info penalties
 * 4. Clamp by policy min/max
 * 5. Round to nearest increment
 */
export function computeLoanSuggestion(
  input: LoanSuggestionInput,
  policy: LoanSuggestionPolicy
): LoanSuggestionResult {
  const adjustments: LoanAdjustment[] = [];
  const disclaimers: string[] = [];
  let confidence: "low" | "medium" | "high" = "medium";

  // Step 1: Determine base amount
  let baseAmount = 0;
  
  if (input.costBreakdown && input.costBreakdown.total.min > 0) {
    // Use average of cost breakdown range as base
    baseAmount = (input.costBreakdown.total.min + input.costBreakdown.total.max) / 2;
    adjustments.push({
      reason: "Base calculated from cost breakdown",
      impact: baseAmount,
    });
  } else if (input.hectares && input.crop) {
    // Fallback to benchmark calculation
    const benchmark = getCropBenchmark(input.crop);
    if (benchmark) {
      const avgCostPerHa = (benchmark.costPerHa.min + benchmark.costPerHa.max) / 2;
      baseAmount = input.hectares * avgCostPerHa;
      adjustments.push({
        reason: `Base calculated from ${input.crop} benchmark (${input.hectares} ha)`,
        impact: baseAmount,
      });
      disclaimers.push("Loan amount based on industry benchmarks for your crop and farm size.");
    } else {
      // Unknown crop, use conservative default
      baseAmount = input.hectares * 40000; // Conservative mid-range estimate
      adjustments.push({
        reason: `Base estimated for ${input.hectares} ha (crop benchmark unavailable)`,
        impact: baseAmount,
      });
      disclaimers.push("Loan amount is an estimate. Crop-specific data not available.");
      confidence = "low";
    }
  } else {
    // Insufficient data for base calculation
    baseAmount = policy.minLoanAmount;
    adjustments.push({
      reason: "Minimum loan amount (insufficient data for calculation)",
      impact: baseAmount,
    });
    disclaimers.push("Loan amount is a minimum estimate due to missing information.");
    confidence = "low";
  }

  let currentAmount = baseAmount;

  // Step 2: Apply risk multipliers
  if (input.riskFlags && input.riskFlags.length > 0) {
    const highRiskCount = input.riskFlags.filter(f => f.severity === "high").length;
    const mediumRiskCount = input.riskFlags.filter(f => f.severity === "medium").length;

    if (highRiskCount > 0) {
      // High risk: reduce by 15% per flag (max 30% reduction)
      const multiplier = Math.max(0.7, 1 - (highRiskCount * 0.15));
      const impact = currentAmount * (multiplier - 1);
      currentAmount = currentAmount * multiplier;
      adjustments.push({
        reason: `Risk adjustment: ${highRiskCount} high-severity flag(s)`,
        multiplier,
        impact,
      });
      disclaimers.push("Loan amount adjusted due to identified risk factors.");
      confidence = "low";
    } else if (mediumRiskCount > 0) {
      // Medium risk: reduce by 8% per flag (max 20% reduction)
      const multiplier = Math.max(0.8, 1 - (mediumRiskCount * 0.08));
      const impact = currentAmount * (multiplier - 1);
      currentAmount = currentAmount * multiplier;
      adjustments.push({
        reason: `Risk adjustment: ${mediumRiskCount} medium-severity flag(s)`,
        multiplier,
        impact,
      });
      if (confidence === "medium") {
        confidence = "medium";
      }
    }
  }

  // Step 3: Apply missing-info penalties
  const criticalMissing = input.missingFields.filter(f => 
    f.includes("crop") || f.includes("hectare") || f.includes("province")
  );
  
  if (criticalMissing.length > 0) {
    // Penalty: 10% per critical missing field (max 25% reduction)
    const penaltyPercent = Math.min(0.25, criticalMissing.length * 0.10);
    const penalty = currentAmount * penaltyPercent;
    currentAmount = currentAmount - penalty;
    adjustments.push({
      reason: `Missing information penalty: ${criticalMissing.length} critical field(s)`,
      penalty: penaltyPercent,
      impact: -penalty,
    });
    disclaimers.push("Loan amount reduced due to incomplete information. Provide more details for a better estimate.");
    confidence = "low";
  }

  // Step 4: Clamp by policy min/max
  if (currentAmount < policy.minLoanAmount) {
    const impact = policy.minLoanAmount - currentAmount;
    currentAmount = policy.minLoanAmount;
    adjustments.push({
      reason: `Adjusted to minimum loan amount (PHP ${policy.minLoanAmount.toLocaleString()})`,
      impact,
    });
  } else if (currentAmount > policy.maxLoanAmount) {
    const impact = policy.maxLoanAmount - currentAmount;
    currentAmount = policy.maxLoanAmount;
    adjustments.push({
      reason: `Adjusted to maximum loan amount (PHP ${policy.maxLoanAmount.toLocaleString()})`,
      impact,
    });
    disclaimers.push(`Loan amount capped at policy maximum of PHP ${policy.maxLoanAmount.toLocaleString()}.`);
  }

  // Step 5: Round to nearest increment
  const suggestedAmount = Math.round(currentAmount / policy.roundingIncrement) * policy.roundingIncrement;

  // Add standard disclaimers
  disclaimers.push("This is a suggested loan amount. Final approval is subject to review and verification.");

  return {
    suggestedAmount,
    baseAmount,
    adjustments,
    disclaimers,
    confidence,
  };
}
