export type AuditActionType =
  | 'bulk_confirm_orders'
  | 'bulk_decline_orders'
  | 'bulk_mark_preparing'
  | 'bulk_inventory_update'
  | 'bulk_tracking_assign'
  | 'bulk_status_update'
  | 'single_order_confirm'
  | 'single_order_decline'
  | 'single_inventory_update'
  | 'single_tracking_assign'
  | 'permission_request_approved'
  | 'permission_request_rejected'
  | 'permission_request_cancelled';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  actionType: AuditActionType;
  actionDescription: string;
  affectedItemsCount: number;
  affectedItems: string[]; // IDs of affected orders/products/shipments
  details: {
    before?: any;
    after?: any;
    [key: string]: any;
  };
  category: 'orders' | 'inventory' | 'deliveries' | 'permissions';
}

// Mock audit log data
export const auditLogs: AuditLogEntry[] = [
  {
    id: 'audit-001',
    timestamp: '2024-11-17T14:30:00Z',
    userId: 'supplier-001',
    userName: 'Maria Santos',
    userRole: 'supplier',
    actionType: 'bulk_confirm_orders',
    actionDescription: 'Confirmed 5 pending orders',
    affectedItemsCount: 5,
    affectedItems: ['order-001', 'order-002', 'order-003', 'order-004', 'order-005'],
    details: {
      orderNumbers: ['ORD-2024-001', 'ORD-2024-002', 'ORD-2024-003', 'ORD-2024-004', 'ORD-2024-005'],
      totalValue: 125000
    },
    category: 'orders'
  },
  {
    id: 'audit-002',
    timestamp: '2024-11-17T13:15:00Z',
    userId: 'supplier-001',
    userName: 'Maria Santos',
    userRole: 'supplier',
    actionType: 'bulk_tracking_assign',
    actionDescription: 'Assigned tracking numbers to 3 shipments',
    affectedItemsCount: 3,
    affectedItems: ['order-006', 'order-007', 'order-008'],
    details: {
      carrier: 'LBC Express',
      trackingPrefix: 'LBC',
      trackingNumbers: ['LBC000123', 'LBC000124', 'LBC000125']
    },
    category: 'deliveries'
  },
  {
    id: 'audit-003',
    timestamp: '2024-11-17T11:45:00Z',
    userId: 'supplier-001',
    userName: 'Maria Santos',
    userRole: 'supplier',
    actionType: 'bulk_inventory_update',
    actionDescription: 'Increased stock by 20% for 4 products',
    affectedItemsCount: 4,
    affectedItems: ['prod-001', 'prod-002', 'prod-003', 'prod-004'],
    details: {
      updateType: 'increase',
      value: 20,
      unit: 'percentage',
      products: [
        { name: 'Urea 46-0-0', before: 2500, after: 3000 },
        { name: 'NPK 14-14-14', before: 1800, after: 2160 },
        { name: 'Organic Fertilizer', before: 500, after: 600 },
        { name: 'Hand Tractor', before: 15, after: 18 }
      ]
    },
    category: 'inventory'
  },
  {
    id: 'audit-004',
    timestamp: '2024-11-17T10:20:00Z',
    userId: 'supplier-001',
    userName: 'Maria Santos',
    userRole: 'supplier',
    actionType: 'bulk_status_update',
    actionDescription: 'Marked 2 shipments as In Transit',
    affectedItemsCount: 2,
    affectedItems: ['order-009', 'order-010'],
    details: {
      previousStatus: 'picked-up',
      newStatus: 'in-transit',
      orderNumbers: ['ORD-2024-009', 'ORD-2024-010']
    },
    category: 'deliveries'
  },
  {
    id: 'audit-005',
    timestamp: '2024-11-16T16:30:00Z',
    userId: 'supplier-001',
    userName: 'Maria Santos',
    userRole: 'supplier',
    actionType: 'bulk_decline_orders',
    actionDescription: 'Declined 2 orders due to stock unavailability',
    affectedItemsCount: 2,
    affectedItems: ['order-011', 'order-012'],
    details: {
      reason: 'Stock unavailable',
      orderNumbers: ['ORD-2024-011', 'ORD-2024-012'],
      totalValue: 45000
    },
    category: 'orders'
  },
  {
    id: 'audit-006',
    timestamp: '2024-11-16T14:15:00Z',
    userId: 'supplier-001',
    userName: 'Maria Santos',
    userRole: 'supplier',
    actionType: 'bulk_mark_preparing',
    actionDescription: 'Marked 3 confirmed orders as preparing',
    affectedItemsCount: 3,
    affectedItems: ['order-013', 'order-014', 'order-015'],
    details: {
      orderNumbers: ['ORD-2024-013', 'ORD-2024-014', 'ORD-2024-015']
    },
    category: 'orders'
  },
  {
    id: 'audit-007',
    timestamp: '2024-11-16T11:00:00Z',
    userId: 'supplier-001',
    userName: 'Maria Santos',
    userRole: 'supplier',
    actionType: 'bulk_inventory_update',
    actionDescription: 'Set stock to 1000 for 2 products',
    affectedItemsCount: 2,
    affectedItems: ['prod-001', 'prod-002'],
    details: {
      updateType: 'set',
      value: 1000,
      unit: 'bags',
      products: [
        { name: 'Urea 46-0-0', before: 2500, after: 1000 },
        { name: 'NPK 14-14-14', before: 1800, after: 1000 }
      ]
    },
    category: 'inventory'
  },
  {
    id: 'audit-008',
    timestamp: '2024-11-15T15:45:00Z',
    userId: 'supplier-001',
    userName: 'Maria Santos',
    userRole: 'supplier',
    actionType: 'bulk_tracking_assign',
    actionDescription: 'Assigned tracking numbers to 6 shipments',
    affectedItemsCount: 6,
    affectedItems: ['order-016', 'order-017', 'order-018', 'order-019', 'order-020', 'order-021'],
    details: {
      carrier: 'J&T Express',
      trackingPrefix: 'JNT',
      trackingNumbers: ['JNT000456', 'JNT000457', 'JNT000458', 'JNT000459', 'JNT000460', 'JNT000461']
    },
    category: 'deliveries'
  }
];

// Helper functions
export function getAuditLogs(filters?: {
  category?: 'orders' | 'inventory' | 'deliveries';
  actionType?: AuditActionType;
  userId?: string;
  startDate?: string;
  endDate?: string;
}): AuditLogEntry[] {
  let filtered = [...auditLogs];

  if (filters?.category) {
    filtered = filtered.filter(log => log.category === filters.category);
  }

  if (filters?.actionType) {
    filtered = filtered.filter(log => log.actionType === filters.actionType);
  }

  if (filters?.userId) {
    filtered = filtered.filter(log => log.userId === filters.userId);
  }

  if (filters?.startDate) {
    filtered = filtered.filter(log => new Date(log.timestamp) >= new Date(filters.startDate!));
  }

  if (filters?.endDate) {
    filtered = filtered.filter(log => new Date(log.timestamp) <= new Date(filters.endDate!));
  }

  return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getAuditLogStats() {
  const totalActions = auditLogs.length;
  const last24Hours = auditLogs.filter(log => {
    const logDate = new Date(log.timestamp);
    const now = new Date();
    const diff = now.getTime() - logDate.getTime();
    return diff < 24 * 60 * 60 * 1000;
  }).length;

  const byCategory = {
    orders: auditLogs.filter(log => log.category === 'orders').length,
    inventory: auditLogs.filter(log => log.category === 'inventory').length,
    deliveries: auditLogs.filter(log => log.category === 'deliveries').length
  };

  const totalAffectedItems = auditLogs.reduce((sum, log) => sum + log.affectedItemsCount, 0);

  return {
    totalActions,
    last24Hours,
    byCategory,
    totalAffectedItems
  };
}

export function addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
  const newEntry: AuditLogEntry = {
    ...entry,
    id: `audit-${Date.now()}`,
    timestamp: new Date().toISOString()
  };
  
  auditLogs.unshift(newEntry);
  return newEntry;
}
