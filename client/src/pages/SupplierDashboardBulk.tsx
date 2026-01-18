import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getClientRole } from "@/const";
import {
  suppliers,
  supplierOrders,
  getSupplierOrders,
  getOrdersByStatus,
  calculateSupplierMetrics,
  SupplierOrder
} from "@/data/supplierData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Package,
  DollarSign,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  MessageSquare,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { addAuditLog } from "@/data/auditLogData";

export default function SupplierDashboardBulk() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  // For demo, use first supplier (Atlas Fertilizer)
  const supplier = suppliers[0];
  const metrics = calculateSupplierMetrics(supplier.id);
  const orders = getSupplierOrders(supplier.id);

  // Filter orders by tab
  const getFilteredOrders = (): SupplierOrder[] => {
    switch (selectedTab) {
      case 'pending':
        return getOrdersByStatus(supplier.id, 'pending');
      case 'confirmed':
        return getOrdersByStatus(supplier.id, 'confirmed');
      case 'preparing':
        return getOrdersByStatus(supplier.id, 'preparing');
      case 'shipped':
        return getOrdersByStatus(supplier.id, 'shipped');
      case 'delivered':
        return getOrdersByStatus(supplier.id, 'delivered');
      default:
        return orders;
    }
  };

  const filteredOrders = getFilteredOrders();

  // Selection handlers
  const toggleOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
    }
  };

  const clearSelection = () => setSelectedOrders(new Set());

  // Bulk actions
  const handleBulkConfirm = () => {
    const count = selectedOrders.size;
    const selectedOrdersList = Array.from(selectedOrders);
    
    // Add audit log - use getClientRole to map server role to client role, convert id to string
    const clientRole = getClientRole(user) || 'supplier';
    addAuditLog({
      userId: user?.id ? String(user.id) : 'supplier-001',
      userName: user?.name || 'Maria Santos',
      userRole: clientRole,
      actionType: 'bulk_confirm_orders',
      actionDescription: `Confirmed ${count} pending orders`,
      affectedItemsCount: count,
      affectedItems: selectedOrdersList,
      details: {},
      category: 'orders'
    });
    
    toast.success(`${count} orders confirmed!`, {
      description: "CARD MRI has been notified."
    });
    clearSelection();
  };

  const handleBulkDecline = () => {
    const count = selectedOrders.size;
    const selectedOrdersList = Array.from(selectedOrders);
    
    // Add audit log - use getClientRole to map server role to client role, convert id to string
    const clientRole = getClientRole(user) || 'supplier';
    addAuditLog({
      userId: user?.id ? String(user.id) : 'supplier-001',
      userName: user?.name || 'Maria Santos',
      userRole: clientRole,
      actionType: 'bulk_decline_orders',
      actionDescription: `Declined ${count} orders`,
      affectedItemsCount: count,
      affectedItems: selectedOrdersList,
      details: {},
      category: 'orders'
    });
    
    toast.error(`${count} orders declined`);
    clearSelection();
  };

  const handleBulkMarkPreparing = () => {
    const count = selectedOrders.size;
    const selectedOrdersList = Array.from(selectedOrders);
    
    // Add audit log - use getClientRole to map server role to client role, convert id to string
    const clientRole = getClientRole(user) || 'supplier';
    addAuditLog({
      userId: user?.id ? String(user.id) : 'supplier-001',
      userName: user?.name || 'Maria Santos',
      userRole: clientRole,
      actionType: 'bulk_mark_preparing',
      actionDescription: `Marked ${count} confirmed orders as preparing`,
      affectedItemsCount: count,
      affectedItems: selectedOrdersList,
      details: {},
      category: 'orders'
    });
    
    toast.success(`${count} orders marked as preparing`);
    clearSelection();
  };

  // Status configuration
  const statusConfig = {
    pending: { label: 'Pending', color: 'bg-yellow-500', icon: Clock },
    confirmed: { label: 'Confirmed', color: 'bg-blue-500', icon: CheckCircle2 },
    preparing: { label: 'Preparing', color: 'bg-purple-500', icon: Package },
    shipped: { label: 'Shipped', color: 'bg-orange-500', icon: Truck },
    delivered: { label: 'Delivered', color: 'bg-green-500', icon: CheckCircle2 },
    cancelled: { label: 'Cancelled', color: 'bg-red-500', icon: AlertCircle }
  };

  // Check if user is supplier using getClientRole to map server role to client role
  const clientRole = getClientRole(user);
  const isSupplier = clientRole === 'supplier';

  if (!isSupplier) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Supplier Access Only</h2>
            <p className="text-muted-foreground">
              This portal is only accessible to registered suppliers.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedPendingCount = Array.from(selectedOrders).filter(id => 
    filteredOrders.find(o => o.id === id && o.status === 'pending')
  ).length;

  const selectedConfirmedCount = Array.from(selectedOrders).filter(id => 
    filteredOrders.find(o => o.id === id && o.status === 'confirmed')
  ).length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{supplier.name}</h1>
          <p className="text-muted-foreground">
            Supplier Portal - Manage your orders with bulk actions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <MessageSquare className="w-4 h-4 mr-2" />
            Messages
          </Button>
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Reports
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.pendingOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting confirmation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="w-4 h-4" />
              Active Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.activeOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              In progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.completedOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ₱{(metrics.totalRevenue / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg: ₱{(metrics.avgOrderValue / 1000).toFixed(0)}K per order
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedOrders.size > 0 && (
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <span className="font-semibold">
                  {selectedOrders.size} selected
                </span>
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {selectedPendingCount > 0 && (
                  <>
                    <Button onClick={handleBulkConfirm} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Confirm ({selectedPendingCount})
                    </Button>
                    <Button variant="outline" onClick={handleBulkDecline}>
                      Decline ({selectedPendingCount})
                    </Button>
                  </>
                )}
                {selectedConfirmedCount > 0 && (
                  <Button onClick={handleBulkMarkPreparing}>
                    <Package className="w-4 h-4 mr-2" />
                    Mark Preparing ({selectedConfirmedCount})
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Orders</CardTitle>
            {filteredOrders.length > 0 && (
              <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                {selectedOrders.size === filteredOrders.length ? 'Deselect All' : 'Select All'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">All ({orders.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({getOrdersByStatus(supplier.id, 'pending').length})</TabsTrigger>
              <TabsTrigger value="confirmed">Confirmed ({getOrdersByStatus(supplier.id, 'confirmed').length})</TabsTrigger>
              <TabsTrigger value="preparing">Preparing ({getOrdersByStatus(supplier.id, 'preparing').length})</TabsTrigger>
              <TabsTrigger value="shipped">Shipped ({getOrdersByStatus(supplier.id, 'shipped').length})</TabsTrigger>
              <TabsTrigger value="delivered">Delivered ({getOrdersByStatus(supplier.id, 'delivered').length})</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="mt-6">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => {
                    const status = statusConfig[order.status];
                    const StatusIcon = status.icon;
                    const isSelected = selectedOrders.has(order.id);

                    return (
                      <Card 
                        key={order.id} 
                        className={`transition-all ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950' : ''}`}
                      >
                        <CardContent className="pt-6">
                          <div className="flex gap-4">
                            <div className="flex items-start pt-1">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleOrder(order.id)}
                              />
                            </div>
                            <div className="flex-1 space-y-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="font-mono text-sm text-muted-foreground">
                                      {order.orderNumber}
                                    </span>
                                    <Badge className={`${status.color} text-white`}>
                                      <StatusIcon className="w-3 h-3 mr-1" />
                                      {status.label}
                                    </Badge>
                                  </div>
                                  <h3 className="font-semibold text-lg">{order.productName}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {order.quantity} {order.unit} • {order.farmerCount} farmers
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-bold">₱{order.totalAmount.toLocaleString()}</p>
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <p><strong>Delivery:</strong> {order.deliveryAddress}</p>
                                <p><strong>Contact:</strong> {order.contactPerson} ({order.contactPhone})</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
