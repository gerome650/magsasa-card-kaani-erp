import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getClientRole } from "@/const";
import {
  auditLogs,
  getAuditLogs,
  getAuditLogStats,
  AuditLogEntry,
  AuditActionType
} from "@/data/auditLogData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Package,
  Box,
  Truck,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Navigation,
  Clock,
  User,
  Filter,
  Download
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import AutoArchiveManager from "@/components/AutoArchiveManager";

export default function AuditLog() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [actionTypeFilter, setActionTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const stats = getAuditLogStats();

  // Apply filters
  const filteredLogs = getAuditLogs({
    category: categoryFilter !== "all" ? categoryFilter as any : undefined,
    actionType: actionTypeFilter !== "all" ? actionTypeFilter as AuditActionType : undefined,
    startDate: dateRange.start || undefined,
    endDate: dateRange.end || undefined
  }).filter(log => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.actionDescription.toLowerCase().includes(query) ||
      log.userName.toLowerCase().includes(query) ||
      log.affectedItems.some(item => item.toLowerCase().includes(query))
    );
  });

  // Action type configuration
  const actionTypeConfig: Record<AuditActionType, { label: string; icon: any; color: string }> = {
    'bulk_confirm_orders': { label: 'Bulk Confirm Orders', icon: CheckCircle2, color: 'bg-green-500' },
    'bulk_decline_orders': { label: 'Bulk Decline Orders', icon: XCircle, color: 'bg-red-500' },
    'bulk_mark_preparing': { label: 'Bulk Mark Preparing', icon: Package, color: 'bg-purple-500' },
    'bulk_inventory_update': { label: 'Bulk Inventory Update', icon: TrendingUp, color: 'bg-blue-500' },
    'bulk_tracking_assign': { label: 'Bulk Tracking Assign', icon: Navigation, color: 'bg-orange-500' },
    'bulk_status_update': { label: 'Bulk Status Update', icon: Truck, color: 'bg-yellow-500' },
    'single_order_confirm': { label: 'Confirm Order', icon: CheckCircle2, color: 'bg-green-400' },
    'single_order_decline': { label: 'Decline Order', icon: XCircle, color: 'bg-red-400' },
    'single_inventory_update': { label: 'Update Inventory', icon: Box, color: 'bg-blue-400' },
    'single_tracking_assign': { label: 'Assign Tracking', icon: Navigation, color: 'bg-orange-400' },
    'permission_request_approved': { label: 'Permission Approved', icon: CheckCircle2, color: 'bg-green-400' },
    'permission_request_rejected': { label: 'Permission Rejected', icon: XCircle, color: 'bg-red-400' },
    'permission_request_cancelled': { label: 'Permission Cancelled', icon: XCircle, color: 'bg-gray-400' }
  };

  const categoryConfig: Record<'orders' | 'inventory' | 'deliveries' | 'permissions', { label: string; icon: any; color: string }> = {
    orders: { label: 'Orders', icon: Package, color: 'bg-blue-100 text-blue-700' },
    inventory: { label: 'Inventory', icon: Box, color: 'bg-green-100 text-green-700' },
    deliveries: { label: 'Deliveries', icon: Truck, color: 'bg-orange-100 text-orange-700' },
    permissions: { label: 'Permissions', icon: FileText, color: 'bg-purple-100 text-purple-700' }
  };

  const handleExport = () => {
    toast.success("Audit log exported", {
      description: "CSV file will be downloaded shortly"
    });
  };

  const handleClearFilters = () => {
    setCategoryFilter("all");
    setActionTypeFilter("all");
    setSearchQuery("");
    setDateRange({ start: "", end: "" });
  };

  // Check if user is supplier using getClientRole to map server role to client role
  const clientRole = getClientRole(user);
  const isSupplier = clientRole === 'supplier';

  if (!isSupplier) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Supplier Access Only</h2>
            <p className="text-muted-foreground">
              Audit logs are only accessible to registered suppliers.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Log</h1>
          <p className="text-muted-foreground">
            Track all bulk actions and changes made in the supplier portal
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setLocation('/supplier/audit-archive')}>
            <FileText className="w-4 h-4 mr-2" />
            View Archives
          </Button>
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Auto Archive Manager */}
      <AutoArchiveManager />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Total Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalActions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Last 24 Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.last24Hours}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Recent activity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="w-4 h-4" />
              Items Affected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalAffectedItems}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total changes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              By Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Orders:</span>
                <span className="font-medium">{stats.byCategory.orders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Inventory:</span>
                <span className="font-medium">{stats.byCategory.inventory}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deliveries:</span>
                <span className="font-medium">{stats.byCategory.deliveries}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="orders">Orders</SelectItem>
                  <SelectItem value="inventory">Inventory</SelectItem>
                  <SelectItem value="deliveries">Deliveries</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Action Type</Label>
              <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="bulk_confirm_orders">Bulk Confirm Orders</SelectItem>
                  <SelectItem value="bulk_decline_orders">Bulk Decline Orders</SelectItem>
                  <SelectItem value="bulk_inventory_update">Bulk Inventory Update</SelectItem>
                  <SelectItem value="bulk_tracking_assign">Bulk Tracking Assign</SelectItem>
                  <SelectItem value="bulk_status_update">Bulk Status Update</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-4">
            <Label>Search</Label>
            <Input
              placeholder="Search by description, user, or item ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline ({filteredLogs.length} entries)</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No audit logs found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or search query
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => {
                const actionConfig = actionTypeConfig[log.actionType];
                const ActionIcon = actionConfig.icon;
                const categoryConfig2 = categoryConfig[log.category];
                const CategoryIcon = categoryConfig2.icon;

                return (
                  <Card key={log.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        <div className={`w-10 h-10 rounded-full ${actionConfig.color} flex items-center justify-center flex-shrink-0`}>
                          <ActionIcon className="w-5 h-5 text-white" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-lg">{log.actionDescription}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {log.userName} ({log.userRole})
                                </span>
                                <Badge className={categoryConfig2.color}>
                                  <CategoryIcon className="w-3 h-3 mr-1" />
                                  {categoryConfig2.label}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                {new Date(log.timestamp).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mt-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Action Type</p>
                                <p className="font-medium">{actionConfig.label}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Items Affected</p>
                                <p className="font-medium">{log.affectedItemsCount}</p>
                              </div>
                            </div>

                            {/* Details */}
                            {log.details && Object.keys(log.details).length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                                <p className="text-xs font-medium text-muted-foreground mb-2">Details:</p>
                                <div className="space-y-1 text-xs">
                                  {log.details.carrier && (
                                    <p><strong>Carrier:</strong> {log.details.carrier}</p>
                                  )}
                                  {log.details.trackingPrefix && (
                                    <p><strong>Tracking Prefix:</strong> {log.details.trackingPrefix}</p>
                                  )}
                                  {log.details.updateType && (
                                    <p><strong>Update Type:</strong> {log.details.updateType}</p>
                                  )}
                                  {log.details.value !== undefined && (
                                    <p><strong>Value:</strong> {log.details.value}{log.details.unit === 'percentage' ? '%' : ''}</p>
                                  )}
                                  {log.details.totalValue && (
                                    <p><strong>Total Value:</strong> ₱{log.details.totalValue.toLocaleString()}</p>
                                  )}
                                  {log.details.products && log.details.products.length > 0 && (
                                    <div className="mt-2">
                                      <p className="font-medium mb-1">Products Changed:</p>
                                      {log.details.products.slice(0, 3).map((prod: any, idx: number) => (
                                        <p key={idx} className="ml-2">
                                          • {prod.name}: {prod.before} → {prod.after}
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
