import { Product } from './productsData';

export type OrderStatus = 'pending' | 'processing' | 'in_transit' | 'delivered' | 'completed' | 'cancelled';

export interface OrderItem {
  product: Product;
  quantity: number;
  priceAtPurchase: number; // Price at time of purchase
}

export interface Order {
  orderId: string;
  farmerId: string;
  farmerName: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: 'loan' | 'cash';
  deliveryAddress: string;
  contactNumber: string;
  orderDate: Date;
  processedDate?: Date;
  shippedDate?: Date;
  deliveredDate?: Date;
  notes?: string;
}

// Mock order history data
export const ordersData: Order[] = [
  {
    orderId: 'ORD-20241115-001',
    farmerId: 'U001',
    farmerName: 'Maria Santos',
    items: [
      {
        product: {
          id: 'P001',
          name: 'Atlas Perfect Gro 14-14-14',
          brand: 'Atlas',
          category: 'Fertilizers',
          priceMin: 1490,
          priceMax: 1841,
          unit: '50kg bag',
          description: 'Complete NPK fertilizer with balanced nutrients for optimal crop growth',
          composition: 'Nitrogen (N) 14%, Phosphorus (P) 14%, Potassium (K) 14%',
          supplier: 'Atlas Fertilizer Corporation',
          imageUrl: '/placeholder-product.png',
          inStock: true,
          cardMriNegotiated: true
        },
        quantity: 10,
        priceAtPurchase: 1665
      },
      {
        product: {
          id: 'P007',
          name: 'PhilRice Mestizo 20',
          brand: 'PhilRice',
          category: 'Seeds',
          priceMin: 2800,
          priceMax: 3200,
          unit: '20kg bag',
          description: 'High-yielding hybrid rice variety developed by PhilRice',
          composition: 'Certified seeds, 95% germination rate',
          supplier: 'Philippine Rice Research Institute',
          imageUrl: '/placeholder-product.png',
          inStock: true,
          cardMriNegotiated: true
        },
        quantity: 5,
        priceAtPurchase: 3000
      }
    ],
    totalAmount: 31650,
    status: 'delivered',
    paymentMethod: 'loan',
    deliveryAddress: 'Brgy. San Isidro, Calauan, Laguna',
    contactNumber: '+63 917 123 4567',
    orderDate: new Date('2024-11-15T09:30:00'),
    processedDate: new Date('2024-11-15T14:00:00'),
    shippedDate: new Date('2024-11-16T08:00:00'),
    deliveredDate: new Date('2024-11-17T15:30:00'),
    notes: 'Delivered successfully. Farmer confirmed receipt.'
  },
  {
    orderId: 'ORD-20241110-002',
    farmerId: 'U001',
    farmerName: 'Maria Santos',
    items: [
      {
        product: {
          id: 'P004',
          name: 'Harvester Complete 14-14-14',
          brand: 'Harvester',
          category: 'Fertilizers',
          priceMin: 1480,
          priceMax: 1480,
          unit: '50kg bag',
          description: 'All-purpose complete fertilizer with balanced NPK ratio',
          composition: 'Nitrogen (N) 14%, Phosphorus (P) 14%, Potassium (K) 14%',
          supplier: 'Harvester Agricultural Corporation',
          imageUrl: '/placeholder-product.png',
          inStock: true,
          cardMriNegotiated: true
        },
        quantity: 20,
        priceAtPurchase: 1480
      }
    ],
    totalAmount: 29600,
    status: 'completed',
    paymentMethod: 'loan',
    deliveryAddress: 'Brgy. San Isidro, Calauan, Laguna',
    contactNumber: '+63 917 123 4567',
    orderDate: new Date('2024-11-10T10:15:00'),
    processedDate: new Date('2024-11-10T16:00:00'),
    shippedDate: new Date('2024-11-11T09:00:00'),
    deliveredDate: new Date('2024-11-12T14:00:00'),
    notes: 'Order completed. Payment deducted from loan balance.'
  },
  {
    orderId: 'ORD-20241105-003',
    farmerId: 'U001',
    farmerName: 'Maria Santos',
    items: [
      {
        product: {
          id: 'P013',
          name: 'Hand Trowel Set',
          brand: 'Generic',
          category: 'Tools',
          priceMin: 350,
          priceMax: 450,
          unit: 'set',
          description: 'Durable hand trowel set for planting and weeding',
          composition: 'Stainless steel blade, ergonomic handle',
          supplier: 'Local Hardware Supplier',
          imageUrl: '/placeholder-product.png',
          inStock: true,
          cardMriNegotiated: false
        },
        quantity: 3,
        priceAtPurchase: 400
      },
      {
        product: {
          id: 'P006',
          name: 'Harvester Organic Fertilizer',
          brand: 'Harvester',
          category: 'Organic',
          priceMin: 1200,
          priceMax: 1200,
          unit: '50kg bag',
          description: 'Certified organic fertilizer made from natural materials',
          composition: 'Organic matter 60%, NPK 4-3-2',
          supplier: 'Harvester Agricultural Corporation',
          imageUrl: '/placeholder-product.png',
          inStock: true,
          cardMriNegotiated: true
        },
        quantity: 5,
        priceAtPurchase: 1200
      }
    ],
    totalAmount: 7200,
    status: 'in_transit',
    paymentMethod: 'cash',
    deliveryAddress: 'Brgy. San Isidro, Calauan, Laguna',
    contactNumber: '+63 917 123 4567',
    orderDate: new Date('2024-11-05T11:20:00'),
    processedDate: new Date('2024-11-05T15:30:00'),
    shippedDate: new Date('2024-11-06T10:00:00'),
    notes: 'In transit. Expected delivery: Nov 18, 2024'
  },
  {
    orderId: 'ORD-20241101-004',
    farmerId: 'U001',
    farmerName: 'Maria Santos',
    items: [
      {
        product: {
          id: 'P002',
          name: 'Atlas Super Gro 16-20-0',
          brand: 'Atlas',
          category: 'Fertilizers',
          priceMin: 1560,
          priceMax: 1920,
          unit: '50kg bag',
          description: 'High phosphorus fertilizer for root development and early plant growth',
          composition: 'Nitrogen (N) 16%, Phosphorus (P) 20%, Potassium (K) 0%',
          supplier: 'Atlas Fertilizer Corporation',
          imageUrl: '/placeholder-product.png',
          inStock: true,
          cardMriNegotiated: true
        },
        quantity: 8,
        priceAtPurchase: 1740
      }
    ],
    totalAmount: 13920,
    status: 'processing',
    paymentMethod: 'loan',
    deliveryAddress: 'Brgy. San Isidro, Calauan, Laguna',
    contactNumber: '+63 917 123 4567',
    orderDate: new Date('2024-11-01T14:45:00'),
    processedDate: new Date('2024-11-01T18:00:00'),
    notes: 'Order is being prepared for shipment.'
  },
  {
    orderId: 'ORD-20241025-005',
    farmerId: 'U001',
    farmerName: 'Maria Santos',
    items: [
      {
        product: {
          id: 'P008',
          name: 'PhilRice NSIC Rc222',
          brand: 'PhilRice',
          category: 'Seeds',
          priceMin: 2500,
          priceMax: 2900,
          unit: '20kg bag',
          description: 'Premium quality inbred rice variety with high yield potential',
          composition: 'Certified seeds, 98% purity',
          supplier: 'Philippine Rice Research Institute',
          imageUrl: '/placeholder-product.png',
          inStock: true,
          cardMriNegotiated: true
        },
        quantity: 10,
        priceAtPurchase: 2700
      }
    ],
    totalAmount: 27000,
    status: 'pending',
    paymentMethod: 'loan',
    deliveryAddress: 'Brgy. San Isidro, Calauan, Laguna',
    contactNumber: '+63 917 123 4567',
    orderDate: new Date('2024-10-25T09:00:00'),
    notes: 'Waiting for stock availability.'
  }
];

// Helper functions
export const getOrdersByFarmerId = (farmerId: string): Order[] => {
  return ordersData
    .filter(order => order.farmerId === farmerId)
    .sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
};

export const getOrderById = (orderId: string): Order | undefined => {
  return ordersData.find(order => order.orderId === orderId);
};

export const getOrderStatusLabel = (status: OrderStatus): string => {
  const labels: Record<OrderStatus, string> = {
    pending: 'Pending',
    processing: 'Processing',
    in_transit: 'In Transit',
    delivered: 'Delivered',
    completed: 'Completed',
    cancelled: 'Cancelled'
  };
  return labels[status];
};

export const getOrderStatusColor = (status: OrderStatus): string => {
  const colors: Record<OrderStatus, string> = {
    pending: 'bg-orange-100 text-orange-700 border-orange-200',
    processing: 'bg-blue-100 text-blue-700 border-blue-200',
    in_transit: 'bg-purple-100 text-purple-700 border-purple-200',
    delivered: 'bg-green-100 text-green-700 border-green-200',
    completed: 'bg-gray-100 text-gray-700 border-gray-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200'
  };
  return colors[status];
};
