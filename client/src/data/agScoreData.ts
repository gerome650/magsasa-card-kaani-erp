/**
 * AgScore™ Data
 * 
 * Mock AgScore™ (Risk Score) data for all farmers.
 * In production, this data will be pushed from KaAni after GIS-based calculation
 * and approved by Field Officers.
 * 
 * Score Scale: 0-1000 (higher = higher risk, lower performance)
 * Tiers: 1 (Very Low Performance) to 7 (Very High Performance)
 * 
 * Components:
 * - Climate Score (50% weight): Based on rainfall, humidity, weather patterns
 * - Soil Score (30% weight): Based on soil texture, compaction, drainage
 * - Harvest Score (20% weight): Based on yield vs. benchmark
 */

export interface AgScoreData {
  farmerId: string;
  baselineScore: number;        // 0-1000 (final weighted score)
  tier: number;                  // 1-7 (1=worst, 7=best)
  qualitativeTier: string;       // e.g., "High Performance"
  climateScore: number;          // 0-1000
  soilScore: number;             // 0-1000
  harvestScore: number;          // 0-1000
  alpha: number;                 // signed performance vs context
  alphaRisk: number;             // 0-1000
  alphaTierLabel: string;        // e.g., "Moderate"
  alphaTier: number;             // 1-7
  calculatedDate: string;        // ISO date
  confidenceWeight: number;      // 0.50-1.00
  status: 'approved' | 'pending' | 'rejected';
}

// Helper function to generate realistic AgScore based on harvest performance
function generateAgScore(
  farmerId: string,
  totalHarvest: number,
  landArea: number,
  crops: string[]
): AgScoreData {
  // Calculate yield per hectare
  const yieldPerHa = totalHarvest / landArea;
  
  // Determine performance tier based on yield
  // Rice benchmark: ~5 MT/ha, Corn: ~4 MT/ha, Vegetables: ~8 MT/ha
  const avgBenchmark = crops.includes('Rice') ? 5.0 : crops.includes('Corn') ? 4.0 : 6.0;
  const ratio = yieldPerHa / avgBenchmark;
  
  // Calculate harvest score (inverted: lower ratio = higher score/risk)
  let harvestScore: number;
  if (ratio < 1.0) {
    harvestScore = 500 + 500 * Math.pow((1 - ratio) / 0.3, 0.7);
  } else {
    harvestScore = 500 - 500 * Math.pow((ratio - 1) / 1.0, 0.8);
  }
  harvestScore = Math.max(0, Math.min(1000, Math.round(harvestScore)));
  
  // Generate climate and soil scores with some variation
  const climateScore = Math.round(300 + Math.random() * 300); // 300-600 range
  const soilScore = Math.round(250 + Math.random() * 350);    // 250-600 range
  
  // Calculate baseline (weighted average)
  const baselineScore = Math.round(
    0.50 * climateScore + 
    0.30 * soilScore + 
    0.20 * harvestScore
  );
  
  // Determine tier (inverted scale)
  let tier: number;
  let qualitativeTier: string;
  if (baselineScore < 100) {
    tier = 7;
    qualitativeTier = 'Very High Performance';
  } else if (baselineScore <= 249) {
    tier = 6;
    qualitativeTier = 'High Performance';
  } else if (baselineScore <= 399) {
    tier = 5;
    qualitativeTier = 'Moderately High Performance';
  } else if (baselineScore <= 549) {
    tier = 4;
    qualitativeTier = 'Moderate Performance';
  } else if (baselineScore <= 699) {
    tier = 3;
    qualitativeTier = 'Moderately Low Performance';
  } else if (baselineScore <= 849) {
    tier = 2;
    qualitativeTier = 'Low Performance';
  } else {
    tier = 1;
    qualitativeTier = 'Very Low Performance';
  }
  
  // Calculate alpha (performance vs context)
  const context = 0.60 * climateScore + 0.40 * soilScore;
  const confidenceWeight = 0.85 + Math.random() * 0.15; // 0.85-1.00
  const alpha = Math.round(context - confidenceWeight * harvestScore);
  const alphaRisk = Math.max(0, Math.min(1000, Math.round(500 - alpha)));
  
  // Determine alpha tier
  let alphaTier: number;
  let alphaTierLabel: string;
  if (alphaRisk < 100) {
    alphaTier = 7;
    alphaTierLabel = 'Very Low';
  } else if (alphaRisk <= 249) {
    alphaTier = 6;
    alphaTierLabel = 'Low';
  } else if (alphaRisk <= 399) {
    alphaTier = 5;
    alphaTierLabel = 'Moderately Low';
  } else if (alphaRisk <= 549) {
    alphaTier = 4;
    alphaTierLabel = 'Moderate';
  } else if (alphaRisk <= 699) {
    alphaTier = 3;
    alphaTierLabel = 'Moderately High';
  } else if (alphaRisk <= 849) {
    alphaTier = 2;
    alphaTierLabel = 'High';
  } else {
    alphaTier = 1;
    alphaTierLabel = 'Very High';
  }
  
  // Random date in the past 3 months
  const daysAgo = Math.floor(Math.random() * 90);
  const calculatedDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  
  return {
    farmerId,
    baselineScore,
    tier,
    qualitativeTier,
    climateScore,
    soilScore,
    harvestScore,
    alpha,
    alphaRisk,
    alphaTierLabel,
    alphaTier,
    calculatedDate,
    confidenceWeight: Math.round(confidenceWeight * 100) / 100,
    status: 'approved'
  };
}

// Import farmers data to generate AgScores
import { farmersData } from './farmersData';

export const agScoreData: AgScoreData[] = farmersData.map(farmer => 
  generateAgScore(farmer.id, farmer.totalHarvest, farmer.totalLandArea, farmer.crops)
);

// Helper function to get AgScore for a specific farmer
export function getAgScoreByFarmerId(farmerId: string): AgScoreData | undefined {
  return agScoreData.find(score => score.farmerId === farmerId);
}

// Helper function to get AgScore tier color
export function getAgScoreTierColor(tier: number): string {
  switch (tier) {
    case 7: return 'text-green-600 bg-green-50 border-green-200';
    case 6: return 'text-green-500 bg-green-50 border-green-200';
    case 5: return 'text-blue-600 bg-blue-50 border-blue-200';
    case 4: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 3: return 'text-orange-600 bg-orange-50 border-orange-200';
    case 2: return 'text-red-600 bg-red-50 border-red-200';
    case 1: return 'text-red-700 bg-red-100 border-red-300';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

// Helper function to get AgScore distribution
export function getAgScoreDistribution(): { tier: number; label: string; count: number }[] {
  const distribution = [
    { tier: 7, label: 'Very High Performance', count: 0 },
    { tier: 6, label: 'High Performance', count: 0 },
    { tier: 5, label: 'Moderately High Performance', count: 0 },
    { tier: 4, label: 'Moderate Performance', count: 0 },
    { tier: 3, label: 'Moderately Low Performance', count: 0 },
    { tier: 2, label: 'Low Performance', count: 0 },
    { tier: 1, label: 'Very Low Performance', count: 0 }
  ];
  
  agScoreData.forEach(score => {
    const tierIndex = distribution.findIndex(d => d.tier === score.tier);
    if (tierIndex !== -1) {
      distribution[tierIndex].count++;
    }
  });
  
  return distribution;
}
