import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getAvailableCrops, getMarketPrice, calculateHarvestValue } from "@/data/marketPrices";
import { TrendingUp, TrendingDown, Minus, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface AddHarvestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (harvest: any) => void;
  farmerId: string;
  farmerName: string;
}

export default function AddHarvestDialog({ open, onOpenChange, onAdd, farmerId, farmerName }: AddHarvestDialogProps) {
  const [selectedCrop, setSelectedCrop] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [landArea, setLandArea] = useState<string>("");
  const [qualityGrade, setQualityGrade] = useState<string>("Grade A");
  const [harvestDate, setHarvestDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>("");
  
  const availableCrops = getAvailableCrops();
  const marketPrice = selectedCrop ? getMarketPrice(selectedCrop) : null;
  const quantityNum = parseFloat(quantity) || 0;
  const landAreaNum = parseFloat(landArea) || 0;
  const totalValue = selectedCrop && quantityNum > 0 ? calculateHarvestValue(selectedCrop, quantityNum) : 0;
  const yieldPerHectare = landAreaNum > 0 && quantityNum > 0 ? quantityNum / landAreaNum : 0;

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedCrop("");
      setQuantity("");
      setLandArea("");
      setQualityGrade("Grade A");
      setHarvestDate(new Date().toISOString().split('T')[0]);
      setNotes("");
    }
  }, [open]);

  const handleSubmit = () => {
    // Validation
    if (!selectedCrop) {
      toast.error("Please select a crop type");
      return;
    }
    if (!quantity || quantityNum <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }
    if (!landArea || landAreaNum <= 0) {
      toast.error("Please enter a valid land area");
      return;
    }
    if (!harvestDate) {
      toast.error("Please select a harvest date");
      return;
    }

    // Create new harvest record
    const newHarvest = {
      id: `H${Date.now()}`,
      farmerId,
      farmerName,
      farmId: `FARM-${farmerId}`,
      farmLocation: "Farm Location", // This could be enhanced with actual farm data
      crop: selectedCrop,
      harvestDate,
      quantity: quantityNum,
      unit: 'kg' as const,
      qualityGrade,
      pricePerUnit: marketPrice?.pricePerKg || 0,
      totalValue,
      landAreaHarvested: landAreaNum,
      yieldPerHectare,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onAdd(newHarvest);
    toast.success(`Harvest record added successfully! Total value: ₱${totalValue.toLocaleString()}`);
    onOpenChange(false);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📝 Record New Harvest</DialogTitle>
          <DialogDescription>
            Add your latest harvest data with automatic market price calculation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Crop Selection */}
          <div className="space-y-2">
            <Label htmlFor="crop">Crop Type *</Label>
            <Select value={selectedCrop} onValueChange={setSelectedCrop}>
              <SelectTrigger id="crop">
                <SelectValue placeholder="Select crop type" />
              </SelectTrigger>
              <SelectContent>
                {availableCrops.map((crop) => (
                  <SelectItem key={crop} value={crop}>
                    {crop}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Market Price Display */}
          {marketPrice && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-900">Current Market Price</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-2xl font-bold text-emerald-700">
                      ₱{marketPrice.pricePerKg.toFixed(2)}
                    </p>
                    <span className="text-sm text-muted-foreground">per kg</span>
                    {getTrendIcon(marketPrice.trend)}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Last updated</p>
                  <p className="text-sm font-medium">{new Date(marketPrice.lastUpdated).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Harvest Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity (kg) *</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="e.g., 1000"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="landArea">Land Area (hectares) *</Label>
              <Input
                id="landArea"
                type="number"
                placeholder="e.g., 2.5"
                value={landArea}
                onChange={(e) => setLandArea(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Calculated Values */}
          {quantityNum > 0 && landAreaNum > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-blue-900">Yield per Hectare</p>
                  <p className="text-xl font-bold text-blue-700">{yieldPerHectare.toFixed(2)} kg/ha</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900">Estimated Total Value</p>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-5 w-5 text-blue-700" />
                    <p className="text-xl font-bold text-blue-700">₱{totalValue.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quality">Quality Grade *</Label>
              <Select value={qualityGrade} onValueChange={setQualityGrade}>
                <SelectTrigger id="quality">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Premium">Premium</SelectItem>
                  <SelectItem value="Grade A">Grade A</SelectItem>
                  <SelectItem value="Grade B">Grade B</SelectItem>
                  <SelectItem value="Grade C">Grade C</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="harvestDate">Harvest Date *</Label>
              <Input
                id="harvestDate"
                type="date"
                value={harvestDate}
                onChange={(e) => setHarvestDate(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes about this harvest..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-[#00C805] hover:bg-emerald-600">
            Add Harvest Record
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
