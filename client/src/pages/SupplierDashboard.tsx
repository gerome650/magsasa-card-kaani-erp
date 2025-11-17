import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
import {
  Package,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  MessageSquare,
  FileText
} from "lucide-react";
import { toast } from "sonner";

export default function SupplierDashboard() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<string>("all");

  // For demo, use first supplier (Atlas Fertilizer)
  // In production, this would be based on logged-in supplier user
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

  // Status badge configuration
  const statusConfig = {
    pending: { label: 'Pending', color: 'bg-yellow-500', icon: Clock },
    confirmed: { label: 'Confirmed', color: 'bg-blue-500', icon: CheckCircle2 },
    preparing: { label: 'Preparing', color: 'bg-purple-500', icon: Package },
    shipped: { label: 'Shipped', color: 'bg-orange-500', icon: Truck },
    delivered: { label: 'Delivered', color: 'bg-green-500', icon: CheckCircle2 },
    cancelled: { label: 'Cancelled', color: 'bg-red-500', icon: AlertCircle }
  };

  // Handlers
  const handleConfirmOrder = (orderId: string) => {
    toast.success("Order confirmed!", {
      description: "CARD MRI has been notified of your confirmation."
    });
  };

  const handleDeclineOrder = (orderId: string) => {
    toast.error("Order declined", {
      description: "Please provide a reason in the communication log."
    });
  };

  const handleViewDetails = (orderId: string) => {
    toast.info(`Opening order details for ${orderId}`);
  };

  const handleUpdateShipment = (orderId: string) => {
    toast.info(`Opening shipment update for ${orderId}`);
  };

  // Check if user is supplier
  const isSupplier = user?.role === 'supplier';

  if (!isSupplier) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Supplier Access Only</h2>
            <p className="text-muted-foreground mb-6">
              This portal is only accessible to registered suppliers.
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
          <h1 className="text-3xl font-bold">{supplier.name}</h1>
          <p className="text-muted-foreground">
            Supplier Portal - Manage your orders and inventory
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

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">
                All ({orders.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({getOrdersByStatus(supplier.id, 'pending').length})
              </TabsTrigger>
              <TabsTrigger value="confirmed">
                Confirmed ({getOrdersByStatus(supplier.id, 'confirmed').length})
              </TabsTrigger>
              <TabsTrigger value="preparing">
                Preparing ({getOrdersByStatus(supplier.id, 'preparing').length})
              </TabsTrigger>
              <TabsTrigger value="shipped">
                Shipped ({getOrdersByStatus(supplier.id, 'shipped').length})
              </TabsTrigger>
              <TabsTrigger value="delivered">
                Delivered ({getOrdersByStatus(supplier.id, 'delivered').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="mt-6">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                  <p className="text-muted-foreground">
                    {selectedTab === 'all'
                      ? 'You have no orders yet'
                      : `No orders with status "${selectedTab}"`
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => {
                    const status = statusConfig[order.status];
                    const StatusIcon = status.icon;

                    return (
                      <Card key={order.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-mono text-sm text-muted-foreground">
                                  {order.orderNumber}
                                </span>
                                <Badge className={`${status.color} text-white`}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {status.label}
                                </Badge>
                              </div>
                              <h3 className="font-semibold text-lg mb-1">
                                {order.productName}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Ordered: {new Date(order.orderedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold">
                                ₱{order.totalAmount.toLocaleString()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {order.quantity} {order.unit}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Delivery Address</p>
                              <p className="font-medium">{order.deliveryAddress}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Contact Person</p>
                              <p className="font-medium">{order.contactPerson}</p>
                              <p className="text-xs text-muted-foreground">{order.contactPhone}</p>
                            </div>
                          </div>

                          {order.notes && (
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mb-4 text-sm">
                              <p className="text-muted-foreground">{order.notes}</p>
                            </div>
                          )}

                          <div className="flex gap-2">
                            {order.status === 'pending' && (
                              <>
                                <Button
                                  className="flex-1 bg-green-600 hover:bg-green-700"
                                  onClick={() => handleConfirmOrder(order.id)}
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Confirm Order
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => handleDeclineOrder(order.id)}
                                >
                                  Decline
                                </Button>
                              </>
                            )}
                            {(order.status === 'confirmed' || order.status === 'preparing') && (
                              <Button
                                className="flex-1"
                                onClick={() => handleUpdateShipment(order.id)}
                              >
                                <Truck className="w-4 h-4 mr-2" />
                                Update Shipment
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              onClick={() => handleViewDetails(order.id)}
                            >
                              View Details
                            </Button>
                            <Button variant="outline">
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Message
                            </Button>
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fulfillment Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics.completedOrders > 0
                ? Math.round((metrics.completedOrders / orders.length) * 100)
                : 0}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Orders delivered on time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.3 hours</div>
            <p className="text-sm text-muted-foreground mt-1">
              Order confirmation time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {supplier.rating}
              <span className="text-yellow-500">★</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Based on {supplier.totalOrders} orders
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
