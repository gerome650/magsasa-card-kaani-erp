/**
 * Pending AgScore™ Submissions
 * 
 * Mock data for AgScore™ submissions from KaAni that are pending Field Officer approval.
 * In production, this data will be pushed from KaAni API and stored in the database.
 */

export interface PendingAgScoreSubmission {
  id: string;
  farmerId: string;
  farmerName: string;
  submittedDate: string;
  // Data submitted by farmer via KaAni
  submittedData: {
    cropType: string;
    province: string;
    municipality: string;
    barangay: string;
    coordinates?: { lat: number; lng: number };
    projectedYieldPerHa: number;
    areaSizeHa: number;
    systemOrVariety: string; // e.g., "Irrigated", "Rainfed"
  };
  // Calculated AgScore from KaAni
  calculatedScore: {
    baselineScore: number;
    tier: number;
    qualitativeTier: string;
    climateScore: number;
    soilScore: number;
    harvestScore: number;
    alpha: number;
    alphaRisk: number;
    alphaTierLabel: string;
    alphaTier: number;
    confidenceWeight: number;
  };
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedDate?: string;
  reviewComment?: string;
}

export const pendingAgScoreSubmissions: PendingAgScoreSubmission[] = [
  {
    id: 'AGS001',
    farmerId: 'F015',
    farmerName: 'Roberto Villanueva',
    submittedDate: '2024-11-15T08:30:00Z',
    submittedData: {
      cropType: 'Palay (Rice)',
      province: 'Laguna',
      municipality: 'San Pedro',
      barangay: 'Landayan',
      coordinates: { lat: 14.3583, lng: 121.0167 },
      projectedYieldPerHa: 5.8,
      areaSizeHa: 2.3,
      systemOrVariety: 'Irrigated'
    },
    calculatedScore: {
      baselineScore: 285,
      tier: 6,
      qualitativeTier: 'High Performance',
      climateScore: 320,
      soilScore: 280,
      harvestScore: 220,
      alpha: 58,
      alphaRisk: 442,
      alphaTierLabel: 'Moderate',
      alphaTier: 4,
      confidenceWeight: 0.92
    },
    status: 'pending'
  },
  {
    id: 'AGS002',
    farmerId: 'F042',
    farmerName: 'Elena Martinez',
    submittedDate: '2024-11-15T10:15:00Z',
    submittedData: {
      cropType: 'Corn (Maize)',
      province: 'Laguna',
      municipality: 'Biñan',
      barangay: 'San Antonio',
      coordinates: { lat: 14.3389, lng: 121.0806 },
      projectedYieldPerHa: 4.2,
      areaSizeHa: 1.8,
      systemOrVariety: 'Rainfed'
    },
    calculatedScore: {
      baselineScore: 420,
      tier: 4,
      qualitativeTier: 'Moderate Performance',
      climateScore: 450,
      soilScore: 380,
      harvestScore: 410,
      alpha: -12,
      alphaRisk: 512,
      alphaTierLabel: 'Moderate',
      alphaTier: 4,
      confidenceWeight: 0.88
    },
    status: 'pending'
  },
  {
    id: 'AGS003',
    farmerId: 'F089',
    farmerName: 'Carlos Mendoza',
    submittedDate: '2024-11-16T09:45:00Z',
    submittedData: {
      cropType: 'Palay (Rice)',
      province: 'Laguna',
      municipality: 'Santa Rosa',
      barangay: 'Tagapo',
      coordinates: { lat: 14.3122, lng: 121.1114 },
      projectedYieldPerHa: 6.5,
      areaSizeHa: 3.5,
      systemOrVariety: 'Irrigated'
    },
    calculatedScore: {
      baselineScore: 195,
      tier: 6,
      qualitativeTier: 'High Performance',
      climateScore: 310,
      soilScore: 240,
      harvestScore: 120,
      alpha: 142,
      alphaRisk: 358,
      alphaTierLabel: 'Moderately Low',
      alphaTier: 5,
      confidenceWeight: 0.95
    },
    status: 'pending'
  },
  {
    id: 'AGS004',
    farmerId: 'F124',
    farmerName: 'Patricia Santos',
    submittedDate: '2024-11-16T14:20:00Z',
    submittedData: {
      cropType: 'Tomato',
      province: 'Laguna',
      municipality: 'Cabuyao',
      barangay: 'Marinig',
      coordinates: { lat: 14.2789, lng: 121.1253 },
      projectedYieldPerHa: 12.5,
      areaSizeHa: 0.8,
      systemOrVariety: 'Greenhouse'
    },
    calculatedScore: {
      baselineScore: 245,
      tier: 6,
      qualitativeTier: 'High Performance',
      climateScore: 290,
      soilScore: 260,
      harvestScore: 180,
      alpha: 98,
      alphaRisk: 402,
      alphaTierLabel: 'Moderate',
      alphaTier: 4,
      confidenceWeight: 0.90
    },
    status: 'pending'
  }
];

// Helper function to get pending submissions for a specific Field Officer
export function getPendingAgScoresForOfficer(assignedMunicipalities: string[]): PendingAgScoreSubmission[] {
  return pendingAgScoreSubmissions.filter(submission => 
    assignedMunicipalities.includes(submission.submittedData.municipality) &&
    submission.status === 'pending'
  );
}
