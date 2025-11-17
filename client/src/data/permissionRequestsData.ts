import { Permission } from "@/lib/permissions";
import { UserRole } from "./usersData";

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type UrgencyLevel = 'low' | 'medium' | 'high';

export interface PermissionRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  requesterRole: UserRole;
  requestedPermissions: Permission[];
  reason: string;
  urgency: UrgencyLevel;
  status: RequestStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewerName?: string;
  reviewerRole?: UserRole;
  approvalReason?: string;
  rejectionReason?: string;
}

// Mock permission requests
export const permissionRequests: PermissionRequest[] = [
  {
    id: 'req-001',
    requesterId: 'fo-001',
    requesterName: 'Maria Santos',
    requesterEmail: 'maria.santos@cardmri.com',
    requesterRole: 'field_officer',
    requestedPermissions: ['batch_orders:manage', 'audit_archive:restore'],
    reason: 'Need to manage batch orders for my assigned barangays and restore archived audit logs for quarterly reports.',
    urgency: 'medium',
    status: 'pending',
    submittedAt: '2024-11-17T08:30:00Z'
  },
  {
    id: 'req-002',
    requesterId: 'fo-002',
    requesterName: 'Juan Dela Cruz',
    requesterEmail: 'juan.delacruz@cardmri.com',
    requesterRole: 'field_officer',
    requestedPermissions: ['retention_settings:view'],
    reason: 'Would like to view data retention policies to better understand archiving timelines for farmer records.',
    urgency: 'low',
    status: 'approved',
    submittedAt: '2024-11-15T10:15:00Z',
    reviewedAt: '2024-11-15T14:30:00Z',
    reviewedBy: 'mgr-001',
    reviewerName: 'Roberto Garcia',
    reviewerRole: 'manager',
    approvalReason: 'Approved for transparency. Field officers should understand our data retention policies.'
  },
  {
    id: 'req-003',
    requesterId: 'supplier-002',
    requesterName: 'Green Valley Agri Supply',
    requesterEmail: 'admin@greenvalley.com',
    requesterRole: 'supplier',
    requestedPermissions: ['retention_settings:edit'],
    reason: 'Request access to modify retention settings to align with our internal compliance requirements.',
    urgency: 'high',
    status: 'rejected',
    submittedAt: '2024-11-14T09:00:00Z',
    reviewedAt: '2024-11-14T16:45:00Z',
    reviewedBy: 'mgr-001',
    reviewerName: 'Roberto Garcia',
    reviewerRole: 'manager',
    rejectionReason: 'Retention settings are managed internally by CARD MRI. Suppliers cannot modify these policies for security and compliance reasons.'
  },
  {
    id: 'req-004',
    requesterId: 'fo-003',
    requesterName: 'Ana Reyes',
    requesterEmail: 'ana.reyes@cardmri.com',
    requesterRole: 'field_officer',
    requestedPermissions: ['audit_log:export'],
    reason: 'Need to export audit logs for monthly field activity reports submitted to regional office.',
    urgency: 'medium',
    status: 'pending',
    submittedAt: '2024-11-16T13:20:00Z'
  }
];

/**
 * Get all permission requests
 */
export function getPermissionRequests(): PermissionRequest[] {
  return [...permissionRequests];
}

/**
 * Get permission requests by status
 */
export function getRequestsByStatus(status: RequestStatus): PermissionRequest[] {
  return permissionRequests.filter(req => req.status === status);
}

/**
 * Get permission requests for a specific user
 */
export function getUserRequests(userId: string): PermissionRequest[] {
  return permissionRequests.filter(req => req.requesterId === userId);
}

/**
 * Get pending requests count
 */
export function getPendingRequestsCount(): number {
  return permissionRequests.filter(req => req.status === 'pending').length;
}

/**
 * Create a new permission request
 */
export function createPermissionRequest(
  requesterId: string,
  requesterName: string,
  requesterEmail: string,
  requesterRole: UserRole,
  requestedPermissions: Permission[],
  reason: string,
  urgency: UrgencyLevel
): PermissionRequest {
  const newRequest: PermissionRequest = {
    id: `req-${String(permissionRequests.length + 1).padStart(3, '0')}`,
    requesterId,
    requesterName,
    requesterEmail,
    requesterRole,
    requestedPermissions,
    reason,
    urgency,
    status: 'pending',
    submittedAt: new Date().toISOString()
  };

  permissionRequests.unshift(newRequest);
  return newRequest;
}

/**
 * Approve a permission request
 */
export function approveRequest(
  requestId: string,
  reviewerId: string,
  reviewerName: string,
  reviewerRole: UserRole,
  approvalReason?: string
): PermissionRequest | null {
  const request = permissionRequests.find(req => req.id === requestId);
  
  if (!request || request.status !== 'pending') {
    return null;
  }

  request.status = 'approved';
  request.reviewedAt = new Date().toISOString();
  request.reviewedBy = reviewerId;
  request.reviewerName = reviewerName;
  request.reviewerRole = reviewerRole;
  request.approvalReason = approvalReason;

  return request;
}

/**
 * Reject a permission request
 */
export function rejectRequest(
  requestId: string,
  reviewerId: string,
  reviewerName: string,
  reviewerRole: UserRole,
  rejectionReason: string
): PermissionRequest | null {
  const request = permissionRequests.find(req => req.id === requestId);
  
  if (!request || request.status !== 'pending') {
    return null;
  }

  request.status = 'rejected';
  request.reviewedAt = new Date().toISOString();
  request.reviewedBy = reviewerId;
  request.reviewerName = reviewerName;
  request.reviewerRole = reviewerRole;
  request.rejectionReason = rejectionReason;

  return request;
}

/**
 * Cancel a permission request
 */
export function cancelRequest(requestId: string, userId: string): PermissionRequest | null {
  const request = permissionRequests.find(req => req.id === requestId);
  
  if (!request || request.requesterId !== userId || request.status !== 'pending') {
    return null;
  }

  request.status = 'cancelled';
  return request;
}

/**
 * Get urgency badge color
 */
export function getUrgencyColor(urgency: UrgencyLevel): string {
  const colors: Record<UrgencyLevel, string> = {
    low: 'bg-gray-500',
    medium: 'bg-yellow-500',
    high: 'bg-red-500'
  };
  return colors[urgency] || 'bg-gray-500';
}

/**
 * Get status badge color
 */
export function getStatusColor(status: RequestStatus): string {
  const colors: Record<RequestStatus, string> = {
    pending: 'bg-yellow-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500',
    cancelled: 'bg-gray-500'
  };
  return colors[status] || 'bg-gray-500';
}

/**
 * Get status display name
 */
export function getStatusDisplayName(status: RequestStatus): string {
  const names: Record<RequestStatus, string> = {
    pending: 'Pending Review',
    approved: 'Approved',
    rejected: 'Rejected',
    cancelled: 'Cancelled'
  };
  return names[status] || status;
}

/**
 * Get urgency display name
 */
export function getUrgencyDisplayName(urgency: UrgencyLevel): string {
  const names: Record<UrgencyLevel, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High'
  };
  return names[urgency] || urgency;
}
