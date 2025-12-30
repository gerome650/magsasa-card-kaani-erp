/**
 * Farmacy recommendation engine (deterministic rules only)
 * 
 * Generates agricultural recommendations based on soil estimates and crop requirements.
 * Uses deterministic rules - no AI/ML inference.
 */

import { SoilEstimate } from "./soilEstimate";

export interface Recommendation {
  category: string;
  action: string;
  rationale: string;
  priority: "low" | "medium" | "high";
  rulesetVersion: string;
}

const RULESET_VERSION = "v0.1";

/**
 * Crop-specific optimal ranges (deterministic baseline data)
 */
const CROP_REQUIREMENTS: Record<string, {
  optimalpH: { min: number; max: number };
  optimalN: { min: number; max: number }; // kg/ha
  optimalP: { min: number; max: number }; // kg/ha
  optimalK: { min: number; max: number }; // kg/ha
}> = {
  palay: {
    optimalpH: { min: 5.5, max: 7.0 },
    optimalN: { min: 80, max: 120 },
    optimalP: { min: 20, max: 40 },
    optimalK: { min: 100, max: 150 },
  },
  rice: {
    optimalpH: { min: 5.5, max: 7.0 },
    optimalN: { min: 80, max: 120 },
    optimalP: { min: 20, max: 40 },
    optimalK: { min: 100, max: 150 },
  },
  mais: {
    optimalpH: { min: 5.8, max: 7.5 },
    optimalN: { min: 120, max: 180 },
    optimalP: { min: 30, max: 50 },
    optimalK: { min: 150, max: 200 },
  },
  corn: {
    optimalpH: { min: 5.8, max: 7.5 },
    optimalN: { min: 120, max: 180 },
    optimalP: { min: 30, max: 50 },
    optimalK: { min: 150, max: 200 },
  },
  // Fallback for unknown crops
  default: {
    optimalpH: { min: 6.0, max: 7.0 },
    optimalN: { min: 80, max: 120 },
    optimalP: { min: 20, max: 40 },
    optimalK: { min: 100, max: 150 },
  },
};

/**
 * Compute farmacy recommendations from soil estimate and crop
 * 
 * Deterministic rules:
 * - pH adjustment if outside optimal range
 * - Nutrient recommendations if below optimal levels
 * - Conservative language throughout
 * 
 * @param soilEstimate Soil analysis data
 * @param crop Crop type (e.g., "palay", "corn")
 * @returns Array of recommendations with rationale
 */
export function computeFarmacyRecommendations(
  soilEstimate: SoilEstimate | null,
  crop: string
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Guard: If no soil estimate, return fallback recommendation
  if (!soilEstimate) {
    recommendations.push({
      category: "soil_analysis",
      action: "Consider conducting soil analysis for accurate recommendations",
      rationale: "Soil data not available. Recommendations based on general best practices.",
      priority: "medium",
      rulesetVersion: RULESET_VERSION,
    });
    return recommendations;
  }

  // Normalize crop name (lowercase)
  const cropNormalized = crop.toLowerCase().trim();
  const cropReq = CROP_REQUIREMENTS[cropNormalized] || CROP_REQUIREMENTS.default;

  // Rule 1: pH adjustment
  if (soilEstimate.pH < cropReq.optimalpH.min) {
    const diff = cropReq.optimalpH.min - soilEstimate.pH;
    recommendations.push({
      category: "soil_pH",
      action: `Consider applying lime to raise soil pH from ${soilEstimate.pH.toFixed(1)} to optimal range (${cropReq.optimalpH.min}-${cropReq.optimalpH.max})`,
      rationale: `Soil pH is below optimal range for ${crop}. Low pH can limit nutrient availability.`,
      priority: diff > 1.0 ? "high" : "medium",
      rulesetVersion: RULESET_VERSION,
    });
  } else if (soilEstimate.pH > cropReq.optimalpH.max) {
    const diff = soilEstimate.pH - cropReq.optimalpH.max;
    recommendations.push({
      category: "soil_pH",
      action: `Consider applying sulfur or organic matter to lower soil pH from ${soilEstimate.pH.toFixed(1)} to optimal range (${cropReq.optimalpH.min}-${cropReq.optimalpH.max})`,
      rationale: `Soil pH is above optimal range for ${crop}. High pH can cause nutrient deficiencies.`,
      priority: diff > 1.0 ? "high" : "medium",
      rulesetVersion: RULESET_VERSION,
    });
  }

  // Rule 2: Nitrogen deficiency
  if (soilEstimate.nitrogen < cropReq.optimalN.min) {
    const deficit = cropReq.optimalN.min - soilEstimate.nitrogen;
    recommendations.push({
      category: "fertilizer",
      action: `Apply nitrogen fertilizer. Target level: ${cropReq.optimalN.min}-${cropReq.optimalN.max} kg/ha (current: ${soilEstimate.nitrogen} kg/ha)`,
      rationale: `Nitrogen levels are below optimal range for ${crop}. Nitrogen is essential for vegetative growth and yield.`,
      priority: deficit > 30 ? "high" : "medium",
      rulesetVersion: RULESET_VERSION,
    });
  }

  // Rule 3: Phosphorus deficiency
  if (soilEstimate.phosphorus < cropReq.optimalP.min) {
    const deficit = cropReq.optimalP.min - soilEstimate.phosphorus;
    recommendations.push({
      category: "fertilizer",
      action: `Apply phosphorus fertilizer. Target level: ${cropReq.optimalP.min}-${cropReq.optimalP.max} kg/ha (current: ${soilEstimate.phosphorus} kg/ha)`,
      rationale: `Phosphorus levels are below optimal range for ${crop}. Phosphorus supports root development and flowering.`,
      priority: deficit > 10 ? "high" : "medium",
      rulesetVersion: RULESET_VERSION,
    });
  }

  // Rule 4: Potassium deficiency
  if (soilEstimate.potassium < cropReq.optimalK.min) {
    const deficit = cropReq.optimalK.min - soilEstimate.potassium;
    recommendations.push({
      category: "fertilizer",
      action: `Apply potassium fertilizer. Target level: ${cropReq.optimalK.min}-${cropReq.optimalK.max} kg/ha (current: ${soilEstimate.potassium} kg/ha)`,
      rationale: `Potassium levels are below optimal range for ${crop}. Potassium improves stress tolerance and crop quality.`,
      priority: deficit > 30 ? "high" : "medium",
      rulesetVersion: RULESET_VERSION,
    });
  }

  // Rule 5: Organic matter (general recommendation if low)
  if (soilEstimate.organicMatter < 2.0) {
    recommendations.push({
      category: "soil_health",
      action: "Consider adding organic matter (compost, manure) to improve soil structure and nutrient retention",
      rationale: `Soil organic matter (${soilEstimate.organicMatter}%) is below recommended levels. Organic matter improves soil health and water retention.`,
      priority: "medium",
      rulesetVersion: RULESET_VERSION,
    });
  }

  // Fallback: If no specific issues found, provide general best practices
  if (recommendations.length === 0) {
    recommendations.push({
      category: "general",
      action: "Monitor crop growth and consider soil testing for detailed nutrient analysis",
      rationale: "Soil parameters appear within acceptable ranges. Regular monitoring recommended.",
      priority: "low",
      rulesetVersion: RULESET_VERSION,
    });
  }

  return recommendations;
}
