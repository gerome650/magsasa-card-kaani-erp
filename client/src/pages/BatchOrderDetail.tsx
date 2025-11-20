import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Loader2, Edit, Save, X, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const statusColors = {
  draft: "bg-gray-500",
  pending_approval: "bg-yellow-500",
  approved: "bg-green-500",
  cancelled: "bg-red-500",
  completed: "bg-blue-500",
};

const statusLabels = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  approved: "Approved",
  cancelled: "Cancelled",
  completed: "Completed",
};

interface EditableItem {
  id?: string;
  tempId: string;
  farmId: number;
  farmName?: string;
  farmerId?: number | null;
  productId?: string | null;
  inputType?: "fertilizer" | "seed" | "feed" | "pesticide" | "other";
  quantityOrdered: number;
  unit: string;
  supplierUnitPrice: number;
  farmerUnitPrice: number;
  notes?: string;
}

export default function BatchOrderDetail() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/batch-orders/:id");
  const orderId = params?.id || "";

  const [isEditing, setIsEditing] = useState(false);
  const [editedItems, setEditedItems] = useState<EditableItem[]>([]);
  const [editedDeliveryDate, setEditedDeliveryDate] = useState("");
  const [editedInputType, setEditedInputType] = useState<"fertilizer" | "seed" | "feed" | "pesticide" | "other">("fertilizer");
  const [farmSearchId, setFarmSearchId] = useState<string>("");

  const { data: order, isLoading, refetch } = trpc.batchOrder.getById.useQuery(
    { id: orderId },
    { enabled: !!orderId }
  );

  const { data: farmsData } = trpc.farms.list.useQuery({});
  const farms = farmsData || [];

  const updateMutation = trpc.batchOrder.update.useMutation({
    onSuccess: () => {
      toast.success("Batch order updated successfully!");
      setIsEditing(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update batch order: ${error.message}`);
    },
  });

  useEffect(() => {
    if (order && isEditing) {
      setEditedItems(
        order.items.map((item: any) => ({
          id: item.id,
          tempId: item.id,
          farmId: item.farmId,
          farmerId: item.farmerId,
          productId: item.productId,
          inputType: item.inputType,
          quantityOrdered: parseFloat(item.quantityOrdered),
          unit: item.unit,
          supplierUnitPrice: parseFloat(item.supplierUnitPrice),
          farmerUnitPrice: parseFloat(item.farmerUnitPrice),
          notes: item.notes,
        }))
      );
      setEditedDeliveryDate(order.expectedDeliveryDate);
      setEditedInputType(order.inputType || "fertilizer");
    }
  }, [order, isEditing]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Batch order not found</p>
            <Button className="mt-4" onClick={() => navigate("/batch-orders")}>
              Back to Batch Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canEdit = order.status === "draft" || order.status === "pending_approval";

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return `₱${num.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedItems([]);
  };

  const addFarmRow = () => {
    if (!farmSearchId) {
      toast.error("Please select a farm first");
      return;
    }

    const farmId = parseInt(farmSearchId);
    const farm = farms.find((f) => f.id === farmId);

    if (!farm) {
      toast.error("Farm not found");
      return;
    }

    const newItem: EditableItem = {
      tempId: crypto.randomUUID(),
      farmId: farm.id,
      farmName: farm.name,
      farmerId: farm.userId,
      quantityOrdered: 0,
      unit: "kg",
      supplierUnitPrice: 0,
      farmerUnitPrice: 0,
    };

    setEditedItems([...editedItems, newItem]);
    setFarmSearchId("");
  };

  const removeItem = (tempId: string) => {
    setEditedItems(editedItems.filter((item) => item.tempId !== tempId));
  };

  const updateItem = (tempId: string, field: keyof EditableItem, value: any) => {
    setEditedItems(
      editedItems.map((item) =>
        item.tempId === tempId ? { ...item, [field]: value } : item
      )
    );
  };

  const calculateLineTotals = (item: EditableItem | any) => {
    const qty = typeof item.quantityOrdered === "string" ? parseFloat(item.quantityOrdered) : item.quantityOrdered;
    const supplierPrice = typeof item.supplierUnitPrice === "string" ? parseFloat(item.supplierUnitPrice) : item.supplierUnitPrice;
    const farmerPrice = typeof item.farmerUnitPrice === "string" ? parseFloat(item.farmerUnitPrice) : item.farmerUnitPrice;

    const marginPerUnit = farmerPrice - supplierPrice;
    const lineSupplierTotal = qty * supplierPrice;
    const lineFarmerTotal = qty * farmerPrice;
    const lineAgsenseRevenue = qty * marginPerUnit;

    return {
      marginPerUnit,
      lineSupplierTotal,
      lineFarmerTotal,
      lineAgsenseRevenue,
    };
  };

  const handleSaveChanges = () => {
    if (editedItems.length === 0) {
      toast.error("At least one item is required");
      return;
    }

    // Validate items
    for (const item of editedItems) {
      if (!item.farmId) {
        toast.error("All items must have a farm selected");
        return;
      }
      if (item.quantityOrdered <= 0) {
        toast.error("Quantity must be greater than 0");
        return;
      }
      if (!item.unit) {
        toast.error("Unit is required for all items");
        return;
      }
      if (item.supplierUnitPrice < 0 || item.farmerUnitPrice < 0) {
        toast.error("Prices cannot be negative");
        return;
      }
    }

    const payload = {
      id: orderId,
      expectedDeliveryDate: editedDeliveryDate,
      inputType: editedInputType,
      items: editedItems.map((item) => ({
        id: item.id,
        farmId: item.farmId,
        farmerId: item.farmerId || null,
        productId: item.productId || null,
        inputType: item.inputType,
        quantityOrdered: item.quantityOrdered,
        unit: item.unit,
        supplierUnitPrice: item.supplierUnitPrice,
        farmerUnitPrice: item.farmerUnitPrice,
        notes: item.notes || null,
      })),
    };

    updateMutation.mutate(payload);
  };

  const handleSubmitForApproval = () => {
    const payload = {
      id: orderId,
      status: "pending_approval" as const,
      items: order.items.map((item: any) => ({
        id: item.id,
        farmId: item.farmId,
        farmerId: item.farmerId || null,
        productId: item.productId || null,
        inputType: item.inputType,
        quantityOrdered: parseFloat(item.quantityOrdered),
        unit: item.unit,
        supplierUnitPrice: parseFloat(item.supplierUnitPrice),
        farmerUnitPrice: parseFloat(item.farmerUnitPrice),
        notes: item.notes || null,
      })),
    };

    updateMutation.mutate(payload);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/batch-orders")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{order.referenceCode}</h1>
            <p className="text-muted-foreground">Batch Order Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusColors[order.status]}>
            {statusLabels[order.status]}
          </Badge>
          {canEdit && !isEditing && (
            <Button onClick={handleEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          {isEditing && (
            <>
              <Button onClick={handleSaveChanges} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
              <Button variant="outline" onClick={handleCancelEdit}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </>
          )}
          {!isEditing && order.status === "draft" && (
            <Button variant="default" onClick={handleSubmitForApproval}>
              Submit for Approval
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Reference Code</Label>
                  <p className="font-semibold">{order.referenceCode}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <p className="font-semibold capitalize">{statusLabels[order.status]}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Input Type</Label>
                  {isEditing ? (
                    <Select value={editedInputType} onValueChange={(v: any) => setEditedInputType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fertilizer">Fertilizer</SelectItem>
                        <SelectItem value="seed">Seed</SelectItem>
                        <SelectItem value="feed">Feed</SelectItem>
                        <SelectItem value="pesticide">Pesticide</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-semibold capitalize">{order.inputType || "—"}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Expected Delivery</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editedDeliveryDate}
                      onChange={(e) => setEditedDeliveryDate(e.target.value)}
                    />
                  ) : (
                    <p className="font-semibold">{formatDate(order.expectedDeliveryDate)}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Currency</Label>
                  <p className="font-semibold">{order.currency}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Pricing Mode</Label>
                  <p className="font-semibold capitalize">{order.pricingMode}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Created At</Label>
                  <p className="font-semibold">{formatDate(order.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Updated At</Label>
                  <p className="font-semibold">{formatDate(order.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  {/* Add Farm Row */}
                  <div className="flex gap-2">
                    <Select value={farmSearchId} onValueChange={setFarmSearchId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a farm to add" />
                      </SelectTrigger>
                      <SelectContent>
                        {farms.map((farm) => (
                          <SelectItem key={farm.id} value={farm.id.toString()}>
                            {farm.name} - {farm.farmerName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={addFarmRow}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Farm
                    </Button>
                  </div>

                  {/* Editable Items */}
                  {editedItems.map((item) => {
                    const lineTotals = calculateLineTotals(item);
                    return (
                      <Card key={item.tempId} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">
                              {item.farmName || `Farm ID: ${item.farmId}`}
                            </h4>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.tempId)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <Label className="text-xs">Quantity</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.quantityOrdered || ""}
                                onChange={(e) =>
                                  updateItem(
                                    item.tempId,
                                    "quantityOrdered",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Unit</Label>
                              <Select
                                value={item.unit}
                                onValueChange={(v) => updateItem(item.tempId, "unit", v)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="kg">kg</SelectItem>
                                  <SelectItem value="bag">bag</SelectItem>
                                  <SelectItem value="sack">sack</SelectItem>
                                  <SelectItem value="liter">liter</SelectItem>
                                  <SelectItem value="piece">piece</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Supplier Price</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.supplierUnitPrice || ""}
                                onChange={(e) =>
                                  updateItem(
                                    item.tempId,
                                    "supplierUnitPrice",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Farmer Price</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.farmerUnitPrice || ""}
                                onChange={(e) =>
                                  updateItem(
                                    item.tempId,
                                    "farmerUnitPrice",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t">
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                Margin/Unit
                              </Label>
                              <p className="text-sm font-medium">
                                {formatCurrency(lineTotals.marginPerUnit)}
                              </p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                Supplier Total
                              </Label>
                              <p className="text-sm font-medium">
                                {formatCurrency(lineTotals.lineSupplierTotal)}
                              </p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                Farmer Total
                              </Label>
                              <p className="text-sm font-medium">
                                {formatCurrency(lineTotals.lineFarmerTotal)}
                              </p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                AgSense Revenue
                              </Label>
                              <p className="text-sm font-medium text-green-600">
                                {formatCurrency(lineTotals.lineAgsenseRevenue)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Farm ID</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Supplier Price</TableHead>
                      <TableHead className="text-right">Farmer Price</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item: any) => {
                      const lineTotals = calculateLineTotals(item);
                      return (
                        <TableRow key={item.id}>
                          <TableCell>{item.farmId}</TableCell>
                          <TableCell>
                            {parseFloat(item.quantityOrdered).toLocaleString()}
                          </TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.supplierUnitPrice)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.farmerUnitPrice)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(lineTotals.marginPerUnit)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            {formatCurrency(lineTotals.lineAgsenseRevenue)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Total Quantity</Label>
                <p className="text-2xl font-bold">
                  {parseFloat(order.totalQuantity).toLocaleString()}
                </p>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">
                  Total Supplier Cost
                </Label>
                <p className="text-lg font-semibold">
                  {formatCurrency(order.totalSupplierTotal)}
                </p>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">
                  Total Billed to Farmers
                </Label>
                <p className="text-lg font-semibold">
                  {formatCurrency(order.totalFarmerTotal)}
                </p>
              </div>

              <div className="pt-4 border-t">
                <Label className="text-sm text-muted-foreground">
                  Total AgSense Revenue
                </Label>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(order.totalAgsenseRevenue)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
