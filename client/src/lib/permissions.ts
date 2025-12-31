import { UserRole } from "@/data/usersData";

/**
 * Permission types for the system
 */
export type Permission = 
  | 'retention_settings:view'
  | 'retention_settings:edit'
  | 'retention_settings:delete'
  | 'audit_log:view'
  | 'audit_log:export'
  | 'audit_archive:view'
  | 'audit_archive:restore'
  | 'audit_archive:delete'
  | 'batch_orders:create'
  | 'batch_orders:manage'
  | 'supplier_portal:access'
  | 'farmer_data:view'
  | 'farmer_data:edit';

/**
 * Role hierarchy levels (higher number = more privileges)
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  farmer: 1,
  field_officer: 2,
  manager: 3,
  supplier: 4,
  admin: 5,
  admin: 4
};

/**
 * Permission mappings for each role
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  farmer: [
    'farmer_data:view'
  ],
  field_officer: [
    'farmer_data:view',
    'farmer_data:edit',
    'batch_orders:create',
    'audit_log:view'
  ],
  manager: [
    'farmer_data:view',
    'farmer_data:edit',
    'batch_orders:create',
    'batch_orders:manage',
    'audit_log:view',
    'audit_log:export',
    'audit_archive:view',
    'audit_archive:restore',
    'retention_settings:view',
    'retention_settings:edit'
  ],
  supplier: [
    'supplier_portal:access',
    'audit_log:view',
    'audit_log:export',
    'audit_archive:view',
    'audit_archive:restore',
    'retention_settings:view'
  ],
  admin: [
    'farmer_data:view',
    'farmer_data:edit',
    'batch_orders:create',
    'batch_orders:manage',
    'audit_log:view',
    'audit_log:export',
    'audit_archive:view',
    'audit_archive:restore',
    'audit_archive:delete',
    'retention_settings:view',
    'retention_settings:edit',
    'retention_settings:delete',
    'supplier_portal:access'
  ]
};

/**
 * Permission descriptions for UI display
 */
export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  'retention_settings:view': 'View data retention settings',
  'retention_settings:edit': 'Modify retention period and auto-archive settings',
  'retention_settings:delete': 'Enable permanent deletion of archived data',
  'audit_log:view': 'View audit log entries',
  'audit_log:export': 'Export audit logs to CSV',
  'audit_archive:view': 'View archived audit logs',
  'audit_archive:restore': 'Restore archived logs to active state',
  'audit_archive:delete': 'Permanently delete archived logs',
  'batch_orders:create': 'Create new batch orders',
  'batch_orders:manage': 'Manage and approve batch orders',
  'supplier_portal:access': 'Access supplier portal features',
  'farmer_data:view': 'View farmer profiles and data',
  'farmer_data:edit': 'Edit farmer information'
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(userRole: UserRole | undefined, permission: Permission): boolean {
  if (!userRole) return false;
  
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(userRole: UserRole | undefined, permissions: Permission[]): boolean {
  if (!userRole) return false;
  
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(userRole: UserRole | undefined, permissions: Permission[]): boolean {
  if (!userRole) return false;
  
  return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if one role has higher privileges than another
 */
export function hasHigherRole(userRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[targetRole];
}

/**
 * Check if one role has equal or higher privileges than another
 */
export function hasEqualOrHigherRole(userRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[targetRole];
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    farmer: 'Farmer',
    field_officer: 'Field Officer',
    manager: 'Manager',
    supplier: 'Supplier',
    admin: 'Administrator'
  };
  
  return displayNames[role] || role;
}

/**
 * Get role badge color
 */
export function getRoleBadgeColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    farmer: 'bg-green-500',
    field_officer: 'bg-blue-500',
    manager: 'bg-purple-500',
    supplier: 'bg-orange-500',
    admin: 'bg-red-500'
  };
  
  return colors[role] || 'bg-gray-500';
}

/**
 * Check if user can modify retention settings
 */
export function canModifyRetentionSettings(userRole: UserRole | undefined): boolean {
  return hasPermission(userRole, 'retention_settings:edit');
}

/**
 * Check if user can enable permanent deletion
 */
export function canEnablePermanentDeletion(userRole: UserRole | undefined): boolean {
  return hasPermission(userRole, 'retention_settings:delete');
}

/**
 * Check if user can view retention settings
 */
export function canViewRetentionSettings(userRole: UserRole | undefined): boolean {
  return hasPermission(userRole, 'retention_settings:view');
}

/**
 * Get permission category
 */
export function getPermissionCategory(permission: Permission): string {
  const [category] = permission.split(':');
  return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Group permissions by category
 */
export function groupPermissionsByCategory(permissions: Permission[]): Record<string, Permission[]> {
  return permissions.reduce((acc, permission) => {
    const category = getPermissionCategory(permission);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);
}
