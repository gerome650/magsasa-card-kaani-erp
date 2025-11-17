// Supplier portal data models and mock data

export interface Supplier {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  contactPerson: string;
  businessType: 'manufacturer' | 'distributor' | 'wholesaler';
  registrationDate: string;
  status: 'active' | 'inactive' | 'suspended';
  rating: number;
  totalOrders: number;
  totalRevenue: number;
  logo?: string;
}

export interface SupplierProduct {
  id: string;
  supplierId: string;
  name: string;
  category: 'fertilizer' | 'seed' | 'pesticide' | 'equipment' | 'other';
  sku: string;
  unit: string;
  unitPrice: number;
  moq: number;
  stockLevel: number;
  stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock';
  reorderPoint: number;
  lastRestocked: string;
  description: string;
}

export interface SupplierOrder {
  id: string;
  batchOrderId: string;
  supplierId: string;
  orderNumber: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
  orderedAt: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  deliveryAddress: string;
  contactPerson: string;
  contactPhone: string;
  notes: string;
  farmerCount: number;
}

export interface SupplierShipment {
  id: string;
  orderId: string;
  trackingNumber: string;
  carrier: string;
  status: 'preparing' | 'picked-up' | 'in-transit' | 'out-for-delivery' | 'delivered';
  estimatedDelivery: string;
  actualDelivery?: string;
  origin: string;
  destination: string;
  notes: string;
  updates: ShipmentUpdate[];
}

export interface ShipmentUpdate {
  timestamp: string;
  status: string;
  location: string;
  description: string;
}

export interface SupplierMessage {
  id: string;
  orderId: string;
  supplierId: string;
  sender: 'supplier' | 'card-mri';
  senderName: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// Mock suppliers
export const suppliers: Supplier[] = [
  {
    id: 'SUP-001',
    name: 'Atlas Fertilizer Corporation',
    code: 'ATLAS',
    email: 'orders@atlasfertilizer.com.ph',
    phone: '(02) 8888-1234',
    address: 'Makati City, Metro Manila',
    contactPerson: 'Roberto Santos',
    businessType: 'manufacturer',
    registrationDate: '2020-01-15',
    status: 'active',
    rating: 4.8,
    totalOrders: 156,
    totalRevenue: 8450000
  },
  {
    id: 'SUP-002',
    name: 'Harvester Agricultural Equipment',
    code: 'HARVEST',
    email: 'sales@harvesterph.com',
    phone: '(02) 8777-5678',
    address: 'Quezon City, Metro Manila',
    contactPerson: 'Maria Cruz',
    businessType: 'distributor',
    registrationDate: '2020-03-20',
    status: 'active',
    rating: 4.6,
    totalOrders: 89,
    totalRevenue: 12300000
  },
  {
    id: 'SUP-003',
    name: 'Masinag Organic Fertilizers',
    code: 'MASINAG',
    email: 'info@masinagorganic.com',
    phone: '(049) 555-1234',
    address: 'Antipolo City, Rizal',
    contactPerson: 'Juan Dela Cruz',
    businessType: 'manufacturer',
    registrationDate: '2021-06-10',
    status: 'active',
    rating: 4.9,
    totalOrders: 203,
    totalRevenue: 5670000
  }
];

// Mock supplier products
export const supplierProducts: SupplierProduct[] = [
  {
    id: 'SP-001',
    supplierId: 'SUP-001',
    name: 'Urea Fertilizer 46-0-0',
    category: 'fertilizer',
    sku: 'ATL-UREA-50KG',
    unit: 'bags (50kg)',
    unitPrice: 1000,
    moq: 100,
    stockLevel: 2500,
    stockStatus: 'in-stock',
    reorderPoint: 500,
    lastRestocked: '2024-11-01',
    description: 'High-quality urea fertilizer for rice and corn farming'
  },
  {
    id: 'SP-002',
    supplierId: 'SUP-001',
    name: 'NPK 16-16-16 Complete Fertilizer',
    category: 'fertilizer',
    sku: 'ATL-NPK-50KG',
    unit: 'bags (50kg)',
    unitPrice: 1280,
    moq: 80,
    stockLevel: 350,
    stockStatus: 'low-stock',
    reorderPoint: 400,
    lastRestocked: '2024-10-15',
    description: 'Balanced NPK fertilizer for all-purpose agriculture'
  },
  {
    id: 'SP-003',
    supplierId: 'SUP-002',
    name: 'Hand Tractor 8HP Diesel',
    category: 'equipment',
    sku: 'HRV-HT-8HP',
    unit: 'units',
    unitPrice: 42000,
    moq: 5,
    stockLevel: 12,
    stockStatus: 'in-stock',
    reorderPoint: 3,
    lastRestocked: '2024-10-20',
    description: 'Durable hand tractor for small to medium farms'
  },
  {
    id: 'SP-004',
    supplierId: 'SUP-003',
    name: 'Vermicast Organic Fertilizer',
    category: 'fertilizer',
    sku: 'MSN-VERM-25KG',
    unit: 'bags (25kg)',
    unitPrice: 320,
    moq: 60,
    stockLevel: 1800,
    stockStatus: 'in-stock',
    reorderPoint: 200,
    lastRestocked: '2024-11-05',
    description: 'Premium vermicast for organic farming'
  }
];

// Mock supplier orders
export const supplierOrders: SupplierOrder[] = [
  {
    id: 'SO-001',
    batchOrderId: 'BO-001',
    supplierId: 'SUP-001',
    orderNumber: 'PO-2024-001',
    productId: 'SP-001',
    productName: 'Urea Fertilizer 46-0-0 (50kg)',
    quantity: 100,
    unit: 'bags',
    unitPrice: 1000,
    totalAmount: 100000,
    status: 'pending',
    orderedAt: '2024-11-15',
    deliveryAddress: 'CARD MRI Warehouse, San Pedro, Laguna',
    contactPerson: 'Pedro Garcia',
    contactPhone: '0917-123-4567',
    notes: 'Please deliver by November 28. Contact Field Officer upon arrival.',
    farmerCount: 23
  },
  {
    id: 'SO-002',
    batchOrderId: 'BO-003',
    supplierId: 'SUP-001',
    orderNumber: 'PO-2024-002',
    productId: 'SP-002',
    productName: 'NPK 16-16-16 Complete Fertilizer (50kg)',
    quantity: 85,
    unit: 'bags',
    unitPrice: 1280,
    totalAmount: 108800,
    status: 'confirmed',
    orderedAt: '2024-11-12',
    confirmedAt: '2024-11-13',
    deliveryAddress: 'Los Baños Municipal Agriculture Office, Los Baños, Laguna',
    contactPerson: 'Ana Mendoza',
    contactPhone: '0918-234-5678',
    notes: 'Confirmed. Will prepare shipment by November 18.',
    farmerCount: 28
  },
  {
    id: 'SO-003',
    batchOrderId: 'BO-004',
    supplierId: 'SUP-002',
    orderNumber: 'PO-2024-003',
    productId: 'SP-003',
    productName: 'Hand Tractor 8HP Diesel',
    quantity: 3,
    unit: 'units',
    unitPrice: 42000,
    totalAmount: 126000,
    status: 'shipped',
    orderedAt: '2024-11-05',
    confirmedAt: '2024-11-06',
    shippedAt: '2024-11-14',
    deliveryAddress: 'Bay Municipal Hall, Bay, Laguna',
    contactPerson: 'Roberto Cruz',
    contactPhone: '0919-345-6789',
    notes: 'Shipped via LBC. Tracking number: LBC123456789',
    farmerCount: 3
  },
  {
    id: 'SO-004',
    batchOrderId: 'BO-005',
    supplierId: 'SUP-003',
    orderNumber: 'PO-2024-004',
    productId: 'SP-004',
    productName: 'Vermicast Organic Fertilizer (25kg)',
    quantity: 72,
    unit: 'bags',
    unitPrice: 320,
    totalAmount: 23040,
    status: 'delivered',
    orderedAt: '2024-11-01',
    confirmedAt: '2024-11-02',
    shippedAt: '2024-11-10',
    deliveredAt: '2024-11-12',
    deliveryAddress: 'Calauan Barangay Dayap Hall, Calauan, Laguna',
    contactPerson: 'Luz Fernandez',
    contactPhone: '0920-456-7890',
    notes: 'Successfully delivered. All items received in good condition.',
    farmerCount: 31
  }
];

// Mock shipments
export const supplierShipments: SupplierShipment[] = [
  {
    id: 'SHIP-001',
    orderId: 'SO-003',
    trackingNumber: 'LBC123456789',
    carrier: 'LBC Express',
    status: 'in-transit',
    estimatedDelivery: '2024-11-18',
    origin: 'Quezon City Warehouse',
    destination: 'Bay Municipal Hall, Laguna',
    notes: '3 units of hand tractors',
    updates: [
      {
        timestamp: '2024-11-14T08:00:00',
        status: 'picked-up',
        location: 'Quezon City Warehouse',
        description: 'Package picked up by carrier'
      },
      {
        timestamp: '2024-11-14T14:30:00',
        status: 'in-transit',
        location: 'Manila Hub',
        description: 'In transit to Laguna'
      },
      {
        timestamp: '2024-11-15T09:00:00',
        status: 'in-transit',
        location: 'Calamba Hub',
        description: 'Arrived at Calamba sorting facility'
      }
    ]
  },
  {
    id: 'SHIP-002',
    orderId: 'SO-004',
    trackingNumber: 'MSN-20241110-001',
    carrier: 'Own Delivery',
    status: 'delivered',
    estimatedDelivery: '2024-11-12',
    actualDelivery: '2024-11-12T10:30:00',
    origin: 'Antipolo Warehouse',
    destination: 'Calauan Barangay Dayap Hall',
    notes: '72 bags of vermicast',
    updates: [
      {
        timestamp: '2024-11-10T06:00:00',
        status: 'preparing',
        location: 'Antipolo Warehouse',
        description: 'Order being prepared for shipment'
      },
      {
        timestamp: '2024-11-10T10:00:00',
        status: 'picked-up',
        location: 'Antipolo Warehouse',
        description: 'Loaded onto delivery truck'
      },
      {
        timestamp: '2024-11-12T10:30:00',
        status: 'delivered',
        location: 'Calauan Barangay Dayap Hall',
        description: 'Successfully delivered and received by Luz Fernandez'
      }
    ]
  }
];

// Mock messages
export const supplierMessages: SupplierMessage[] = [
  {
    id: 'MSG-001',
    orderId: 'SO-001',
    supplierId: 'SUP-001',
    sender: 'card-mri',
    senderName: 'Pedro Garcia (Field Officer)',
    message: 'Good day! We have a new batch order for 100 bags of Urea fertilizer. Can you confirm availability and delivery by November 28?',
    timestamp: '2024-11-15T09:00:00',
    read: true
  },
  {
    id: 'MSG-002',
    orderId: 'SO-002',
    supplierId: 'SUP-001',
    sender: 'supplier',
    senderName: 'Roberto Santos',
    message: 'Order confirmed! We have 85 bags of NPK ready. Will prepare for shipment by November 18.',
    timestamp: '2024-11-13T14:30:00',
    read: true
  },
  {
    id: 'MSG-003',
    orderId: 'SO-003',
    supplierId: 'SUP-002',
    sender: 'supplier',
    senderName: 'Maria Cruz',
    message: 'Shipment has been dispatched. Tracking number: LBC123456789. Expected delivery: November 18.',
    timestamp: '2024-11-14T16:00:00',
    read: true
  }
];

// Helper functions
export const getSupplierById = (id: string): Supplier | undefined => {
  return suppliers.find(s => s.id === id);
};

export const getSupplierProducts = (supplierId: string): SupplierProduct[] => {
  return supplierProducts.filter(p => p.supplierId === supplierId);
};

export const getSupplierOrders = (supplierId: string): SupplierOrder[] => {
  return supplierOrders.filter(o => o.supplierId === supplierId);
};

export const getOrdersByStatus = (supplierId: string, status: SupplierOrder['status']): SupplierOrder[] => {
  return supplierOrders.filter(o => o.supplierId === supplierId && o.status === status);
};

export const getSupplierShipment = (orderId: string): SupplierShipment | undefined => {
  return supplierShipments.find(s => s.orderId === orderId);
};

export const getOrderMessages = (orderId: string): SupplierMessage[] => {
  return supplierMessages.filter(m => m.orderId === orderId);
};

export const calculateSupplierMetrics = (supplierId: string) => {
  const orders = getSupplierOrders(supplierId);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const activeOrders = orders.filter(o => ['confirmed', 'preparing', 'shipped'].includes(o.status)).length;
  const completedOrders = orders.filter(o => o.status === 'delivered').length;
  const totalRevenue = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const avgOrderValue = completedOrders > 0 ? Math.round(totalRevenue / completedOrders) : 0;

  return {
    pendingOrders,
    activeOrders,
    completedOrders,
    totalRevenue,
    avgOrderValue
  };
};
