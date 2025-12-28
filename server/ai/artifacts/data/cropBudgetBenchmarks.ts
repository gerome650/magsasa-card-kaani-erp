/**
 * Baseline crop budget benchmarks (per hectare)
 * TODO: Replace with CARD/LandBank tables later
 */
export const CROP_BUDGET_BENCHMARKS: Record<string, { currency: string; costPerHa: { min: number; max: number }; typicalCycleDays: number }> = {
  palay: { currency: "PHP", costPerHa: { min: 35000, max: 65000 }, typicalCycleDays: 110 },
  rice: { currency: "PHP", costPerHa: { min: 35000, max: 65000 }, typicalCycleDays: 110 },
  mais: { currency: "PHP", costPerHa: { min: 25000, max: 55000 }, typicalCycleDays: 95 },
  corn: { currency: "PHP", costPerHa: { min: 25000, max: 55000 }, typicalCycleDays: 95 },
};

/**
 * Normalize crop name to benchmark key
 */
export function normalizeCropName(crop: string | undefined | null): string | null {
  if (!crop) return null;
  const normalized = crop.toLowerCase().trim();
  // Map common variations to benchmark keys
  if (normalized.includes("palay") || normalized.includes("rice")) {
    return normalized.includes("palay") ? "palay" : "rice";
  }
  if (normalized.includes("mais") || normalized.includes("corn")) {
    return normalized.includes("mais") ? "mais" : "corn";
  }
  return normalized;
}

/**
 * Get benchmark for a crop
 */
export function getCropBenchmark(crop: string | undefined | null): { currency: string; costPerHa: { min: number; max: number }; typicalCycleDays: number } | null {
  const normalized = normalizeCropName(crop);
  if (!normalized) return null;
  return CROP_BUDGET_BENCHMARKS[normalized] || null;
}

