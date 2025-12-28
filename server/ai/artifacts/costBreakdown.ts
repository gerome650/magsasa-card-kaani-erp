import { CostBreakdownArtifact } from "./types";
import { FlowState } from "./types";
import { INPUT_CATEGORIES } from "./data/inputCategories";
import { getCropBenchmark } from "./data/cropBudgetBenchmarks";

/**
 * Category weights (percentages) for splitting total cost
 */
const CATEGORY_WEIGHTS: Record<string, number> = {
  seeds: 12,
  fertilizer: 25,
  pesticide: 10,
  labor: 25,
  irrigation: 8,
  land_prep: 8,
  harvest: 7,
  logistics: 3,
  misc: 2,
};

/**
 * Round to nearest 10 pesos
 */
function roundToNearest10(value: number): number {
  return Math.round(value / 10) * 10;
}

/**
 * Build cost breakdown artifact
 */
export function buildCostBreakdownArtifact(
  flowState: FlowState | null | undefined,
  loanSummary: { crop?: string; hectares?: number }
): CostBreakdownArtifact {
  const slots = flowState?.slots || {};
  
  const crop = loanSummary.crop;
  const hectares = loanSummary.hectares;

  const benchmark = getCropBenchmark(crop);
  
  let total = { min: 0, max: 0 };
  let perHectare: { min: number; max: number } | undefined;
  const assumptions: string[] = [];
  let confidence: "low" | "medium" | "high" = "low";

  if (benchmark && hectares && hectares > 0) {
    perHectare = benchmark.costPerHa;
    total = {
      min: roundToNearest10(perHectare.min * hectares),
      max: roundToNearest10(perHectare.max * hectares),
    };
    confidence = "high";
    assumptions.push(`Using ${crop} benchmark: PHP ${perHectare.min.toLocaleString()} - ${perHectare.max.toLocaleString()} per hectare`);
  } else {
    if (!crop) {
      assumptions.push("Crop type not specified - cannot estimate costs");
    }
    if (!hectares || hectares <= 0) {
      assumptions.push("Farm size not specified - cannot calculate total");
    }
    if (!benchmark && crop) {
      assumptions.push(`No benchmark data available for ${crop}`);
      confidence = "low";
    } else if (benchmark && !hectares) {
      confidence = "medium";
    }
  }

  // Build line items by splitting total into categories
  const lineItems = INPUT_CATEGORIES.map(cat => {
    const weight = CATEGORY_WEIGHTS[cat.key] || 0;
    const min = roundToNearest10((total.min * weight) / 100);
    const max = roundToNearest10((total.max * weight) / 100);
    return {
      category: cat.key,
      label: cat.label,
      min,
      max,
    };
  });

  return {
    id: "cost_breakdown_v1",
    type: "cost_breakdown",
    title: "Cost Breakdown",
    version: "v1",
    data: {
      currency: "PHP",
      total,
      perHectare,
      lineItems,
      assumptions: assumptions.length > 0 ? assumptions : ["Cost breakdown based on crop benchmark"],
      confidence,
    },
  };
}

