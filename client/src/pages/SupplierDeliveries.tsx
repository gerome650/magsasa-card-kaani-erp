import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  suppliers,
  supplierOrders,
  supplierShipments,
  getSupplierOrders,
  getSupplierShipment,
  SupplierOrder,
  SupplierShipment
} from "@/data/supplierData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit,
  Navigation
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import BulkTrackingAssignment from "@/components/BulkTrackingAssignment";

export default function SupplierDeliveries() {
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<SupplierOrder | null>(null);
  const [shipmentDialogOpen, setShipmentDialogOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  
  // Bulk selection state
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkTrackingPrefix, setBulkTrackingPrefix] = useState("");
  const [bulkCarrier, setBulkCarrier] = useState("");
  const [bulkStatus, setBulkStatus] = useState("");

  // For demo, use first supplier (Atlas Fertilizer)
  const supplier = suppliers[0];
  const orders = getSupplierOrders(supplier.id);

  // Filter orders that need delivery tracking
  const ordersNeedingShipment = orders.filter(o =>
    o.status === 'confirmed' || o.status === 'preparing' || o.status === 'shipped'
  );

  // Shipment status configuration
  const shipmentStatusConfig = {
    preparing: { label: 'Preparing', color: 'bg-blue-500', icon: Package },
    'picked-up': { label: 'Picked Up', color: 'bg-purple-500', icon: Truck },
    'in-transit': { label: 'In Transit', color: 'bg-orange-500', icon: Truck },
    'out-for-delivery': { label: 'Out for Delivery', color: 'bg-yellow-500', icon: Truck },
    delivered: { label: 'Delivered', color: 'bg-green-500', icon: CheckCircle2 }
  };

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
    if (selectedOrders.size === ordersNeedingShipment.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(ordersNeedingShipment.map(o => o.id)));
    }
  };

  const clearSelection = () => setSelectedOrders(new Set());

  // Bulk action handlers
  const handleBulkAssignTracking = () => {
    if (!bulkTrackingPrefix || !bulkCarrier) {
      toast.error("Please enter tracking prefix and carrier");
      return;
    }

    const count = selectedOrders.size;
    const selectedOrdersList = Array.from(selectedOrders);
    
    // Add audit log
    addAuditLog({
      userId: 'supplier-001',
      userName: 'Maria Santos',
      userRole: 'supplier',
      actionType: 'bulk_tracking_assign',
      actionDescription: `Assigned tracking numbers to ${count} shipments`,
      affectedItemsCount: count,
      affectedItems: selectedOrdersList,
      details: {
        carrier: bulkCarrier,
        trackingPrefix: bulkTrackingPrefix
      },
      category: 'deliveries'
    });
    
    toast.success(`Tracking numbers assigned to ${count} shipments!`, {
      description: `Prefix: ${bulkTrackingPrefix}, Carrier: ${bulkCarrier}`
    });
    
    setBulkDialogOpen(false);
    clearSelection();
    setBulkTrackingPrefix("");
    setBulkCarrier("");
  };

  const handleBulkUpdateStatus = (status: string) => {
    const count = selectedOrders.size;
    const selectedOrdersList = Array.from(selectedOrders);
    const statusLabel = shipmentStatusConfig[status as keyof typeof shipmentStatusConfig]?.label || status;
    
    // Add audit log
    addAuditLog({
      userId: 'supplier-001',
      userName: 'Maria Santos',
      userRole: 'supplier',
      actionType: 'bulk_status_update',
      actionDescription: `Marked ${count} shipments as ${statusLabel}`,
      affectedItemsCount: count,
      affectedItems: selectedOrdersList,
      details: {
        newStatus: status
      },
      category: 'deliveries'
    });
    
    toast.success(`${count} shipments updated!`, {
      description: `Status changed to: ${statusLabel}`
    });
    
    clearSelection();
  };

  // Single order handlers
  const handleCreateShipment = (order: SupplierOrder) => {
    setSelectedOrder(order);
    setTrackingNumber("");
    setCarrier("");
    setEstimatedDelivery("");
    setShipmentDialogOpen(true);
  };

  const handleSaveShipment = () => {
    if (!selectedOrder || !trackingNumber || !carrier || !estimatedDelivery) {
      toast.error("Please fill in all required fields");
      return;
    }

    toast.success("Shipment created!", {
      description: `Tracking number ${trackingNumber} has been sent to CARD MRI`
    });
    setShipmentDialogOpen(false);
    setSelectedOrder(null);
  };

  const handleUpdateShipment = (orderId: string) => {
    toast.info("Opening shipment update form");
  };

  // Check if user is supplier
  const isSupplier = user?.role === 'supplier';

  if (!isSupplier) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Truck className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
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
          <h1 className="text-3xl font-bold">Delivery Tracking</h1>
          <p className="text-muted-foreground">
            Manage shipments and provide delivery updates
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="w-4 h-4" />
              Preparing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {orders.filter(o => o.status === 'preparing').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Being prepared
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Truck className="w-4 h-4" />
              In Transit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {orders.filter(o => o.status === 'shipped').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              On the way
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Delivered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {orders.filter(o => o.status === 'delivered').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              On-Time Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">95%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Delivery performance
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
                  {selectedOrders.size} shipments selected
                </span>
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button onClick={() => setBulkDialogOpen(true)}>
                  <Navigation className="w-4 h-4 mr-2" />
                  Assign Tracking Numbers
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleBulkUpdateStatus('picked-up')}
                >
                  Mark as Picked Up
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleBulkUpdateStatus('in-transit')}
                >
                  Mark as In Transit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Active Deliveries</h2>
          {ordersNeedingShipment.length > 0 && (
            <Button variant="outline" size="sm" onClick={toggleSelectAll}>
              {selectedOrders.size === ordersNeedingShipment.length ? 'Deselect All' : 'Select All'}
            </Button>
          )}
        </div>

        {ordersNeedingShipment.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Truck className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No active deliveries</h3>
              <p className="text-muted-foreground">
                All orders have been delivered or are pending confirmation
              </p>
            </CardContent>
          </Card>
        ) : (
          ordersNeedingShipment.map((order) => {
            const shipment = getSupplierShipment(order.id);
            const isSelected = selectedOrders.has(order.id);

            return (
              <Card key={order.id} className={`hover:shadow-lg transition-all ${
                isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950' : ''
              }`}>
                <CardContent className="pt-6">
                  <div className="flex gap-4 mb-4">
                    <div className="flex items-start pt-1">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleOrder(order.id)}
                      />
                    </div>
                    <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-sm text-muted-foreground">
                          {order.orderNumber}
                        </span>
                        <Badge className={
                          order.status === 'confirmed' ? 'bg-blue-500' :
                          order.status === 'preparing' ? 'bg-purple-500' :
                          order.status === 'shipped' ? 'bg-orange-500' :
                          'bg-gray-500'
                        } className="text-white">
                          {order.status === 'confirmed' ? 'Confirmed' :
                           order.status === 'preparing' ? 'Preparing' :
                           order.status === 'shipped' ? 'Shipped' :
                           order.status}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg mb-1">
                        {order.productName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {order.quantity} {order.unit} • ₱{order.totalAmount.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        ₱{order.totalAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Delivery Address</p>
                          <p className="text-muted-foreground">{order.deliveryAddress}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <Package className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Contact Person</p>
                          <p className="text-muted-foreground">
                            {order.contactPerson} • {order.contactPhone}
                          </p>
                        </div>
                      </div>
                    </div>

                    {shipment && (
                      <div className="space-y-2">
                        <div className="flex items-start gap-2 text-sm">
                          <Truck className="w-4 h-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Tracking Number</p>
                            <p className="text-muted-foreground font-mono">
                              {shipment.trackingNumber}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <Clock className="w-4 h-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Estimated Delivery</p>
                            <p className="text-muted-foreground">
                              {new Date(shipment.estimatedDelivery).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Shipment Timeline */}
                  {shipment && shipment.updates.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-3">Shipment Updates</p>
                      <div className="space-y-3">
                        {shipment.updates.map((update, index) => {
                          const status = shipmentStatusConfig[update.status as keyof typeof shipmentStatusConfig];
                          const StatusIcon = status?.icon || Package;

                          return (
                            <div
                              key={index}
                              className="flex items-start gap-3 border-l-2 border-green-600 pl-3 py-1"
                            >
                              <StatusIcon className="w-4 h-4 mt-1 text-green-600" />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium text-sm">{update.description}</p>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(update.timestamp).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {update.location}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {!shipment && order.status === 'confirmed' && (
                      <Button
                        className="flex-1"
                        onClick={() => handleCreateShipment(order)}
                      >
                        <Truck className="w-4 h-4 mr-2" />
                        Create Shipment
                      </Button>
                    )}
                    {shipment && (
                      <Button
                        className="flex-1"
                        onClick={() => handleUpdateShipment(order.id)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Update Status
                      </Button>
                    )}
                    <Button variant="outline">
                      View Details
                    </Button>
                  </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Create Shipment Dialog */}
      <Dialog open={shipmentDialogOpen} onOpenChange={setShipmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Shipment</DialogTitle>
            <DialogDescription>
              Provide tracking information for order {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Order Details</p>
              <p className="font-medium">{selectedOrder?.productName}</p>
              <p className="text-sm text-muted-foreground">
                {selectedOrder?.quantity} {selectedOrder?.unit} • ₱{selectedOrder?.totalAmount.toLocaleString()}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tracking-number">Tracking Number *</Label>
              <Input
                id="tracking-number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g., LBC123456789"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="carrier">Carrier/Courier *</Label>
              <Input
                id="carrier"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                placeholder="e.g., LBC Express, Own Delivery"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated-delivery">Estimated Delivery Date *</Label>
              <Input
                id="estimated-delivery"
                type="date"
                value={estimatedDelivery}
                onChange={(e) => setEstimatedDelivery(e.target.value)}
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 text-sm">
              <p className="text-blue-700 dark:text-blue-400">
                <strong>Delivery Address:</strong><br />
                {selectedOrder?.deliveryAddress}<br />
                Contact: {selectedOrder?.contactPerson} ({selectedOrder?.contactPhone})
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShipmentDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveShipment}
              >
                Create Shipment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Tracking Assignment Dialog */}
      <BulkTrackingAssignment
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        selectedCount={selectedOrders.size}
        onAssign={handleBulkAssignTracking}
      />
    </div>
  );
}
