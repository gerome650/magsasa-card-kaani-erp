// ─────────────────────────────────────────────────────────────
// IMPORTS
// ─────────────────────────────────────────────────────────────
import { PAGASA_WEATHER_STATIONS } from '../data/weatherStations';
import { CROP_BENCHMARKS } from '../data/cropBenchmarks';   // runtime data (named export)
import type { CropBenchmark } from '../data/cropBenchmarks'; // type-only import

// ─────────────────────────────────────────────────────────────
/** CLIMATE TYPES & DESCRIPTIONS */
// ─────────────────────────────────────────────────────────────
export enum ClimateType {
  TypeI = 'Type I',
  TypeII = 'Type II',
  TypeIII = 'Type III',
  TypeIV = 'Type IV',
  Unknown = 'Unknown'
}

export const CLIMATE_TYPE_DESCRIPTIONS: { [key in ClimateType]: string } = {
  [ClimateType.TypeI]: 'Two Pronounced Seasons (Dry: Nov–Apr; Wet: May–Oct)',
  [ClimateType.TypeII]: 'No Dry Season (Very Wet: Nov–Jan)',
  [ClimateType.TypeIII]: 'Short Dry Season (1–3 Months)',
  [ClimateType.TypeIV]: 'Evenly Distributed Rainfall',
  [ClimateType.Unknown]: 'Undetermined Pattern',
};

interface ClimateThresholds {
  rainfall: number[];
  rainyDays: number[];
  rh: number[];
}

// Universal stress thresholds (upper bounds per tier)
const CLIMATE_THRESHOLDS: ClimateThresholds = {
  rainfall:  [75, 150, 250, 400, 600, 800, Infinity],
  rainyDays: [6, 12, 18, 22, 25, 28, Infinity],
  rh:        [78, 82, 85, 88, 92, 96, Infinity],
};

// ─────────────────────────────────────────────────────────────
/** INPUT/OUTPUT TYPES (extended for Harvest Score) */
// ─────────────────────────────────────────────────────────────
export interface RiskScoreInput {
  sand?: number;
  silt?: number;
  clay?: number;
  latitude?: number;
  longitude?: number;
  cropCycleMonths?: string[];

  // NEW: Harvest Score trigger/direct fields
  triggerText?: string;              // e.g., "harvest score palay irrigated 5.2 mt/ha nueva ecija area 1.5"
  cropType?: string;                 // direct
  province?: string;                 // direct
  projectedYieldPerHa?: number;      // direct
  areaSizeHa?: number;               // direct (default 1 if missing)
  systemOrVariety?: string;          // e.g., "Irrigated", "Rainfed", "Yellow", "White"
}

export interface SoilSubScoreDetail {
  raw: number;
  factor: number;
  effective: number;
  weight: number;
  contribution: number;
}

interface SoilAnalysisResult {
  soilTexture: string;
  sand: number;
  silt: number;
  clay: number;
  subScores: {
    compaction: SoilSubScoreDetail;
    waterlogging: SoilSubScoreDetail;
    drought: SoilSubScoreDetail;
    nutrient: SoilSubScoreDetail;
  };
  dominantRisks: string;
  activityFactorsApplied: string[];
}

interface MonthlyClimateDetail {
  month: string;
  rainfall: number;
  rainyDays: number;
  humidity: number;
  finalTier: number;
  limitingFactor: string;
  monthlyScore: number;
}

interface ClimateAnalysisResult {
  overallScore: number;
  breakdown: MonthlyClimateDetail[];
  climateType: ClimateType;
  dominantHazard: string;
}

// NEW: Harvest score output
export interface HarvestScoreResult {
  score: number;                 // 0..1000 (higher = worse/higher risk)
  qualitativeTier: string;       // label
  tier: number;                  // 1..7 (1 very low perf, 7 very high perf)
  ratio: number;                 // myYield / benchmarkYield
  projectedTotalHarvest: number; // MT
  benchmarkYield: number;        // MT/ha
  benchmarkSource: string;       // justification from DB
  summary: string;               // human-readable
  cropType: string;
  province: string;
  projectedYieldPerHa: number;
  areaSizeHa: number;
  weight?: number;                // NEW: confidence weight actually used (w_h)
}

export interface RiskScoreResult {
  baselineScore: number;
  climateScore: number | null;
  soilScore: number | null;
  soilAnalysis: SoilAnalysisResult | null;
  monthlyClimateBreakdown: MonthlyClimateDetail[] | null;
  qualitativeRisk: string;
  qualitativeTier: number;
  explanation: string;
  climateType: ClimateType | null;
  climateTypeDescription: string | null;
  dominantClimateHazard: string | null;
  finalStatement: string;
  finalRecommendation: string;
  // NEW: attach harvest score (if computed)
  harvestScore?: HarvestScoreResult;
  // NEW: Alpha metrics
  alpha?: number;                // signed performance vs context
  alphaRisk?: number;            // 0–1000 (higher = higher risk)
  alphaTierLabel?: string;       // "Moderate", etc.
  alphaTier?: number;            // 1..7
}

// ─────────────────────────────────────────────────────────────
/** CONSTANTS / MAPS */
// ─────────────────────────────────────────────────────────────
const MONTH_MAP: { [key: string]: number } = {
  'january': 0, 'jan': 0, 'february': 1, 'feb': 1, 'march': 2, 'mar': 2, 'april': 3, 'apr': 3, 'may': 4, 'june': 5, 'jun': 5,
  'july': 6, 'jul': 6, 'august': 7, 'aug': 7, 'september': 8, 'sep': 8, 'october': 9, 'oct': 9, 'november': 10, 'nov': 10, 'december': 11, 'dec': 11
};

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

// ─────────────────────────────────────────────────────────────
/** GENERIC HELPERS */
// ─────────────────────────────────────────────────────────────
const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

const normalize = (sand: number, silt: number, clay: number): { sand: number; silt: number; clay: number } => {
  const total = sand + silt + clay;
  if (total <= 0) return { sand: 0, silt: 0, clay: 0 };
  if (total < 85 || total > 115) {
    return { sand: (sand / total) * 100, silt: (silt / total) * 100, clay: (clay / total) * 100 };
  }
  return { sand, silt, clay };
};

const gaussian = (x: number, mu: number, sigma: number): number => {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z);
};

const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const interpolate = (value: number, x1: number, x2: number, y1: number, y2: number): number => {
  if (x2 - x1 === 0) return y1;
  const score = y1 + (y2 - y1) * ((value - x1) / (x2 - x1));
  return Math.max(Math.min(score, Math.max(y1, y2)), Math.min(y1, y2));
};

const getQualitativeTier = (score: number): { tier: number, label: string } => {
  if (score < 100) return { tier: 1, label: 'Very Low' };
  if (score <= 249) return { tier: 2, label: 'Low' };
  if (score <= 399) return { tier: 3, label: 'Moderately Low' };
  if (score <= 549) return { tier: 4, label: 'Moderate' };
  if (score <= 699) return { tier: 5, label: 'Moderately High' };
  if (score <= 849) return { tier: 6, label: 'High' };
  return { tier: 7, label: 'Very High' };
};

// ─────────────────────────────────────────────────────────────
/** USDA TEXTURE CLASS */
// ─────────────────────────────────────────────────────────────
const getSoilTexture = (sand: number, silt: number, clay: number): string => {
  if (silt + 1.5 * clay < 15) return 'Sand';
  if (silt + 1.5 * clay >= 15 && silt + 1.5 * clay < 30) return 'Loamy Sand';
  if (clay >= 7 && clay < 20 && sand > 52 && silt + 2 * clay >= 30) return 'Sandy Loam';
  if (clay >= 7 && clay < 27 && silt >= 28 && silt < 50 && sand <= 52) return 'Loam';
  if ((silt >= 50 && clay >= 12 && clay < 27) || (silt >= 50 && silt < 80 && clay < 12)) return 'Silt Loam';
  if (silt >= 80 && clay < 12) return 'Silt';
  if (clay >= 20 && clay < 35 && silt < 28 && sand > 45) return 'Sandy Clay Loam';
  if (clay >= 27 && clay < 40 && sand > 20 && sand <= 45) return 'Clay Loam';
  if (clay >= 27 && clay < 40 && silt >= 40) return 'Silty Clay Loam';
  if (clay >= 35 && sand > 45) return 'Sandy Clay';
  if (clay >= 40 && silt >= 40) return 'Silty Clay';
  if (clay >= 40 && sand <= 45 && silt < 40) return 'Clay';
  return 'Unknown';
};

// ─────────────────────────────────────────────────────────────
/** SOIL SUBSCORES (TEXTURE-ONLY) */
// ─────────────────────────────────────────────────────────────
const calculateCompactionRisk = (sand: number, silt: number, clay: number): number => {
  const dS = Math.abs(sand - 40);
  const dSi = Math.abs(silt - 40);
  const dC = Math.abs(clay - 20);
  const loamDistance = (dS + dSi + dC) / 3;

  const siltDrive = (silt / 100) * 600;
  const clayBoost = gaussian(clay, 25, 8) * 250;
  const loamBoost = clamp(1 - loamDistance / 40, 0, 1) * 120;

  const sandMitigation = clamp((sand - 80) / 20, 0, 1) * 250;
  const clayMitigation = clamp((clay - 60) / 40, 0, 1) * 180;

  const rawScore = siltDrive + clayBoost + loamBoost - sandMitigation - clayMitigation;
  return clamp(rawScore, 0, 1000);
};

const calculateWaterloggingRisk = (sand: number, silt: number, clay: number): number => {
  const clayDrive = (clay / 100) * 550;
  const siltBoost = gaussian(silt, 45, 12) * 220;
  const lowSandBoost = clamp((30 - sand) / 30, 0, 1) * 200;
  const veryClayExtra = clamp((clay - 60) / 40, 0, 1) * 150;
  const sandMitigation = clamp((sand - 60) / 40, 0, 1) * 500;
  const lowSiltMitigation = clamp((10 - silt) / 10, 0, 1) * 60;
  const raw = clayDrive + siltBoost + lowSandBoost + veryClayExtra - sandMitigation - lowSiltMitigation;
  return clamp(raw, 0, 1000);
};

const calculateDroughtStressRisk = (sand: number, silt: number, clay: number): number => {
  const dS = Math.abs(sand - 40);
  const dSi = Math.abs(silt - 40);
  const dC = Math.abs(clay - 20);
  const loamDistance = (dS + dSi + dC) / 3;

  const sandDrive = (sand / 100) * 600;
  const verySandyExtra = clamp((sand - 60) / 40, 0, 1) * 200;
  const clayAway = (1 - gaussian(clay, 25, 10)) * 250;
  const extremeClayPenalty = clamp((clay - 55) / 45, 0, 1) * 120;
  const lowFinesPenalty = clamp((20 - (silt + clay)) / 20, 0, 1) * 120;
  const siltMitigation = gaussian(silt, 45, 10) * 250;
  const loamMitigation = clamp(1 - loamDistance / 40, 0, 1) * 80;

  const raw = sandDrive + verySandyExtra + clayAway + extremeClayPenalty + lowFinesPenalty - siltMitigation - loamMitigation;
  return clamp(raw, 0, 1000);
};

const calculateNutrientManagementRisk = (sand: number, silt: number, clay: number): number => {
  const sandDrive = (sand / 100) * 450;
  const fines = silt + clay;
  const lowFinesPenalty = clamp((20 - fines) / 20, 0, 1) * 250;
  const lowClayPenalty = clamp((10 - clay) / 10, 0, 1) * 300;
  const veryHighClayPenalty = clamp((clay - 45) / 55, 0, 1) * 120;
  const clayMitigation = gaussian(clay, 35, 10) * 250;
  const siltMitigation = gaussian(silt, 45, 12) * 100;
  const raw = sandDrive + lowFinesPenalty + lowClayPenalty + veryHighClayPenalty - clayMitigation - siltMitigation;
  return clamp(raw, 0, 1000);
};

// ─────────────────────────────────────────────────────────────
/** CLIMATE RISK */
// ─────────────────────────────────────────────────────────────
const determineClimateType = (yearlyData: { rainfall: number; rainyDays: number }[]): ClimateType => {
  const dryMonthsRainfallCount = yearlyData.slice(10, 12).concat(yearlyData.slice(0, 4)).filter(m => m.rainfall <= 150).length;
  if (dryMonthsRainfallCount >= 5) return ClimateType.TypeI;

  const wetMonthsMaxCount = yearlyData.slice(11, 12).concat(yearlyData.slice(0, 2)).filter(m => m.rainfall > 450).length;
  if (wetMonthsMaxCount >= 2) return ClimateType.TypeII;

  const shortDrySpellCount = yearlyData.filter(m => m.rainfall <= 175 && m.rainyDays <= 12).length;
  if (shortDrySpellCount >= 1 && shortDrySpellCount <= 3) return ClimateType.TypeIII;

  const evenlyDistributedCount = yearlyData.filter(m => m.rainfall >= 100 && m.rainfall <= 700).length;
  if (evenlyDistributedCount >= 10) return ClimateType.TypeIV;

  if (yearlyData.slice(10, 12).concat(yearlyData.slice(0, 4)).every(m => m.rainfall <= 200)) return ClimateType.TypeI;
  if (yearlyData.some(m => m.rainfall > 700)) return ClimateType.TypeII;

  return ClimateType.Unknown;
};

const getTier = (val: number, thresholds: number[]): number => {
  for (let i = 0; i < thresholds.length; i++) {
    if (val <= thresholds[i]) return i + 1;
  }
  return thresholds.length;
};

const calculateClimateScore = (latitude: number, longitude: number, cropCycleMonths: string[]): ClimateAnalysisResult | null => {
  const stationsWithDist = PAGASA_WEATHER_STATIONS
    .map(s => ({ ...s, dist: haversineDistance(latitude, longitude, s.lat, s.lon) }))
    .sort((a, b) => a.dist - b.dist);

  if (stationsWithDist.length === 0) return null;
  const s1 = stationsWithDist[0];
  const s2 = stationsWithDist.length > 1 ? stationsWithDist[1] : s1;

  const totalDist = s1.dist + s2.dist;
  const w1 = totalDist > 0 ? 1 - (s1.dist / totalDist) : 1;
  const w2 = totalDist > 0 ? 1 - (s2.dist / totalDist) : 0;

  const yearlyInterpolatedData = MONTH_NAMES.map((_, i) => ({
    rainfall: (s1.rainfall[i] * w1) + (s2.rainfall[i] * w2),
    rainyDays: (s1.rainyDays[i] * w1) + (s2.rainyDays[i] * w2),
    humidity: (s1.relativeHumidity[i] * w1) + (s2.relativeHumidity[i] * w2),
  }));

  const climateType = determineClimateType(yearlyInterpolatedData);
  const thresholds = CLIMATE_THRESHOLDS;

  const monthIndices = cropCycleMonths
    .map(m => MONTH_MAP[m.toLowerCase()])
    .filter((m): m is number => m !== undefined);

  if (monthIndices.length === 0) return { overallScore: 10, breakdown: [], climateType: ClimateType.Unknown, dominantHazard: 'No crop cycle data' };

  const scoreRanges = [0, 143, 286, 429, 571, 714, 857, 1000];

  const monthlyDetails: MonthlyClimateDetail[] = monthIndices.map(monthIndex => {
    const data = yearlyInterpolatedData[monthIndex];

    const rainfallTier = getTier(data.rainfall, thresholds.rainfall);
    const rainyDaysTier = getTier(data.rainyDays, thresholds.rainyDays);
    const humidityTier = getTier(data.humidity, thresholds.rh);

    const finalTier = Math.max(rainfallTier, rainyDaysTier, humidityTier);

    let limitingFactor = 'Rainfall';
    if (rainyDaysTier === finalTier) limitingFactor = 'Rainy Days';
    if (humidityTier === finalTier) limitingFactor = 'Humidity';

    let monthlyScore = 10;
    if (finalTier > 1) {
      let val = data.rainfall, thresholdsToUse = thresholds.rainfall;
      if (limitingFactor === 'Rainy Days') { val = data.rainyDays; thresholdsToUse = thresholds.rainyDays; }
      if (limitingFactor === 'Humidity') { val = data.humidity; thresholdsToUse = thresholds.rh; }

      const lowerBoundVal = finalTier > 1 ? thresholdsToUse[finalTier - 2] : 0;
      const upperBoundVal = thresholdsToUse[finalTier - 1];

      monthlyScore = interpolate(
        val,
        lowerBoundVal,
        upperBoundVal,
        scoreRanges[finalTier - 1],
        scoreRanges[finalTier]
      );
    }

    return {
      month: MONTH_NAMES[monthIndex],
      rainfall: data.rainfall,
      rainyDays: data.rainyDays,
      humidity: data.humidity,
      finalTier,
      limitingFactor,
      monthlyScore: Math.round(clamp(monthlyScore, 10, 1000)),
    };
  });

  const monthlyScores = monthlyDetails.map(d => d.monthlyScore);

  let overallScore = 10;
  if (monthlyScores.length > 0) {
    const weights = softmaxWeights(monthlyScores, 150);
    overallScore = monthlyScores.reduce((sum, score, index) => sum + (score * weights[index]), 0);
  }

  const dominantHazard = monthlyDetails.length > 0
    ? `Persistent wetness, high rainfall and humidity, ${climateType} pattern.`
    : 'N/A';

  return {
    overallScore: Math.round(clamp(overallScore, 10, 1000)),
    breakdown: monthlyDetails,
    climateType,
    dominantHazard
  };
};

// ─────────────────────────────────────────────────────────────
/** DYNAMIC WEIGHTING (SOFTMAX) */
// ─────────────────────────────────────────────────────────────
const softmaxWeights = (scores: number[], T = 150): number[] => {
  const maxS = Math.max(...scores);
  const exps = scores.map(s => Math.exp((s - maxS) / T));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => sum > 0 ? e / sum : 1 / scores.length);
};

const clampWeights = (ws: number[], floors = [0.10, 0.10, 0.10, 0.10], caps = [0.55, 0.55, 0.55, 0.55]): number[] => {
  const w = ws.map((v, i) => clamp(v, floors[i], caps[i]));
  const sum = w.reduce((a, b) => a + b, 0);
  return w.map(v => sum > 0 ? v / sum : 1 / w.length);
};

const computeActivityFactors = (climate: ClimateAnalysisResult | null) => {
  const factors = { drought: 1.0, waterlogging: 1.0, nutrient: 1.0, compaction: 1.0 };
  const applied: string[] = [];

  if (!climate || climate.breakdown.length === 0) return { factors, applied };

  const avgRain = climate.breakdown.reduce((s, m) => s + m.rainfall, 0) / climate.breakdown.length;
  const avgDays = climate.breakdown.reduce((s, m) => s + m.rainyDays, 0) / climate.breakdown.length;
  const avgRH   = climate.breakdown.reduce((s, m) => s + m.humidity, 0) / climate.breakdown.length;

  if (avgRain > 150) {
    factors.drought = 0.5;
    factors.nutrient = 1.2;
    applied.push('Rainfall > 150mm → Drought×0.5, Nutrient×1.2');
  }
  if (avgRain < 100) {
    factors.waterlogging = 0.6;
    applied.push('Rainfall < 100mm → Waterlogging×0.6');
  }
  if (avgRH > 80 && avgDays > 10) {
    factors.compaction = 1.1;
    applied.push('Humidity > 80% → Compaction×1.1');
  }

  return { factors, applied };
};

const calculateDynamicallyWeightedSoilScore = (
  baseScores: { nutrient: number; drought: number; waterlogging: number; compaction: number; },
  climateAnalysis: ClimateAnalysisResult | null,
): {
  finalScore: number,
  details: SoilAnalysisResult['subScores'],
  activityFactorsApplied: string[]
} => {
  const { factors, applied: activityFactorsApplied } = computeActivityFactors(climateAnalysis);

  const effective = {
    nutrient: baseScores.nutrient * factors.nutrient,
    drought: baseScores.drought * factors.drought,
    waterlogging: baseScores.waterlogging * factors.waterlogging,
    compaction: baseScores.compaction * factors.compaction,
  };

  const rawW = softmaxWeights([
    effective.nutrient, effective.drought, effective.waterlogging, effective.compaction
  ], 150);

  const finalW = clampWeights(rawW);

  const soilScore =
    finalW[0] * effective.nutrient +
    finalW[1] * effective.drought +
    finalW[2] * effective.waterlogging +
    finalW[3] * effective.compaction;

  const details = {
    nutrient: { raw: Math.round(baseScores.nutrient), factor: factors.nutrient, effective: Math.round(effective.nutrient), weight: finalW[0], contribution: Math.round(finalW[0] * effective.nutrient) },
    drought: { raw: Math.round(baseScores.drought), factor: factors.drought, effective: Math.round(effective.drought), weight: finalW[1], contribution: Math.round(finalW[1] * effective.drought) },
    waterlogging: { raw: Math.round(baseScores.waterlogging), factor: factors.waterlogging, effective: Math.round(effective.waterlogging), weight: finalW[2], contribution: Math.round(finalW[2] * effective.waterlogging) },
    compaction: { raw: Math.round(baseScores.compaction), factor: factors.compaction, effective: Math.round(effective.compaction), weight: finalW[3], contribution: Math.round(finalW[3] * effective.compaction) },
  };

  return {
    finalScore: Math.round(clamp(soilScore, 10, 1000)),
    details,
    activityFactorsApplied
  };
};

// ─────────────────────────────────────────────────────────────
/** HARVEST SCORE HELPERS (uses your benchmark DB) */
// ─────────────────────────────────────────────────────────────
type HarvestTier = { tier: number; label: string };

const getHarvestPerformanceTier = (score: number): HarvestTier => {
  // Higher score = worse performance relative to benchmark
  if (score > 849) return { tier: 1, label: 'Very Low Performance' };
  if (score >= 700) return { tier: 2, label: 'Low Performance' };
  if (score >= 550) return { tier: 3, label: 'Moderately Low Performance' };
  if (score >= 400) return { tier: 4, label: 'Moderate Performance' };
  if (score >= 250) return { tier: 5, label: 'Moderately High Performance' };
  if (score >= 100) return { tier: 6, label: 'High Performance' };
  return { tier: 7, label: 'Very High Performance' };
};

// --- string normalizers / helpers ---
const _norm = (s?: string) => String(s ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
const _splitProvs = (s: string) => _norm(s).split(',').map(x => x.trim()).filter(Boolean);
const _confRank = (c: string) => ({ high: 3, medium: 2, low: 1 }[_norm(c)] ?? 0);

// --- crop aliases so "palay" matches DB name "Palay (Rice)" ---
const CROP_ALIAS: Record<string, string> = {
  'palay': 'Palay (Rice)',
  'rice': 'Palay (Rice)',
  'mais': 'Corn (Maize)',
  'corn': 'Corn (Maize)',
  // add more aliases as needed...
};

function normalizeCropName(raw?: string): string | undefined {
  if (!raw) return raw;
  const key = raw.toLowerCase().trim();
  return CROP_ALIAS[key] ?? raw;
}

function titleCase(s?: string): string {
  if (!s) return '';
  return s
    .toLowerCase()
    .split(/\s+/)
    .map(w => w ? w[0].toUpperCase() + w.slice(1) : '')
    .join(' ')
    .trim();
}

function pickBest(cands: CropBenchmark[]): CropBenchmark | null {
  if (!cands.length) return null;
  // Prefer higher confidence; if tie, prefer stricter (higher) benchmark
  return [...cands].sort((a, b) => {
    const cr = _confRank(b.confidenceLevel) - _confRank(a.confidenceLevel);
    if (cr !== 0) return cr;
    return (b.recommendedMinimumYield ?? 0) - (a.recommendedMinimumYield ?? 0);
  })[0];
}


// NEW: Confidence weight for Harvest benchmark
function computeHarvestConfidenceWeight(opts: {
  confidenceLevel?: 'high'|'medium'|'low';
  spatial: 'exact'|'grouped'|'all';
  systemMatch: 'exact'|'close'|'none';
  yearsSince?: number;    // optional, from benchmark year if available
  sampleSize?: number;    // optional, if your DB has it
}): number {
  const base = opts.confidenceLevel === 'high' ? 1.00
            : opts.confidenceLevel === 'medium' ? 0.85
            : opts.confidenceLevel === 'low' ? 0.70 : 0.85;

  const spatial = opts.spatial === 'exact' ? 1.00
                  : opts.spatial === 'grouped' ? 0.98 : 0.95;

  const system = opts.systemMatch === 'exact' ? 1.00
               : opts.systemMatch === 'close' ? 0.95 : 0.88;

  let recency = 0.95; // default if unknown
  if (typeof opts.yearsSince === 'number') {
    const y = opts.yearsSince;
    recency = y <= 2 ? 1.00 : y <= 4 ? 0.95 : y <= 6 ? 0.90 : y <= 9 ? 0.85 : 0.80;
  }

  //let sample = 1.00; // default if unknown
  //if (typeof opts.sampleSize === 'number') {
    //const n = opts.sampleSize;
    //sample = n >= 100 ? 1.00 : n >= 30 ? 0.95 : n >= 10 ? 0.90 : 0.85;
  const sample = 1.00;
  //}

  const w = base * spatial * system * recency * sample;
  return Math.min(1.00, Math.max(0.50, w)); // clamp to [0.50, 1.00]
}


type SpatialMatch = 'exact'|'grouped'|'all';
type SystemMatch = 'exact'|'close'|'none';

function classifyBenchmarkMatch(
  cropType: string,
  province: string,
  DB: CropBenchmark[],
  systemOrVariety?: string
): { spatial: SpatialMatch; system: SystemMatch; confidenceLevel?: 'high'|'medium'|'low'; yearsSince?: number; sampleSize?: number } {
  // This mirrors your findBenchmark logic to detect which bucket won.
  const cropNormName = normalizeCropName(cropType) ?? cropType;
  const cropN = _norm(cropNormName);
  const provN = _norm(province);
  const sysN  = _norm(systemOrVariety);

  let pool = DB.filter(x => _norm(x.crop).includes(cropN));

  // Try to detect system/variety exact or close matches
  let system: SystemMatch = 'none';
  if (sysN) {
    const exact = pool.filter(x => _norm(x.farmingSystemOrVariety).includes(sysN));
    if (exact.length) { pool = exact; system = 'exact'; }
    else {
      const close = DB.filter(x => _norm(x.crop).includes(cropN) && _norm(x.farmingSystemOrVariety).split(/\W+/).some(tok => sysN.includes(tok)));
      if (close.length) { system = 'close'; }
    }
  }

  // Spatial bucket detection (same order as findBenchmark)
  let spatial: SpatialMatch = 'all';
  if (pool.some(x => _norm(x.province) === provN)) spatial = 'exact';
  else if (pool.some(x => _splitProvs(x.province).includes(provN))) spatial = 'grouped';
  else spatial = 'all';

  // Meta info (if present in DB rows you picked)
  const candidate = pool.find(x => _norm(x.province) === provN)
                 ?? pool.find(x => _splitProvs(x.province).includes(provN))
                 ?? pool.find(x => _norm(x.province) === 'all provinces')
                 ?? null;

  // Optional extraction from your DB
  const confidenceLevelRaw = candidate?.confidenceLevel as string | undefined;
  const confidenceLevel = confidenceLevelRaw
    ? (_norm(confidenceLevelRaw) as 'high' | 'medium' | 'low')
    : undefined;


  // Try to derive recency (example: parse year from justification string like "PhilRice 2024")
  let yearsSince: number | undefined;
  if (candidate?.justification) {
    const m = String(candidate.justification).match(/\b(20\d{2})\b/);
    if (m) {
      const yr = Number(m[1]);
      const now = new Date().getFullYear();
      if (yr >= 1990 && yr <= now) yearsSince = now - yr;
    }
  }

  // If your DB has sample size, map it here; otherwise leave undefined
  const sampleSize: number | undefined = (candidate as any)?.sampleSize;

  return { spatial, system, confidenceLevel, yearsSince, sampleSize };
}



function findBenchmark(
  cropType: string,
  province: string,
  DB: CropBenchmark[],
  systemOrVariety?: string
): CropBenchmark | null {
  // normalize crop to DB naming (e.g., "palay" -> "Palay (Rice)")
  const cropNormName = normalizeCropName(cropType) ?? cropType;

  const cropN = _norm(cropNormName);
  const provN = _norm(province);
  const sysN  = _norm(systemOrVariety);

  // Crop filter first (substring so "Palay" matches "Palay (Rice)")
  let pool = DB.filter(x => _norm(x.crop).includes(cropN));

  // Respect system/variety when provided (Irrigated/Rainfed/Yellow/White/etc.)
  if (sysN) {
    const sPool = pool.filter(x => _norm(x.farmingSystemOrVariety).includes(sysN));
    if (sPool.length) pool = sPool;
  }

  // 1) Exact province line
  const exact = pool.filter(x => _norm(x.province) === provN);
  const exactPick = pickBest(exact);
  if (exactPick) return exactPick;

  // 2) Grouped provinces (e.g., "Quezon, Batangas")
  const grouped = pool.filter(x => _splitProvs(x.province).includes(provN));
  const groupedPick = pickBest(grouped);
  if (groupedPick) return groupedPick;

  // 3) All Provinces
  const allProv = pool.filter(x => _norm(x.province) === 'all provinces');
  const allPick = pickBest(allProv);
  if (allPick) return allPick;

  return null;
}

function calculateYieldRatioScore(myYield: number, bmYield: number): { score: number; ratio: number } {
  if (!(bmYield > 0) || !(myYield >= 0)) return { score: 500, ratio: 0 };
  const R = myYield / bmYield;
  let score: number;
  if (R < 1.0) score = 500 + 500 * Math.pow((1 - R) / 0.3, 0.7);
  else         score = 500 - 500 * Math.pow((R - 1) / 1.0, 0.8);
  return { score: Math.round(clamp(score, 0, 1000)), ratio: R };
}

function calculateHarvestScoreCore(opts: {
  cropType: string;
  province: string;
  projectedYieldPerHa: number;
  areaSizeHa: number;
  DB: CropBenchmark[];
  systemOrVariety?: string;
}): HarvestScoreResult {
  const { cropType, province, projectedYieldPerHa, areaSizeHa, DB, systemOrVariety } = opts;

  const cropClean = normalizeCropName(cropType) ?? cropType;
  const provinceClean = titleCase(province);  // nice for output

  const bm = findBenchmark(cropClean, province, DB, systemOrVariety);
  if (!bm) throw new Error(`No yield benchmark for "${cropClean}" in "${provinceClean}".`);

  const bmYield = Number(bm.recommendedMinimumYield);
  if (!(bmYield > 0)) {
    throw new Error(`Benchmark yield is 0 for "${bm.crop}" (${bm.farmingSystemOrVariety}) in "${bm.province}". Crop may be non-viable.`);
  }

  const { score, ratio } = calculateYieldRatioScore(projectedYieldPerHa, bmYield);
  const tierInfo = getHarvestPerformanceTier(score);
  const projectedTotalHarvest = (areaSizeHa ?? 1) * projectedYieldPerHa;

  const summary =
    `Benchmark: ${bmYield} MT/ha for ${bm.crop} ` +
    (bm.farmingSystemOrVariety ? `(${bm.farmingSystemOrVariety}) ` : ``) +
    `in ${provinceClean}. ` +
    `Projected: ${projectedYieldPerHa} MT/ha → Yield Ratio Score ${score} ` +
    `(${tierInfo.label}). Total harvest: ${projectedTotalHarvest.toFixed(2)} MT.`;

  return {
    score,
    qualitativeTier: tierInfo.label,
    tier: tierInfo.tier,
    ratio,
    projectedTotalHarvest,
    benchmarkYield: bmYield,
    benchmarkSource: String(bm.justification || 'N/A'),
    summary,
    cropType: cropClean,
    province: provinceClean,   // << use cleaned province for output
    projectedYieldPerHa,
    areaSizeHa
  };
}


function parseHarvestTrigger(triggerText?: string): Partial<{
  cropType: string;
  province: string;
  projectedYieldPerHa: number;
  areaSizeHa: number;
  systemOrVariety: string;
}> {
  if (!triggerText) return {};
  const t = triggerText.trim();
  if (!/^harvest\s*score\b/i.test(t)) return {};

  const out: any = {};

  // ---------- key:value extractor ----------
  const kv = (key: string) => {
    const m = t.match(new RegExp(`${key}\\s*:\\s*([^,]+)`, 'i'));
    return m ? m[1].trim() : undefined;
  };

  out.cropType        = kv('crop')    ?? out.cropType;
  out.province        = kv('province')?? out.province;
  out.systemOrVariety = kv('system')  ?? kv('variety') ?? out.systemOrVariety;

  // ---------- robust yield parsing ----------
  // Accepts:
  //   2.5 mt/ha, 2.5 t/ha, 2.5 tons per ha, 2.5 t ha-1, 2.5 per hectare, 2.5/ha, 2.5 ha-1, and plain "2.5 mt"
  // Rule: if "ha/hectare/ha-1" is missing, assume it's per hectare.
  const yieldRegexes: RegExp[] = [
    /(?:yield\s*[:\-]?\s*)?(\d+(?:\.\d+)?)\s*(?:mt|t|tons?)\s*(?:\/?\s*(?:ha|hectare|hectares)|\s*per\s*(?:ha|hectare|hectares)|\s*ha-1)\b/i,
    /(?:yield\s*[:\-]?\s*)?(\d+(?:\.\d+)?)\s*(?:\/?\s*(?:ha|hectare|hectares)|\s*ha-1)\b/i,
    /(?:yield\s*[:\-]?\s*)?(\d+(?:\.\d+)?)\s*(?:mt|t|tons?)\b/i,
    /yield\s+(\d+(?:\.\d+)?)/i,
  ];
  for (const re of yieldRegexes) {
    const m = t.match(re);
    if (m) { out.projectedYieldPerHa = Number(m[1]); break; }
  }

  // ---------- area parsing ----------
  const areaRegexes: RegExp[] = [
    /area\s+(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s*(?:ha|hectare|hectares)\b/i,
  ];
  for (const re of areaRegexes) {
    const m = t.match(re);
    if (m) { out.areaSizeHa = Number(m[1]); break; }
  }

  // ---------- free-form hints for farming system/variety ----------
  if (!out.systemOrVariety) {
    // Get unique, non-"All" systems from the benchmark data
    const allSystems = Array.from(new Set(CROP_BENCHMARKS.map(b => b.farmingSystemOrVariety)))
        .filter(s => s.toLowerCase() !== 'all')
        .sort((a, b) => b.length - a.length); // Sort by length descending to match longer phrases first

    // Create a regex to find any of these systems in the text, handling parentheses
    const systemsPattern = allSystems
      .map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // Escape special regex characters
      .join('|');
    const systemsRegex = new RegExp(`\\b(${systemsPattern})\\b`, 'i');
    const match = t.match(systemsRegex);

    if (match) {
        out.systemOrVariety = match[1];
    }
  }

  // ---------- token-based inference for crop/province ----------
  // Remove the leading "harvest score"
  let tail = t.replace(/^harvest\s*score\b/i, '').trim();

  // Tokenize and filter out unit words to avoid "mt" becoming the crop
  const UNIT_TOKENS = new Set(['mt','t','ton','tons','per','/ha','ha-1','ha','hectare','hectares','per/ha','mt/ha','t/ha']);
  const tokens = tail.split(/[\s,]+/).filter(Boolean);

  // If yield wasn't captured yet, try to read "number [+ optional unit]" at the start
  if (out.projectedYieldPerHa == null && tokens.length) {
    const n = Number(tokens[0]);
    if (Number.isFinite(n)) {
      out.projectedYieldPerHa = n;
      tokens.shift(); // consume the number
      // consume one or two unit tokens if present
      while (tokens.length && UNIT_TOKENS.has(tokens[0].toLowerCase())) tokens.shift();
    }
  } else {
    // Even if we captured via regex, drop the leading number + (optional) unit tokens from the head
    if (tokens.length && Number.isFinite(Number(tokens[0]))) {
      tokens.shift();
      while (tokens.length && UNIT_TOKENS.has(tokens[0].toLowerCase())) tokens.shift();
    }
  }

  // If crop still missing, use first non-unit token
  if (!out.cropType) {
    const i = tokens.findIndex(tok => !UNIT_TOKENS.has(tok.toLowerCase()) && !/^\d/.test(tok));
    if (i >= 0) {
      out.cropType = tokens[i];
      tokens.splice(i, 1);
    }
  }

  // Province fallback is the remaining tail (minus numbers/units)
  if (!out.province) {
    const provTokens = tokens.filter(tok => !UNIT_TOKENS.has(tok.toLowerCase()) && !/^\d/.test(tok));
    if (provTokens.length) out.province = provTokens.join(' ');
  }

  // Final crop normalization to match DB keys
  out.cropType = normalizeCropName(out.cropType);

  // Clean province (remove crop word if it leaked in)
  if (out.province && out.cropType) {
    const c = out.cropType.replace(/\(.*?\)/g, '').trim(); // "Palay (Rice)" -> "Palay"
    out.province = out.province
      .replace(new RegExp(`^\\s*${c}\\b`, 'i'), '')
      .replace(/\b(per\s*hectare|mt\/?ha|t\/?ha|tons?\s*per\s*ha|ha-1|ha|hectare|hectares)\b/ig, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Defaults
  if (out.areaSizeHa == null) out.areaSizeHa = 1;

  return out;
}




// ─────────────────────────────────────────────────────────────
/** MAIN ORCHESTRATOR */
// ─────────────────────────────────────────────────────────────
export function calculateBaselineRiskScore(input: RiskScoreInput): RiskScoreResult {
  const hasSoilData = input.sand != null && input.silt != null && input.clay != null;
  const hasClimateData = input.latitude != null && input.longitude != null && input.cropCycleMonths && input.cropCycleMonths.length > 0;

  let soilAnalysis: SoilAnalysisResult | null = null;
  let finalSoilScore: number | null = null;
  let climateAnalysis: ClimateAnalysisResult | null = null;
  let explanation = '';
  let finalStatement = '';
  let finalRecommendation = '';

  if (hasClimateData) {
    climateAnalysis = calculateClimateScore(input.latitude!, input.longitude!, input.cropCycleMonths!);
  }

  if (hasSoilData) {
    const { sand, silt, clay } = normalize(input.sand!, input.silt!, input.clay!);
    const soilTexture = getSoilTexture(sand, silt, clay);
    const baseScores = {
      nutrient: calculateNutrientManagementRisk(sand, silt, clay),
      drought: calculateDroughtStressRisk(sand, silt, clay),
      waterlogging: calculateWaterloggingRisk(sand, silt, clay),
      compaction: calculateCompactionRisk(sand, silt, clay),
    };
    const { finalScore, details, activityFactorsApplied } = calculateDynamicallyWeightedSoilScore(baseScores, climateAnalysis);
    finalSoilScore = finalScore;

    const sortedSubScores = Object.entries(details).sort(([, a], [, b]) => b.contribution - a.contribution);
    const dominantRisks = `${sortedSubScores[0][0]} and ${sortedSubScores[1][0]}`
      .replace('nutrient', 'Nutrient Fixation/Leaching')
      .replace('drought', 'Drought Stress');

    soilAnalysis = {
      soilTexture,
      sand, silt, clay,
      subScores: details,
      dominantRisks,
      activityFactorsApplied,
    };
  }


  // ── HARVEST SCORE (optional, same window via trigger or direct fields)
  let harvestScore: HarvestScoreResult | undefined;

  // Parse any "harvest score ..." trigger embedded in input.triggerText
  const parsed = parseHarvestTrigger(input.triggerText);

  // Pull values with fallback to parsed trigger
  const cropType        = input.cropType        ?? parsed.cropType;
  const province        = input.province        ?? parsed.province;
  const yieldHaRaw      = input.projectedYieldPerHa ?? parsed.projectedYieldPerHa;
  const areaHaRaw       = input.areaSizeHa ?? parsed.areaSizeHa ?? 1;
  const systemOrVariety = (input as any).systemOrVariety ?? parsed.systemOrVariety;

  // Sanity: coerce numeric fields & guard against NaN
  const yieldHa = typeof yieldHaRaw === 'number' ? yieldHaRaw : Number(yieldHaRaw);
  const areaHa  = typeof areaHaRaw  === 'number' ? areaHaRaw  : Number(areaHaRaw);

  // Only compute when we have the minimums
  if (cropType && province && Number.isFinite(yieldHa)) {
    try {
      const hsCore = calculateHarvestScoreCore({
        cropType,
        province,
        projectedYieldPerHa: yieldHa,
        areaSizeHa: Number.isFinite(areaHa) ? areaHa : 1,
        systemOrVariety,
        DB: CROP_BENCHMARKS
      });

      // Classify match to derive confidence weight
      const meta = classifyBenchmarkMatch(cropType, province, CROP_BENCHMARKS, systemOrVariety);
      const wh = computeHarvestConfidenceWeight({
        confidenceLevel: meta.confidenceLevel,
        spatial: meta.spatial,
        systemMatch: meta.system,
        yearsSince: meta.yearsSince,
        sampleSize: meta.sampleSize
      });

      harvestScore = { ...hsCore, weight: wh };
    } catch {
      // keep baseline intact if harvest computation fails (e.g., non-viable crop)
    }
  }

  // After climateScore, soilScore, and harvestScore are known…
  let alpha: number | null = null;
  let alphaRisk: number | null = null;
  let alphaTierInfo: { tier: number, label: string } | null = null;

  const hasContext = climateAnalysis && finalSoilScore !== null;
  const hasHarvest = !!harvestScore;

  if (hasContext && hasHarvest) {
    const context = 0.60 * (climateAnalysis!.overallScore) + 0.40 * (finalSoilScore!);
    const wh = harvestScore!.weight ?? 1.0; // default to 1.0 when unavailable
    alpha = Math.round(context - wh * harvestScore!.score);
    alphaRisk = Math.round(clamp(500 - alpha, 0, 1000));
    alphaTierInfo = getQualitativeTier(alphaRisk);
  }



  // -------------------------
  // BASELINE AGGREGATION (now includes Harvest when available)
  // -------------------------
  type Component = { key: 'climate'|'soil'|'harvest'; score: number; baseWeight: number; label: string };
  const comps: Component[] = [];

  if (climateAnalysis) {
    comps.push({
      key: 'climate',
      score: climateAnalysis.overallScore,
      baseWeight: 0.50,
      label: 'Climate Score'
    });
  }

  if (finalSoilScore !== null) {
    comps.push({
      key: 'soil',
      score: finalSoilScore,
      baseWeight: 0.30,
      label: 'Soil Score'
    });
  }

  if (harvestScore) {
    comps.push({
      key: 'harvest',
      score: harvestScore.score,
      baseWeight: 0.20,
      label: 'Harvest Score'
    });
  }

  // Detect if crop cycle overlaps with summer months (March–May)
  const isSummerCrop =
    !!climateAnalysis &&
    Array.isArray(climateAnalysis.breakdown) &&
    climateAnalysis.breakdown.some(m =>
      m && ['March', 'April', 'May'].includes(m.month)
    );

  // Weight policy:
  // - Default (non-summer, 3 components): Climate 0.50, Soil 0.30, Harvest 0.20
  // - Summer (3 components, any Mar–May in breakdown): Climate 0.40, Soil 0.40, Harvest 0.20
  // - 2 components: base 0.60 / 0.40, except climate+soil in summer → 0.50 / 0.50
  // - 1 component: weight = 1.0
  let weights: Record<Component['key'], number> = { climate: 0, soil: 0, harvest: 0 };

  if (comps.length === 3) {
    if (isSummerCrop) {
      // Summer: treat climate and soil as equally important, keep harvest at 20%
      weights = { climate: 0.40, soil: 0.40, harvest: 0.20 };
    } else {
      // Default
      weights = { climate: 0.50, soil: 0.30, harvest: 0.20 };
    }
  } else if (comps.length === 2) {
    const ks = comps.map(c => c.key);
    // Base two-way is 0.60 / 0.40
    if (ks.includes('climate') && ks.includes('soil')) {
      // If only climate+soil are present:
      //   Summer: 50/50
      //   Otherwise: 60/40
      if (isSummerCrop) {
        weights = { climate: 0.50, soil: 0.50, harvest: 0 };
      } else {
        weights = { climate: 0.60, soil: 0.40, harvest: 0 };
      }
    } else if (ks.includes('climate') && ks.includes('harvest')) {
      // No soil info: keep original 60/40 split
      weights = { climate: 0.60, harvest: 0.40, soil: 0 };
    } else if (ks.includes('soil') && ks.includes('harvest')) {
      // No climate info: keep original 60/40 split
      weights = { soil: 0.60, harvest: 0.40, climate: 0 };
    }
  } else if (comps.length === 1) {
    weights[comps[0].key] = 1.0;
  }

  // Compute weighted baseline
  let baselineRiskScore = 10;
  if (comps.length > 0) {
    const weighted = comps.reduce((sum, c) => sum + c.score * weights[c.key], 0);
    baselineRiskScore = weighted;
  }


  // Build explanation/finalStatement depending on which components are present
  const parts: string[] = [];
  if (climateAnalysis) parts.push(`Type ${climateAnalysis.climateType} climate`);
  if (finalSoilScore !== null && soilAnalysis) parts.push(`${soilAnalysis.soilTexture} soil`);
  if (harvestScore) parts.push(`harvest performance **${harvestScore.qualitativeTier}** (ratio ${(harvestScore.ratio).toFixed(2)}× vs benchmark)`);

  // NOTE: do NOT re-declare these; they already exist above.
  // Just assign to them (no `let` here).
  explanation = '';
  finalStatement = '';
  finalRecommendation = '';

  if (comps.length > 0) {
    explanation = `The baseline blends available risk components using fixed weights: ` +
      `${weights.climate ? `Climate ${Math.round(weights.climate*100)}%` : ''}` +
      `${weights.climate && (weights.soil || weights.harvest) ? ', ' : ''}` +
      `${weights.soil ? `Soil ${Math.round(weights.soil*100)}%` : ''}` +
      `${(weights.climate || weights.soil) && weights.harvest ? ', ' : ''}` +
      `${weights.harvest ? `Harvest ${Math.round(weights.harvest*100)}%` : ''}.`;

    finalStatement = parts.length ? parts.join(' + ') : 'insufficient component data';

    const recs: string[] = [];
    if (climateAnalysis) recs.push('seasonal scheduling and drainage');
    if (finalSoilScore !== null) recs.push('soil structure and nutrient management');
    if (harvestScore) recs.push('closing the yield gap to benchmark via variety/system and management');
    finalRecommendation = recs.length ? recs.join('; ') : 'data completion for a fuller assessment';
  } else {
    baselineRiskScore = 10;
    explanation = 'No climate, soil, or harvest inputs were available.';
    finalStatement = 'insufficient component data';
    finalRecommendation = 'provide soil % or coordinates + crop cycle, or a harvest trigger';
  }


  const finalBaselineScore = Math.round(clamp(baselineRiskScore, 10, 1000));
  const tierInfo = getQualitativeTier(finalBaselineScore);

  
  const result: RiskScoreResult = {
    baselineScore: finalBaselineScore,
    qualitativeRisk: tierInfo.label,
    qualitativeTier: tierInfo.tier,
    climateScore: climateAnalysis ? climateAnalysis.overallScore : null,
    soilScore: finalSoilScore,
    monthlyClimateBreakdown: climateAnalysis ? climateAnalysis.breakdown : null,
    soilAnalysis,
    explanation,
    climateType: climateAnalysis ? climateAnalysis.climateType : null,
    climateTypeDescription: climateAnalysis ? CLIMATE_TYPE_DESCRIPTIONS[climateAnalysis.climateType] : null,
    dominantClimateHazard: climateAnalysis ? climateAnalysis.dominantHazard : null,
    finalStatement,
    finalRecommendation,
    // NEW (only set if available)
    harvestScore,
    alpha: alpha ?? undefined,
    alphaRisk: alphaRisk ?? undefined,
    alphaTierLabel: alphaTierInfo?.label,
    alphaTier: alphaTierInfo?.tier
  };

  if (harvestScore) result.harvestScore = harvestScore;

  return result;
}