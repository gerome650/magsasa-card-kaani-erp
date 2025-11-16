export interface Activity {
  id: string;
  farmerId: string;
  farmerName: string;
  farmId: string;
  type: 'planting' | 'fertilizing' | 'pesticide' | 'harvesting' | 'irrigation';
  description: string;
  date: string;
  status: 'completed' | 'in-progress' | 'pending';
  crop?: string;
}

export const activitiesData: Activity[] = [
  {
    id: 'A001',
    farmerId: 'F008',
    farmerName: 'Carlos Ramos',
    farmId: 'FM001',
    type: 'harvesting',
    description: 'Rice Harvesting',
    date: '2024-09-29',
    status: 'completed',
    crop: 'Rice'
  },
  {
    id: 'A002',
    farmerId: 'F002',
    farmerName: 'Juan Dela Cruz',
    farmId: 'FM002',
    type: 'fertilizing',
    description: 'Applied Complete Fertilizer 14-14-14',
    date: '2024-09-28',
    status: 'completed',
    crop: 'Rice'
  },
  {
    id: 'A003',
    farmerId: 'F004',
    farmerName: 'Pedro Garcia',
    farmId: 'FM004',
    type: 'pesticide',
    description: 'Applied Insecticide for pest control',
    date: '2024-09-27',
    status: 'completed',
    crop: 'Corn'
  },
  {
    id: 'A004',
    farmerId: 'F005',
    farmerName: 'Ana Mendoza',
    farmId: 'FM005',
    type: 'irrigation',
    description: 'Irrigation maintenance',
    date: '2024-09-26',
    status: 'completed',
    crop: 'Rice'
  },
  {
    id: 'A005',
    farmerId: 'F001',
    farmerName: 'Maria Santos',
    farmId: 'FM006',
    type: 'planting',
    description: 'Rice Planting',
    date: '2024-09-25',
    status: 'completed',
    crop: 'Rice'
  },
  {
    id: 'A006',
    farmerId: 'F006',
    farmerName: 'Roberto Cruz',
    farmId: 'FM007',
    type: 'fertilizing',
    description: 'Applied Urea Fertilizer',
    date: '2024-09-24',
    status: 'completed',
    crop: 'Rice'
  },
  {
    id: 'A007',
    farmerId: 'F007',
    farmerName: 'Luz Fernandez',
    farmId: 'FM008',
    type: 'planting',
    description: 'Tomato Seeds Planting',
    date: '2024-09-22',
    status: 'completed',
    crop: 'Vegetables'
  },
  {
    id: 'A008',
    farmerId: 'F003',
    farmerName: 'Rosa Reyes',
    farmId: 'FM009',
    type: 'harvesting',
    description: 'Vegetable Harvesting',
    date: '2024-09-20',
    status: 'completed',
    crop: 'Vegetables'
  },
  {
    id: 'A009',
    farmerId: 'F004',
    farmerName: 'Pedro Garcia',
    farmId: 'FM004',
    type: 'planting',
    description: 'Corn Planting - Upcoming',
    date: '2024-10-05',
    status: 'pending',
    crop: 'Corn'
  },
  {
    id: 'A010',
    farmerId: 'F002',
    farmerName: 'Juan Dela Cruz',
    farmId: 'FM002',
    type: 'irrigation',
    description: 'Scheduled irrigation',
    date: '2024-10-02',
    status: 'pending',
    crop: 'Rice'
  }
];

export const getRecentActivities = (limit: number = 5) => {
  return activitiesData
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
};

export const getActivityTypeIcon = (type: Activity['type']) => {
  const icons = {
    planting: '🌱',
    fertilizing: '🌿',
    pesticide: '🧪',
    harvesting: '🌾',
    irrigation: '💧'
  };
  return icons[type] || '📋';
};

export const getActivityTypeColor = (type: Activity['type']) => {
  const colors = {
    planting: 'bg-green-100 text-green-800',
    fertilizing: 'bg-blue-100 text-blue-800',
    pesticide: 'bg-purple-100 text-purple-800',
    harvesting: 'bg-yellow-100 text-yellow-800',
    irrigation: 'bg-cyan-100 text-cyan-800'
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
};

export const getStatusColor = (status: Activity['status']) => {
  const colors = {
    completed: 'bg-green-100 text-green-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    pending: 'bg-gray-100 text-gray-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};
