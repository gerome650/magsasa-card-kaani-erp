import { RiskFlagsArtifact } from "./types";
import { FlowState } from "./types";

/**
 * Build risk flags artifact
 */
export function buildRiskFlagsArtifact(
  flowState: FlowState | null | undefined,
  loanSummary: { crop?: string; hectares?: number; location?: { province?: string; municipality?: string; barangay?: string } }
): RiskFlagsArtifact {
  const slots = flowState?.slots || {};
  const flags: Array<{ code: string; severity: "low" | "medium" | "high"; description: string; mitigation?: string }> = [];

  // Weather risk (rainfed irrigation)
  const irrigationType = slots.irrigationType || slots.irrigation || slots.irrigation_type;
  if (irrigationType && (irrigationType.toString().toLowerCase().includes("rainfed") || irrigationType.toString().toLowerCase().includes("rain-fed"))) {
    flags.push({
      code: "WEATHER_RISK",
      severity: "high",
      description: "Rainfed irrigation - vulnerable to drought and weather extremes",
      mitigation: "Consider irrigation backup plans or weather insurance",
    });
  }

  // Labor risk (large farm without labor discussion)
  if (loanSummary.hectares && loanSummary.hectares > 2) {
    const hasLabor = slots.labor || slots.laborCost || slots.labor_cost;
    if (!hasLabor) {
      flags.push({
        code: "LABOR_RISK",
        severity: "medium",
        description: "Large farm size (>2 ha) without labor cost specification",
        mitigation: "Clarify labor sourcing and costs",
      });
    }
  }

  // Location risk
  if (!loanSummary.location?.province && !loanSummary.location?.municipality) {
    flags.push({
      code: "LOCATION_RISK",
      severity: "medium",
      description: "Location not specified - cannot assess regional risks",
      mitigation: "Collect province/municipality for regional risk assessment",
    });
  }

  // Crop/agronomy risk
  if (!loanSummary.crop) {
    flags.push({
      code: "AGRO_RISK",
      severity: "medium",
      description: "Primary crop not specified",
      mitigation: "Collect crop type for appropriate agronomic assessment",
    });
  }

  // Small farm size risk (optional)
  if (loanSummary.hectares && loanSummary.hectares < 0.5) {
    flags.push({
      code: "SCALE_RISK",
      severity: "low",
      description: "Very small farm size (<0.5 ha) may have limited profitability",
      mitigation: "Assess viability and consider crop diversification",
    });
  }

  return {
    id: "risk_flags_v1",
    type: "risk_flags",
    title: "Risk Flags",
    version: "v1",
    data: {
      flags,
    },
  };
}

