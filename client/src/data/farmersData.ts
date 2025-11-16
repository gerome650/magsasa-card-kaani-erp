export interface Farmer {
  id: string;
  name: string;
  location: string;
  barangay: string;
  municipality: string;
  province: string;
  contactNumber: string;
  email?: string;
  cardMemberSince: string;
  totalLandArea: number; // in hectares
  activeFarms: number;
  totalHarvest: number; // in MT
  status: 'active' | 'inactive';
  profileImage?: string;
  crops: string[];
  lastActivity: string;
}

export const farmersData: Farmer[] = [
  {
    id: 'F001',
    name: 'Maria Santos',
    location: 'Brgy. San Isidro, Calauan, Laguna',
    barangay: 'San Isidro',
    municipality: 'Calauan',
    province: 'Laguna',
    contactNumber: '+63 917 123 4567',
    email: 'maria.santos@example.com',
    cardMemberSince: '2023-01-15',
    totalLandArea: 2.5,
    activeFarms: 2,
    totalHarvest: 12.5,
    status: 'active',
    crops: ['Rice', 'Corn'],
    lastActivity: '2024-09-25'
  },
  {
    id: 'F002',
    name: 'Juan Dela Cruz',
    location: 'Brgy. Dayap, Calauan, Laguna',
    barangay: 'Dayap',
    municipality: 'Calauan',
    province: 'Laguna',
    contactNumber: '+63 918 234 5678',
    email: 'juan.delacruz@example.com',
    cardMemberSince: '2022-06-20',
    totalLandArea: 3.0,
    activeFarms: 1,
    totalHarvest: 15.8,
    status: 'active',
    crops: ['Rice'],
    lastActivity: '2024-09-28'
  },
  {
    id: 'F003',
    name: 'Rosa Reyes',
    location: 'Brgy. Lamot 1, Calauan, Laguna',
    barangay: 'Lamot 1',
    municipality: 'Calauan',
    province: 'Laguna',
    contactNumber: '+63 919 345 6789',
    cardMemberSince: '2023-03-10',
    totalLandArea: 1.8,
    activeFarms: 2,
    totalHarvest: 9.2,
    status: 'active',
    crops: ['Vegetables', 'Rice'],
    lastActivity: '2024-09-20'
  },
  {
    id: 'F004',
    name: 'Pedro Garcia',
    location: 'Brgy. Prinza, Calauan, Laguna',
    barangay: 'Prinza',
    municipality: 'Calauan',
    province: 'Laguna',
    contactNumber: '+63 920 456 7890',
    email: 'pedro.garcia@example.com',
    cardMemberSince: '2021-11-05',
    totalLandArea: 4.2,
    activeFarms: 3,
    totalHarvest: 22.4,
    status: 'active',
    crops: ['Rice', 'Corn', 'Vegetables'],
    lastActivity: '2024-09-27'
  },
  {
    id: 'F005',
    name: 'Ana Mendoza',
    location: 'Brgy. Balayhangin, Calauan, Laguna',
    barangay: 'Balayhangin',
    municipality: 'Calauan',
    province: 'Laguna',
    contactNumber: '+63 921 567 8901',
    cardMemberSince: '2023-07-18',
    totalLandArea: 2.0,
    activeFarms: 1,
    totalHarvest: 10.5,
    status: 'active',
    crops: ['Rice'],
    lastActivity: '2024-09-26'
  },
  {
    id: 'F006',
    name: 'Roberto Cruz',
    location: 'Brgy. Kanluran, Calauan, Laguna',
    barangay: 'Kanluran',
    municipality: 'Calauan',
    province: 'Laguna',
    contactNumber: '+63 922 678 9012',
    email: 'roberto.cruz@example.com',
    cardMemberSince: '2022-09-12',
    totalLandArea: 3.5,
    activeFarms: 2,
    totalHarvest: 18.7,
    status: 'active',
    crops: ['Rice', 'Vegetables'],
    lastActivity: '2024-09-24'
  },
  {
    id: 'F007',
    name: 'Luz Fernandez',
    location: 'Brgy. Silang, Calauan, Laguna',
    barangay: 'Silang',
    municipality: 'Calauan',
    province: 'Laguna',
    contactNumber: '+63 923 789 0123',
    cardMemberSince: '2023-02-28',
    totalLandArea: 1.5,
    activeFarms: 1,
    totalHarvest: 7.8,
    status: 'active',
    crops: ['Vegetables'],
    lastActivity: '2024-09-22'
  },
  {
    id: 'F008',
    name: 'Carlos Ramos',
    location: 'Brgy. Dayap, Calauan, Laguna',
    barangay: 'Dayap',
    municipality: 'Calauan',
    province: 'Laguna',
    contactNumber: '+63 924 890 1234',
    email: 'carlos.ramos@example.com',
    cardMemberSince: '2021-08-15',
    totalLandArea: 5.0,
    activeFarms: 4,
    totalHarvest: 28.3,
    status: 'active',
    crops: ['Rice', 'Corn'],
    lastActivity: '2024-09-29'
  }
];

export const getDashboardStats = () => {
  const totalFarmers = farmersData.length;
  const activeFarms = farmersData.reduce((sum, farmer) => sum + farmer.activeFarms, 0);
  const totalHarvest = farmersData.reduce((sum, farmer) => sum + farmer.totalHarvest, 0);
  const totalRevenue = totalHarvest * 25000; // Average ₱25,000 per MT

  return {
    totalFarmers,
    activeFarms,
    totalHarvest: Math.round(totalHarvest * 10) / 10,
    totalRevenue
  };
};

export const getCropDistribution = () => {
  const cropCounts: Record<string, number> = {};
  
  farmersData.forEach(farmer => {
    farmer.crops.forEach(crop => {
      cropCounts[crop] = (cropCounts[crop] || 0) + 1;
    });
  });

  return Object.entries(cropCounts).map(([name, value]) => ({
    name,
    value
  }));
};
