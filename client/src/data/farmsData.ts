export interface Farm {
  id: string;
  name: string;
  farmerId: string;
  farmerName: string;
  location: {
    barangay: string;
    municipality: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  size: number; // in hectares
  crops: string[];
  soilType: string;
  irrigationType: 'Irrigated' | 'Rainfed' | 'Upland';
  status: 'active' | 'inactive' | 'fallow';
  dateRegistered: string;
  lastHarvest?: string;
  averageYield?: number; // MT/ha
  boundary?: { lat: number; lng: number }[]; // Farm boundary polygon coordinates
}

export interface FarmerActivity {
  id: string;
  farmerId: string;
  type: 'order' | 'harvest' | 'agscore' | 'loan' | 'payment' | 'training';
  title: string;
  description: string;
  date: string;
  amount?: number;
  status?: string;
}

// Mock farms data
const mockFarms: Farm[] = [
  {
    id: 'farm-001',
    name: 'Santos Rice Farm',
    farmerId: 'F001',
    farmerName: 'Maria Santos',
    location: {
      barangay: 'San Isidro',
      municipality: 'Calauan',
      coordinates: { lat: 14.1475, lng: 121.3189 }
    },
    size: 2.5,
    crops: ['Palay (Rice)'],
    soilType: 'Clay Loam',
    irrigationType: 'Irrigated',
    status: 'active',
    dateRegistered: '2023-01-15',
    lastHarvest: '2024-10-20',
    averageYield: 5.8
  },
  {
    id: 'farm-002',
    name: 'Cruz Vegetable Farm',
    farmerId: 'F002',
    farmerName: 'Juan Dela Cruz',
    location: {
      barangay: 'Dayap',
      municipality: 'Calauan',
      coordinates: { lat: 14.1523, lng: 121.3245 }
    },
    size: 1.2,
    crops: ['Tomato', 'Eggplant', 'Okra'],
    soilType: 'Sandy Loam',
    irrigationType: 'Irrigated',
    status: 'active',
    dateRegistered: '2023-03-10',
    lastHarvest: '2024-11-05',
    averageYield: 12.5
  },
  {
    id: 'farm-003',
    name: 'Reyes Corn Field',
    farmerId: 'F003',
    farmerName: 'Rosa Reyes',
    location: {
      barangay: 'Lamot 1',
      municipality: 'Calauan',
      coordinates: { lat: 14.1398, lng: 121.3156 }
    },
    size: 3.0,
    crops: ['Corn'],
    soilType: 'Silty Clay',
    irrigationType: 'Rainfed',
    status: 'active',
    dateRegistered: '2022-11-20',
    lastHarvest: '2024-09-15',
    averageYield: 4.2
  },
  {
    id: 'farm-004',
    name: 'Garcia Coconut Plantation',
    farmerId: 'F004',
    farmerName: 'Pedro Garcia',
    location: {
      barangay: 'Balayhangin',
      municipality: 'Calauan',
      coordinates: { lat: 14.1567, lng: 121.3298 }
    },
    size: 5.0,
    crops: ['Coconut'],
    soilType: 'Sandy',
    irrigationType: 'Rainfed',
    status: 'active',
    dateRegistered: '2021-06-01',
    averageYield: 1.8
  },
  {
    id: 'farm-005',
    name: 'Mendoza Mixed Farm',
    farmerId: 'F005',
    farmerName: 'Ana Mendoza',
    location: {
      barangay: 'Prinza',
      municipality: 'Calauan',
      coordinates: { lat: 14.1445, lng: 121.3212 }
    },
    size: 1.8,
    crops: ['Palay (Rice)', 'Vegetables'],
    soilType: 'Clay',
    irrigationType: 'Irrigated',
    status: 'active',
    dateRegistered: '2023-02-28',
    lastHarvest: '2024-10-30',
    averageYield: 6.1
  }
];

// Mock farmer activities
const mockActivities: FarmerActivity[] = [
  {
    id: 'act-001',
    farmerId: 'F001',
    type: 'order',
    title: 'Fertilizer Order',
    description: 'Ordered 10 bags of Urea fertilizer',
    date: '2024-11-15',
    amount: 10000,
    status: 'completed'
  },
  {
    id: 'act-002',
    farmerId: 'F001',
    type: 'harvest',
    title: 'Rice Harvest',
    description: 'Harvested 14.5 MT of rice from 2.5 hectares',
    date: '2024-10-20',
    amount: 145000
  },
  {
    id: 'act-003',
    farmerId: 'F001',
    type: 'agscore',
    title: 'AgScore™ Calculation',
    description: 'AgScore™ calculated: 379/1000 (Tier 3)',
    date: '2024-10-15'
  },
  {
    id: 'act-004',
    farmerId: 'F001',
    type: 'loan',
    title: 'Agricultural Loan',
    description: 'Approved loan of ₱50,000 for farm inputs',
    date: '2024-09-01',
    amount: 50000,
    status: 'active'
  },
  {
    id: 'act-005',
    farmerId: 'F001',
    type: 'payment',
    title: 'Loan Payment',
    description: 'Made monthly payment of ₱5,000',
    date: '2024-11-01',
    amount: 5000,
    status: 'completed'
  },
  {
    id: 'act-006',
    farmerId: 'F001',
    type: 'training',
    title: 'Organic Farming Training',
    description: 'Attended 2-day organic farming workshop',
    date: '2024-08-15'
  }
];

// Utility functions
export function getFarms(): Farm[] {
  return mockFarms;
}

export function getFarmById(id: string): Farm | undefined {
  return mockFarms.find(farm => farm.id === id);
}

export function getFarmsByFarmer(farmerId: string): Farm[] {
  return mockFarms.filter(farm => farm.farmerId === farmerId);
}

export function getFarmerActivities(farmerId: string): FarmerActivity[] {
  return mockActivities.filter(activity => activity.farmerId === farmerId);
}

export function addFarm(farm: Omit<Farm, 'id'>): Farm {
  const newFarm: Farm = {
    ...farm,
    id: `F${String(mockFarms.length + 1).padStart(3, '0')}`,
  };
  mockFarms.push(newFarm);
  return newFarm;
}

export function updateFarm(id: string, updates: Partial<Farm>): Farm | undefined {
  const index = mockFarms.findIndex(farm => farm.id === id);
  if (index !== -1) {
    mockFarms[index] = { ...mockFarms[index], ...updates };
    return mockFarms[index];
  }
  return undefined;
}

export function deleteFarm(id: string): boolean {
  const index = mockFarms.findIndex(farm => farm.id === id);
  if (index !== -1) {
    mockFarms.splice(index, 1);
    return true;
  }
  return false;
}

export function getActivityIcon(type: FarmerActivity['type']): string {
  switch (type) {
    case 'order': return '🛒';
    case 'harvest': return '🌾';
    case 'agscore': return '📊';
    case 'loan': return '💰';
    case 'payment': return '💳';
    case 'training': return '📚';
    default: return '📌';
  }
}

export function getActivityColor(type: FarmerActivity['type']): string {
  switch (type) {
    case 'order': return 'blue';
    case 'harvest': return 'green';
    case 'agscore': return 'purple';
    case 'loan': return 'orange';
    case 'payment': return 'teal';
    case 'training': return 'pink';
    default: return 'gray';
  }
}

