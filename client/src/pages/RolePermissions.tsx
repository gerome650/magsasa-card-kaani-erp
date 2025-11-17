import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  CheckCircle2,
  XCircle,
  Info
} from "lucide-react";
import {
  getRolePermissions,
  getRoleDisplayName,
  getRoleBadgeColor,
  PERMISSION_DESCRIPTIONS,
  groupPermissionsByCategory,
  ROLE_HIERARCHY,
  type Permission
} from "@/lib/permissions";
import { UserRole } from "@/data/usersData";

export default function RolePermissions() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Not Authenticated</h2>
            <p className="text-muted-foreground">
              Please log in to view your permissions.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userPermissions = getRolePermissions(user.role);
  const groupedPermissions = groupPermissionsByCategory(userPermissions);
  const allRoles: UserRole[] = ['farmer', 'field_officer', 'manager', 'supplier', 'admin'];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Role & Permissions</h1>
        <p className="text-muted-foreground">
          View your role and associated permissions in the system
        </p>
      </div>

      {/* Current Role Card */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full ${getRoleBadgeColor(user.role)} flex items-center justify-center flex-shrink-0`}>
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold">{getRoleDisplayName(user.role)}</h3>
                <Badge className={`${getRoleBadgeColor(user.role)} text-white`}>
                  Level {ROLE_HIERARCHY[user.role]}
                </Badge>
              </div>
              <p className="text-muted-foreground mb-4">
                Your current role in the MAGSASA-CARD system
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">User Name</p>
                  <p className="font-medium">{user.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Permissions</p>
                  <p className="font-medium">{userPermissions.length}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Your Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Your Permissions</CardTitle>
          <CardDescription>
            Actions you are authorized to perform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.entries(groupedPermissions).map(([category, permissions]) => (
            <div key={category} className="mb-6 last:mb-0">
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                {category}
              </h4>
              <div className="space-y-2">
                {permissions.map((permission) => (
                  <div
                    key={permission}
                    className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">{permission}</p>
                      <p className="text-sm text-muted-foreground">
                        {PERMISSION_DESCRIPTIONS[permission]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Role Hierarchy */}
      <Card>
        <CardHeader>
          <CardTitle>Role Hierarchy</CardTitle>
          <CardDescription>
            Permission levels in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {allRoles.sort((a, b) => ROLE_HIERARCHY[b] - ROLE_HIERARCHY[a]).map((role) => {
              const isCurrentRole = role === user.role;
              const rolePermissions = getRolePermissions(role);
              
              return (
                <Card
                  key={role}
                  className={isCurrentRole ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950' : ''}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Badge className={`${getRoleBadgeColor(role)} text-white`}>
                          Level {ROLE_HIERARCHY[role]}
                        </Badge>
                        <h4 className="font-semibold text-lg">
                          {getRoleDisplayName(role)}
                        </h4>
                        {isCurrentRole && (
                          <Badge variant="outline" className="border-blue-500 text-blue-600">
                            Your Role
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {rolePermissions.length} permissions
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {rolePermissions.slice(0, 5).map((permission) => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {permission.split(':')[0]}
                        </Badge>
                      ))}
                      {rolePermissions.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{rolePermissions.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-gray-50 dark:bg-gray-900">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium mb-1">About Permissions</p>
              <p className="text-muted-foreground">
                Your permissions are determined by your role in the system. Higher-level roles
                have access to more features and actions. Contact your administrator if you need
                additional permissions or a role change.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
