/**
 * Harvest Data Models and Demo Data
 * For tracking farmer harvest records
 */

export interface HarvestRecord {
  id: string;
  farmerId: string;
  farmerName: string;
  farmId: string;
  farmLocation: string;
  crop: string;
  harvestDate: string;
  quantity: number;
  unit: 'kg' | 'MT' | 'bags' | 'pieces';
  qualityGrade: 'Premium' | 'Grade A' | 'Grade B' | 'Grade C';
  pricePerUnit: number;
  totalValue: number;
  landAreaHarvested: number; // in hectares
  yieldPerHectare: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const harvestData: HarvestRecord[] = [
  {
    id: 'H001',
    farmerId: 'F002',
    farmerName: 'Juan Dela Cruz',
    farmId: 'FARM001',
    farmLocation: 'Brgy. Dayap, Calauan, Laguna',
    crop: 'Rice',
    harvestDate: '2024-09-28',
    quantity: 15800,
    unit: 'kg',
    qualityGrade: 'Grade A',
    pricePerUnit: 25,
    totalValue: 395000,
    landAreaHarvested: 3.0,
    yieldPerHectare: 5266.67,
    notes: 'Good harvest season, minimal pest damage',
    createdAt: '2024-09-28T10:30:00Z',
    updatedAt: '2024-09-28T10:30:00Z',
  },
  {
    id: 'H002',
    farmerId: 'F008',
    farmerName: 'Carlos Ramos',
    farmId: 'FARM008',
    farmLocation: 'Brgy. Dayap, Calauan, Laguna',
    crop: 'Rice',
    harvestDate: '2024-09-29',
    quantity: 28300,
    unit: 'kg',
    qualityGrade: 'Premium',
    pricePerUnit: 28,
    totalValue: 792400,
    landAreaHarvested: 5.0,
    yieldPerHectare: 5660,
    notes: 'Excellent quality, used hybrid seeds',
    createdAt: '2024-09-29T14:15:00Z',
    updatedAt: '2024-09-29T14:15:00Z',
  },
  {
    id: 'H003',
    farmerId: 'F004',
    farmerName: 'Pedro Garcia',
    farmId: 'FARM004A',
    farmLocation: 'Brgy. Prinza, Calauan, Laguna',
    crop: 'Corn',
    harvestDate: '2024-09-15',
    quantity: 8500,
    unit: 'kg',
    qualityGrade: 'Grade A',
    pricePerUnit: 18,
    totalValue: 153000,
    landAreaHarvested: 2.0,
    yieldPerHectare: 4250,
    notes: 'Drought-resistant variety performed well',
    createdAt: '2024-09-15T09:00:00Z',
    updatedAt: '2024-09-15T09:00:00Z',
  },
  {
    id: 'H004',
    farmerId: 'F001',
    farmerName: 'Maria Santos',
    farmId: 'FARM001A',
    farmLocation: 'Brgy. San Isidro, Calauan, Laguna',
    crop: 'Rice',
    harvestDate: '2024-09-20',
    quantity: 12500,
    unit: 'kg',
    qualityGrade: 'Grade A',
    pricePerUnit: 25,
    totalValue: 312500,
    landAreaHarvested: 2.5,
    yieldPerHectare: 5000,
    notes: 'Applied Complete Fertilizer 14-14-14, good results',
    createdAt: '2024-09-20T11:45:00Z',
    updatedAt: '2024-09-20T11:45:00Z',
  },
  {
    id: 'H005',
    farmerId: 'F003',
    farmerName: 'Rosa Reyes',
    farmId: 'FARM003B',
    farmLocation: 'Brgy. Lamot 1, Calauan, Laguna',
    crop: 'Vegetables',
    harvestDate: '2024-10-01',
    quantity: 1200,
    unit: 'kg',
    qualityGrade: 'Premium',
    pricePerUnit: 45,
    totalValue: 54000,
    landAreaHarvested: 0.5,
    yieldPerHectare: 2400,
    notes: 'Tomatoes - excellent market demand',
    createdAt: '2024-10-01T08:30:00Z',
    updatedAt: '2024-10-01T08:30:00Z',
  },
  {
    id: 'H006',
    farmerId: 'F007',
    farmerName: 'Luz Fernandez',
    farmId: 'FARM007',
    farmLocation: 'Brgy. Silang, Calauan, Laguna',
    crop: 'Vegetables',
    harvestDate: '2024-09-25',
    quantity: 850,
    unit: 'kg',
    qualityGrade: 'Grade A',
    pricePerUnit: 40,
    totalValue: 34000,
    landAreaHarvested: 0.4,
    yieldPerHectare: 2125,
    notes: 'Eggplant harvest, good quality',
    createdAt: '2024-09-25T07:20:00Z',
    updatedAt: '2024-09-25T07:20:00Z',
  },
  {
    id: 'H007',
    farmerId: 'F006',
    farmerName: 'Roberto Cruz',
    farmId: 'FARM006A',
    farmLocation: 'Brgy. Kanluran, Calauan, Laguna',
    crop: 'Rice',
    harvestDate: '2024-09-18',
    quantity: 18700,
    unit: 'kg',
    qualityGrade: 'Grade A',
    pricePerUnit: 25,
    totalValue: 467500,
    landAreaHarvested: 3.5,
    yieldPerHectare: 5342.86,
    notes: 'Used organic compost, improved soil quality',
    createdAt: '2024-09-18T13:00:00Z',
    updatedAt: '2024-09-18T13:00:00Z',
  },
  {
    id: 'H008',
    farmerId: 'F005',
    farmerName: 'Ana Mendoza',
    farmId: 'FARM005',
    farmLocation: 'Brgy. Balayhangin, Calauan, Laguna',
    crop: 'Rice',
    harvestDate: '2024-09-22',
    quantity: 10500,
    unit: 'kg',
    qualityGrade: 'Grade B',
    pricePerUnit: 22,
    totalValue: 231000,
    landAreaHarvested: 2.0,
    yieldPerHectare: 5250,
    notes: 'Some pest damage affected quality',
    createdAt: '2024-09-22T10:15:00Z',
    updatedAt: '2024-09-22T10:15:00Z',
  },
  {
    id: 'H009',
    farmerId: 'F004',
    farmerName: 'Pedro Garcia',
    farmId: 'FARM004B',
    farmLocation: 'Brgy. Prinza, Calauan, Laguna',
    crop: 'Vegetables',
    harvestDate: '2024-10-03',
    quantity: 950,
    unit: 'kg',
    qualityGrade: 'Premium',
    pricePerUnit: 50,
    totalValue: 47500,
    landAreaHarvested: 0.3,
    yieldPerHectare: 3166.67,
    notes: 'Bell peppers - premium quality for export',
    createdAt: '2024-10-03T09:45:00Z',
    updatedAt: '2024-10-03T09:45:00Z',
  },
  {
    id: 'H010',
    farmerId: 'F008',
    farmerName: 'Carlos Ramos',
    farmId: 'FARM008B',
    farmLocation: 'Brgy. Dayap, Calauan, Laguna',
    crop: 'Corn',
    harvestDate: '2024-09-12',
    quantity: 12000,
    unit: 'kg',
    qualityGrade: 'Grade A',
    pricePerUnit: 18,
    totalValue: 216000,
    landAreaHarvested: 2.5,
    yieldPerHectare: 4800,
    notes: 'Pioneer variety, good drought resistance',
    createdAt: '2024-09-12T11:30:00Z',
    updatedAt: '2024-09-12T11:30:00Z',
  },
  {
    id: 'H011',
    farmerId: 'F001',
    farmerName: 'Maria Santos',
    farmId: 'FARM001B',
    farmLocation: 'Brgy. San Isidro, Calauan, Laguna',
    crop: 'Corn',
    harvestDate: '2024-09-14',
    quantity: 7200,
    unit: 'kg',
    qualityGrade: 'Grade A',
    pricePerUnit: 18,
    totalValue: 129600,
    landAreaHarvested: 1.5,
    yieldPerHectare: 4800,
    notes: 'Second harvest of the season',
    createdAt: '2024-09-14T14:00:00Z',
    updatedAt: '2024-09-14T14:00:00Z',
  },
  {
    id: 'H012',
    farmerId: 'F003',
    farmerName: 'Rosa Reyes',
    farmId: 'FARM003A',
    farmLocation: 'Brgy. Lamot 1, Calauan, Laguna',
    crop: 'Rice',
    harvestDate: '2024-09-26',
    quantity: 9200,
    unit: 'kg',
    qualityGrade: 'Grade A',
    pricePerUnit: 25,
    totalValue: 230000,
    landAreaHarvested: 1.8,
    yieldPerHectare: 5111.11,
    notes: 'Hybrid rice variety, good yield',
    createdAt: '2024-09-26T12:20:00Z',
    updatedAt: '2024-09-26T12:20:00Z',
  },
];

// Helper functions for harvest analytics
export const getHarvestSummary = () => {
  const totalQuantity = harvestData.reduce((sum, h) => sum + h.quantity, 0);
  const totalValue = harvestData.reduce((sum, h) => sum + h.totalValue, 0);
  const totalArea = harvestData.reduce((sum, h) => sum + h.landAreaHarvested, 0);
  const avgYield = harvestData.reduce((sum, h) => sum + h.yieldPerHectare, 0) / harvestData.length;

  return {
    totalQuantity: (totalQuantity / 1000).toFixed(1), // Convert to MT
    totalValue: totalValue.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' }),
    totalRecords: harvestData.length,
    avgYield: avgYield.toFixed(2),
    totalArea: totalArea.toFixed(1),
  };
};

export const getHarvestByCrop = () => {
  const cropSummary: { [key: string]: { quantity: number; value: number; count: number } } = {};

  harvestData.forEach(h => {
    if (!cropSummary[h.crop]) {
      cropSummary[h.crop] = { quantity: 0, value: 0, count: 0 };
    }
    cropSummary[h.crop].quantity += h.quantity;
    cropSummary[h.crop].value += h.totalValue;
    cropSummary[h.crop].count += 1;
  });

  return Object.entries(cropSummary).map(([crop, data]) => ({
    crop,
    quantity: (data.quantity / 1000).toFixed(1),
    value: data.value,
    count: data.count,
  }));
};

export const getHarvestByQuality = () => {
  const qualitySummary: { [key: string]: number } = {};

  harvestData.forEach(h => {
    qualitySummary[h.qualityGrade] = (qualitySummary[h.qualityGrade] || 0) + 1;
  });

  return Object.entries(qualitySummary).map(([grade, count]) => ({
    grade,
    count,
    percentage: ((count / harvestData.length) * 100).toFixed(1),
  }));
};

export const getTopFarmers = () => {
  const farmerSummary: { [key: string]: { name: string; totalValue: number; totalQuantity: number } } = {};

  harvestData.forEach(h => {
    if (!farmerSummary[h.farmerId]) {
      farmerSummary[h.farmerId] = { name: h.farmerName, totalValue: 0, totalQuantity: 0 };
    }
    farmerSummary[h.farmerId].totalValue += h.totalValue;
    farmerSummary[h.farmerId].totalQuantity += h.quantity;
  });

  return Object.entries(farmerSummary)
    .map(([id, data]) => ({
      id,
      name: data.name,
      totalValue: data.totalValue,
      totalQuantity: (data.totalQuantity / 1000).toFixed(1),
    }))
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 5);
};
