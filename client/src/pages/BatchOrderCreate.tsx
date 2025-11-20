import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface BatchOrderItem {
  tempId: string;
  farmId: number | null;
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

export default function BatchOrderCreate() {
  const [, navigate] = useLocation();
  const [supplierId, setSupplierId] = useState<string>("");
  const [inputType, setInputType] = useState<"fertilizer" | "seed" | "feed" | "pesticide" | "other">("fertilizer");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>("");
  const [deliveryWindowStart, setDeliveryWindowStart] = useState<string>("");
  const [deliveryWindowEnd, setDeliveryWindowEnd] = useState<string>("");
  const [items, setItems] = useState<BatchOrderItem[]>([]);
  const [farmSearchId, setFarmSearchId] = useState<string>("");

  const createMutation = trpc.batchOrder.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Batch order ${data.referenceCode} created successfully!`);
      navigate(`/batch-orders/${data.id}`);
    },
    onError: (error) => {
      toast.error(`Failed to create batch order: ${error.message}`);
    },
  });

  const { data: farmsData } = trpc.farms.list.useQuery({});
  const farms = farmsData || [];

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

    const newItem: BatchOrderItem = {
      tempId: crypto.randomUUID(),
      farmId: farm.id,
      farmName: farm.name,
      farmerId: farm.userId,
      quantityOrdered: 0,
      unit: "kg",
      supplierUnitPrice: 0,
      farmerUnitPrice: 0,
    };

    setItems([...items, newItem]);
    setFarmSearchId("");
  };

  const removeItem = (tempId: string) => {
    setItems(items.filter((item) => item.tempId !== tempId));
  };

  const updateItem = (tempId: string, field: keyof BatchOrderItem, value: any) => {
    setItems(
      items.map((item) =>
        item.tempId === tempId ? { ...item, [field]: value } : item
      )
    );
  };

  const calculateLineTotals = (item: BatchOrderItem) => {
    const marginPerUnit = item.farmerUnitPrice - item.supplierUnitPrice;
    const lineSupplierTotal = item.quantityOrdered * item.supplierUnitPrice;
    const lineFarmerTotal = item.quantityOrdered * item.farmerUnitPrice;
    const lineAgsenseRevenue = item.quantityOrdered * marginPerUnit;

    return {
      marginPerUnit,
      lineSupplierTotal,
      lineFarmerTotal,
      lineAgsenseRevenue,
    };
  };

  const calculateTotals = () => {
    let totalQuantity = 0;
    let totalSupplierTotal = 0;
    let totalFarmerTotal = 0;
    let totalAgsenseRevenue = 0;

    items.forEach((item) => {
      const { lineSupplierTotal, lineFarmerTotal, lineAgsenseRevenue } =
        calculateLineTotals(item);
      totalQuantity += item.quantityOrdered;
      totalSupplierTotal += lineSupplierTotal;
      totalFarmerTotal += lineFarmerTotal;
      totalAgsenseRevenue += lineAgsenseRevenue;
    });

    return {
      totalQuantity,
      totalSupplierTotal,
      totalFarmerTotal,
      totalAgsenseRevenue,
    };
  };

  const handleSubmit = (status: "draft" | "pending_approval") => {
    if (!expectedDeliveryDate) {
      toast.error("Expected delivery date is required");
      return;
    }

    if (items.length === 0) {
      toast.error("At least one item is required");
      return;
    }

    // Validate items
    for (const item of items) {
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
      supplierId: supplierId || null,
      inputType,
      expectedDeliveryDate,
      deliveryWindowStart: deliveryWindowStart || null,
      deliveryWindowEnd: deliveryWindowEnd || null,
      currency: "PHP" as const,
      pricingMode: "margin" as const,
      items: items.map((item) => ({
        farmId: item.farmId!,
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

    createMutation.mutate(payload);

    // If pending approval, we'd need to update status after creation
    // For now, create always creates as draft
    if (status === "pending_approval") {
      // This would require a follow-up mutation after creation
      toast.info("Note: Submit for approval will be available after creation");
    }
  };

  const totals = calculateTotals();

  const formatCurrency = (value: number) => {
    return `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/batch-orders")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Batch Order</h1>
          <p className="text-muted-foreground">
            Create a new agricultural input batch order
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Information */}
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Supplier ID (Optional)</Label>
                  <Input
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    placeholder="Enter supplier ID"
                  />
                </div>
                <div>
                  <Label>Input Type</Label>
                  <Select value={inputType} onValueChange={(v: any) => setInputType(v)}>
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
                </div>
              </div>

              <div>
                <Label>Expected Delivery Date *</Label>
                <Input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Delivery Window Start (Optional)</Label>
                  <Input
                    type="datetime-local"
                    value={deliveryWindowStart}
                    onChange={(e) => setDeliveryWindowStart(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Delivery Window End (Optional)</Label>
                  <Input
                    type="datetime-local"
                    value={deliveryWindowEnd}
                    onChange={(e) => setDeliveryWindowEnd(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Currency:</strong> PHP
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Pricing Mode:</strong> Margin Model
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

              {/* Items List */}
              {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No items added yet. Select a farm and click "Add Farm" to begin.
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => {
                    const lineTotals = calculateLineTotals(item);
                    return (
                      <Card key={item.tempId} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{item.farmName}</h4>
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
                              <Label className="text-xs">Quantity *</Label>
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
                              <Label className="text-xs">Unit *</Label>
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
                              <Label className="text-xs">Supplier Price *</Label>
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
                              <Label className="text-xs">Farmer Price *</Label>
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
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Panel */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Number of Farms</Label>
                <p className="text-2xl font-bold">{items.length}</p>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Total Quantity</Label>
                <p className="text-2xl font-bold">
                  {totals.totalQuantity.toLocaleString()}
                </p>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">
                  Total Supplier Cost
                </Label>
                <p className="text-lg font-semibold">
                  {formatCurrency(totals.totalSupplierTotal)}
                </p>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">
                  Total Billed to Farmers
                </Label>
                <p className="text-lg font-semibold">
                  {formatCurrency(totals.totalFarmerTotal)}
                </p>
              </div>

              <div className="pt-4 border-t">
                <Label className="text-sm text-muted-foreground">
                  Estimated AgSense Revenue
                </Label>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totals.totalAgsenseRevenue)}
                </p>
              </div>

              <div className="pt-4 space-y-2">
                <Button
                  className="w-full"
                  onClick={() => handleSubmit("draft")}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Save as Draft
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => navigate("/batch-orders")}
                  disabled={createMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
