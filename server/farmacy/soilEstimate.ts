/**
 * Soil estimation from GIS data (stub implementation for v0)
 * 
 * This is a baseline stub that always returns a conservative estimate.
 * Future versions will integrate with actual GIS data sources.
 */

export interface GeoLocation {
  latitude?: number;
  longitude?: number;
  province?: string;
  municipality?: string;
  barangay?: string;
}

export interface SoilEstimate {
  pH: number;
  nitrogen: number; // kg/ha
  phosphorus: number; // kg/ha
  potassium: number; // kg/ha
  organicMatter: number; // %
  source: "gis" | "farmer_reported" | "lab";
  confidence: "low" | "medium" | "high";
  evidenceLevel: number; // 0-3
}

/**
 * Get soil estimate from geographic location
 * 
 * Stub implementation: Always returns conservative baseline estimate
 * - pH: 6.5 (neutral)
 * - Nutrients: Baseline levels
 * - Source: "gis"
 * - Confidence: "low"
 * - Evidence level: 0
 * 
 * @param geo Geographic location (latitude/longitude OR province/municipality)
 * @returns Soil estimate or null if geo is incomplete
 */
export function getSoilEstimate(geo: GeoLocation): SoilEstimate | null {
  // Guard: Require at least province OR lat/lng
  if (!geo.province && !geo.municipality && (!geo.latitude || !geo.longitude)) {
    return null;
  }

  // Stub: Return conservative baseline estimate
  // All values are conservative mid-range estimates for Philippine agricultural soils
  return {
    pH: 6.5,
    nitrogen: 50, // kg/ha (conservative baseline)
    phosphorus: 15, // kg/ha (conservative baseline)
    potassium: 120, // kg/ha (conservative baseline)
    organicMatter: 2.5, // % (conservative baseline)
    source: "gis",
    confidence: "low",
    evidenceLevel: 0,
  };
}
