// Mock data for batch orders system

export interface BatchOrder {
  id: string;
  batchNumber: string;
  productId: string;
  productName: string;
  supplierId: string;
  supplierName: string;
  status: 'collecting' | 'ready' | 'ordered' | 'in-transit' | 'delivered' | 'distributed' | 'cancelled';
  moq: number;
  unit: string;
  currentQuantity: number;
  unitPrice: number;
  bulkPrice: number;
  deliveryCost: number;
  createdAt: string;
  closesAt: string;
  orderedAt?: string;
  deliveryDate?: string;
  deliveryLocation: string;
  barangay: string;
  municipality: string;
  farmerCount: number;
  totalValue: number;
  estimatedSavings: number;
  notes: string;
}

export interface FarmerBatchOrder {
  id: string;
  batchOrderId: string;
  farmerId: string;
  farmerName: string;
  quantity: number;
  unitPrice: number;
  deliveryShare: number;
  totalCost: number;
  paymentStatus: 'pending' | 'paid' | 'loan-approved' | 'overdue';
  paymentMethod: 'loan' | 'cash' | 'bank-transfer';
  orderedAt: string;
  collectedAt?: string;
  notes: string;
}

export interface DeliveryRoute {
  id: string;
  routeNumber: string;
  batchOrderIds: string[];
  scheduledDate: string;
  status: 'planned' | 'in-progress' | 'completed';
  driverName?: string;
  vehicleNumber?: string;
  stops: DeliveryStop[];
  totalDistance: number;
  estimatedDuration: number;
  notes: string;
}

export interface DeliveryStop {
  barangay: string;
  municipality: string;
  farmerCount: number;
  totalQuantity: number;
  arrivalTime?: string;
  completedAt?: string;
  notes: string;
}

// Mock batch orders
export const batchOrders: BatchOrder[] = [
  {
    id: 'BO-001',
    batchNumber: 'BO-2024-001',
    productId: 'P001',
    productName: 'Atlas Fertilizer - Urea 46-0-0 (50kg)',
    supplierId: 'SUP-001',
    supplierName: 'Atlas Fertilizer Corporation',
    status: 'collecting',
    moq: 100,
    unit: 'bags',
    currentQuantity: 67,
    unitPrice: 1200,
    bulkPrice: 1000,
    deliveryCost: 5000,
    createdAt: '2024-11-10',
    closesAt: '2024-11-20',
    deliveryDate: '2024-11-28',
    deliveryLocation: 'San Pedro Barangay Hall',
    barangay: 'San Pedro',
    municipality: 'San Pedro',
    farmerCount: 23,
    totalValue: 67000,
    estimatedSavings: 13400, // ₱200 savings per bag × 67 bags
    notes: 'Popular fertilizer for rice farming. 33 bags needed to reach MOQ.'
  },
  {
    id: 'BO-002',
    batchNumber: 'BO-2024-002',
    productId: 'P002',
    productName: 'Known-You Seeds - Hybrid Tomato F1 (100g)',
    supplierId: 'SUP-007',
    supplierName: 'Known-You Seed Philippines',
    status: 'ready',
    moq: 50,
    unit: 'packs',
    currentQuantity: 52,
    unitPrice: 850,
    bulkPrice: 720,
    deliveryCost: 2500,
    createdAt: '2024-11-05',
    closesAt: '2024-11-15',
    orderedAt: '2024-11-15',
    deliveryDate: '2024-11-22',
    deliveryLocation: 'Calamba CARD MRI Office',
    barangay: 'Real',
    municipality: 'Calamba',
    farmerCount: 18,
    totalValue: 37440,
    estimatedSavings: 6760, // ₱130 savings per pack × 52 packs
    notes: 'MOQ reached! Ready to submit order to supplier.'
  },
  {
    id: 'BO-003',
    batchNumber: 'BO-2024-003',
    productId: 'P003',
    productName: 'Yara NPK 16-16-16 Complete Fertilizer (50kg)',
    supplierId: 'SUP-004',
    supplierName: 'Yara Philippines',
    status: 'ordered',
    moq: 80,
    unit: 'bags',
    currentQuantity: 85,
    unitPrice: 1500,
    bulkPrice: 1280,
    deliveryCost: 4000,
    createdAt: '2024-11-01',
    closesAt: '2024-11-12',
    orderedAt: '2024-11-12',
    deliveryDate: '2024-11-20',
    deliveryLocation: 'Los Baños Municipal Agriculture Office',
    barangay: 'Batong Malake',
    municipality: 'Los Baños',
    farmerCount: 28,
    totalValue: 108800,
    estimatedSavings: 18700, // ₱220 savings per bag × 85 bags
    notes: 'Order submitted to Yara. Awaiting confirmation and delivery schedule.'
  },
  {
    id: 'BO-004',
    batchNumber: 'BO-2024-004',
    productId: 'P004',
    productName: 'Pioneer Hybrid Corn Seeds - P3939 (18kg)',
    supplierId: 'SUP-006',
    supplierName: 'Pioneer Hi-Bred Philippines',
    status: 'in-transit',
    moq: 30,
    unit: 'bags',
    currentQuantity: 35,
    unitPrice: 4200,
    bulkPrice: 3800,
    deliveryCost: 3500,
    createdAt: '2024-10-25',
    closesAt: '2024-11-05',
    orderedAt: '2024-11-05',
    deliveryDate: '2024-11-18',
    deliveryLocation: 'Bay Municipal Hall',
    barangay: 'Tranca',
    municipality: 'Bay',
    farmerCount: 12,
    totalValue: 133000,
    estimatedSavings: 14000, // ₱400 savings per bag × 35 bags
    notes: 'Shipment in transit from Manila warehouse. Expected arrival Nov 18.'
  },
  {
    id: 'BO-005',
    batchNumber: 'BO-2024-005',
    productId: 'P005',
    productName: 'Masinag Organic Fertilizer - Vermicast (25kg)',
    supplierId: 'SUP-003',
    supplierName: 'Masinag Organic Fertilizers',
    status: 'delivered',
    moq: 60,
    unit: 'bags',
    currentQuantity: 72,
    unitPrice: 380,
    bulkPrice: 320,
    deliveryCost: 2000,
    createdAt: '2024-10-20',
    closesAt: '2024-11-01',
    orderedAt: '2024-11-01',
    deliveryDate: '2024-11-12',
    deliveryLocation: 'Calauan Barangay Dayap Hall',
    barangay: 'Dayap',
    municipality: 'Calauan',
    farmerCount: 31,
    totalValue: 23040,
    estimatedSavings: 4320, // ₱60 savings per bag × 72 bags
    notes: 'Delivered! Farmers can collect at Barangay Hall from 8AM-5PM.'
  },
  {
    id: 'BO-006',
    batchNumber: 'BO-2024-006',
    productId: 'P006',
    productName: 'Harvester Hand Tractor - 8HP Diesel',
    supplierId: 'SUP-002',
    supplierName: 'Harvester Agricultural Equipment',
    status: 'collecting',
    moq: 5,
    unit: 'units',
    currentQuantity: 3,
    unitPrice: 48000,
    bulkPrice: 42000,
    deliveryCost: 8000,
    createdAt: '2024-11-08',
    closesAt: '2024-11-25',
    deliveryDate: '2024-12-05',
    deliveryLocation: 'Victoria Municipal Agriculture Office',
    barangay: 'Daniw',
    municipality: 'Victoria',
    farmerCount: 3,
    totalValue: 126000,
    estimatedSavings: 18000, // ₱6,000 savings per unit × 3 units
    notes: 'High-value equipment batch. 2 more units needed to reach MOQ.'
  },
  {
    id: 'BO-007',
    batchNumber: 'BO-2024-007',
    productId: 'P007',
    productName: 'PhilRice Certified Seeds - NSIC Rc222 (20kg)',
    supplierId: 'SUP-005',
    supplierName: 'PhilRice Seed Growers',
    status: 'collecting',
    moq: 40,
    unit: 'bags',
    currentQuantity: 28,
    unitPrice: 1100,
    bulkPrice: 950,
    deliveryCost: 2500,
    createdAt: '2024-11-12',
    closesAt: '2024-11-22',
    deliveryDate: '2024-11-30',
    deliveryLocation: 'San Pedro CARD MRI Office',
    barangay: 'San Pedro',
    municipality: 'San Pedro',
    farmerCount: 15,
    totalValue: 26600,
    estimatedSavings: 4200, // ₱150 savings per bag × 28 bags
    notes: 'Certified rice seeds for next planting season. 12 bags to MOQ.'
  }
];

// Mock farmer orders within batches
export const farmerBatchOrders: FarmerBatchOrder[] = [
  // Batch BO-001 (Urea Fertilizer) - 23 farmers
  {
    id: 'FBO-001',
    batchOrderId: 'BO-001',
    farmerId: 'F001',
    farmerName: 'Maria Santos',
    quantity: 5,
    unitPrice: 1000,
    deliveryShare: 217, // ₱5,000 ÷ 23 farmers
    totalCost: 5217,
    paymentStatus: 'loan-approved',
    paymentMethod: 'loan',
    orderedAt: '2024-11-11',
    notes: 'Loan approved. Will deduct from next harvest payment.'
  },
  {
    id: 'FBO-002',
    batchOrderId: 'BO-001',
    farmerId: 'F002',
    farmerName: 'Juan Dela Cruz',
    quantity: 8,
    unitPrice: 1000,
    deliveryShare: 217,
    totalCost: 8217,
    paymentStatus: 'paid',
    paymentMethod: 'cash',
    orderedAt: '2024-11-12',
    notes: 'Paid in cash at CARD MRI office.'
  },
  {
    id: 'FBO-003',
    batchOrderId: 'BO-001',
    farmerId: 'F003',
    farmerName: 'Rosa Reyes',
    quantity: 3,
    unitPrice: 1000,
    deliveryShare: 217,
    totalCost: 3217,
    paymentStatus: 'pending',
    paymentMethod: 'bank-transfer',
    orderedAt: '2024-11-13',
    notes: 'Awaiting bank transfer confirmation.'
  },
  // Batch BO-002 (Tomato Seeds) - 18 farmers
  {
    id: 'FBO-004',
    batchOrderId: 'BO-002',
    farmerId: 'F004',
    farmerName: 'Pedro Garcia',
    quantity: 4,
    unitPrice: 720,
    deliveryShare: 139, // ₱2,500 ÷ 18 farmers
    totalCost: 3019,
    paymentStatus: 'loan-approved',
    paymentMethod: 'loan',
    orderedAt: '2024-11-06',
    notes: 'Ready for delivery Nov 22.'
  },
  {
    id: 'FBO-005',
    batchOrderId: 'BO-002',
    farmerId: 'F005',
    farmerName: 'Ana Mendoza',
    quantity: 2,
    unitPrice: 720,
    deliveryShare: 139,
    totalCost: 1579,
    paymentStatus: 'paid',
    paymentMethod: 'cash',
    orderedAt: '2024-11-07',
    notes: 'Paid in full. Awaiting delivery.'
  },
  // Batch BO-005 (Organic Fertilizer) - 31 farmers, delivered
  {
    id: 'FBO-006',
    batchOrderId: 'BO-005',
    farmerId: 'F001',
    farmerName: 'Maria Santos',
    quantity: 3,
    unitPrice: 320,
    deliveryShare: 65, // ₱2,000 ÷ 31 farmers
    totalCost: 1025,
    paymentStatus: 'paid',
    paymentMethod: 'loan',
    orderedAt: '2024-10-22',
    collectedAt: '2024-11-12',
    notes: 'Collected on delivery day.'
  },
  {
    id: 'FBO-007',
    batchOrderId: 'BO-005',
    farmerId: 'F006',
    farmerName: 'Roberto Cruz',
    quantity: 2,
    unitPrice: 320,
    deliveryShare: 65,
    totalCost: 705,
    paymentStatus: 'paid',
    paymentMethod: 'cash',
    orderedAt: '2024-10-23',
    collectedAt: '2024-11-13',
    notes: 'Collected one day late.'
  }
];

// Mock delivery routes
export const deliveryRoutes: DeliveryRoute[] = [
  {
    id: 'DR-001',
    routeNumber: 'DR-2024-001',
    batchOrderIds: ['BO-003', 'BO-004'],
    scheduledDate: '2024-11-20',
    status: 'planned',
    driverName: 'Carlos Mendoza',
    vehicleNumber: 'ABC-1234',
    stops: [
      {
        barangay: 'Batong Malake',
        municipality: 'Los Baños',
        farmerCount: 28,
        totalQuantity: 85,
        notes: 'Municipal Agriculture Office - 8:00 AM'
      },
      {
        barangay: 'Tranca',
        municipality: 'Bay',
        farmerCount: 12,
        totalQuantity: 35,
        notes: 'Municipal Hall - 11:00 AM'
      }
    ],
    totalDistance: 45,
    estimatedDuration: 180,
    notes: 'Combined delivery for Los Baños and Bay batches.'
  },
  {
    id: 'DR-002',
    routeNumber: 'DR-2024-002',
    batchOrderIds: ['BO-002'],
    scheduledDate: '2024-11-22',
    status: 'planned',
    driverName: 'Felipe Santos',
    vehicleNumber: 'XYZ-5678',
    stops: [
      {
        barangay: 'Real',
        municipality: 'Calamba',
        farmerCount: 18,
        totalQuantity: 52,
        notes: 'CARD MRI Office - 9:00 AM'
      }
    ],
    totalDistance: 25,
    estimatedDuration: 90,
    notes: 'Single stop delivery for Calamba tomato seeds.'
  },
  {
    id: 'DR-003',
    routeNumber: 'DR-2024-003',
    batchOrderIds: ['BO-005'],
    scheduledDate: '2024-11-12',
    status: 'completed',
    driverName: 'Ramon Torres',
    vehicleNumber: 'DEF-9012',
    stops: [
      {
        barangay: 'Dayap',
        municipality: 'Calauan',
        farmerCount: 31,
        totalQuantity: 72,
        arrivalTime: '2024-11-12T09:15:00',
        completedAt: '2024-11-12T11:30:00',
        notes: 'Barangay Hall - Delivered successfully'
      }
    ],
    totalDistance: 35,
    estimatedDuration: 120,
    notes: 'Completed delivery. 29/31 farmers collected on day 1.'
  }
];

// Helper functions
export const getBatchOrderById = (id: string): BatchOrder | undefined => {
  return batchOrders.find(batch => batch.id === id);
};

export const getFarmerOrdersByBatchId = (batchId: string): FarmerBatchOrder[] => {
  return farmerBatchOrders.filter(order => order.batchOrderId === batchId);
};

export const getBatchOrdersByStatus = (status: BatchOrder['status']): BatchOrder[] => {
  return batchOrders.filter(batch => batch.status === status);
};

export const getActiveBatchOrders = (): BatchOrder[] => {
  return batchOrders.filter(batch => 
    batch.status === 'collecting' || 
    batch.status === 'ready' || 
    batch.status === 'ordered' || 
    batch.status === 'in-transit'
  );
};

export const calculateMOQProgress = (batch: BatchOrder): number => {
  return Math.round((batch.currentQuantity / batch.moq) * 100);
};

export const calculateTotalSavings = (): number => {
  return batchOrders.reduce((sum, batch) => sum + batch.estimatedSavings, 0);
};

export const calculateTotalBatchValue = (): number => {
  return batchOrders.reduce((sum, batch) => sum + batch.totalValue, 0);
};

export const getTotalParticipatingFarmers = (): number => {
  // Count unique farmers across all batches
  const uniqueFarmers = new Set(farmerBatchOrders.map(order => order.farmerId));
  return uniqueFarmers.size;
};
