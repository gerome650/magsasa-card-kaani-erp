import { useState } from "react";
import { SupplierProduct } from "@/data/supplierData";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { addAuditLog } from "@/data/auditLogData";

interface BulkInventoryUpdateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProducts: SupplierProduct[];
  onUpdate: () => void;
  onAuditLog?: (updateType: string, value: number, unit: string) => void;
}

export default function BulkInventoryUpdate({
  open,
  onOpenChange,
  selectedProducts,
  onUpdate,
  onAuditLog
}: BulkInventoryUpdateProps) {
  const [updateType, setUpdateType] = useState<'set' | 'increase' | 'decrease'>('set');
  const [value, setValue] = useState<string>("");
  const [isPercentage, setIsPercentage] = useState(false);

  const handleApply = () => {
    if (!value || parseFloat(value) <= 0) {
      toast.error("Please enter a valid value");
      return;
    }

    const numValue = parseFloat(value);
    let summary = "";

    if (updateType === 'set') {
      summary = `Set stock to ${numValue} for ${selectedProducts.length} products`;
    } else if (updateType === 'increase') {
      if (isPercentage) {
        summary = `Increase stock by ${numValue}% for ${selectedProducts.length} products`;
      } else {
        summary = `Increase stock by ${numValue} units for ${selectedProducts.length} products`;
      }
    } else {
      if (isPercentage) {
        summary = `Decrease stock by ${numValue}% for ${selectedProducts.length} products`;
      } else {
        summary = `Decrease stock by ${numValue} units for ${selectedProducts.length} products`;
      }
    }

    // Call audit log callback if provided
    if (onAuditLog) {
      onAuditLog(updateType, numValue, isPercentage ? 'percentage' : 'units');
    }
    
    toast.success(summary);
    onUpdate();
    onOpenChange(false);
    setValue("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Inventory Update</DialogTitle>
          <DialogDescription>
            Update stock levels for {selectedProducts.length} selected products
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selected Products Preview */}
          <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
            <p className="text-sm font-medium mb-2">Selected Products:</p>
            <div className="space-y-1">
              {selectedProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{product.name}</span>
                  <span className="font-medium">
                    Current: {product.stockLevel} {product.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Update Type */}
          <div className="space-y-2">
            <Label>Update Type</Label>
            <Select value={updateType} onValueChange={(v: any) => setUpdateType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="set">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Set to specific value
                  </div>
                </SelectItem>
                <SelectItem value="increase">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Increase stock
                  </div>
                </SelectItem>
                <SelectItem value="decrease">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" />
                    Decrease stock
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Value Input */}
          <div className="space-y-2">
            <Label>
              {updateType === 'set' ? 'New Stock Level' : 
               isPercentage ? 'Percentage' : 'Amount'}
            </Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="0"
                step={isPercentage ? "1" : "0.01"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={updateType === 'set' ? 'Enter new stock level' : 
                           isPercentage ? 'Enter percentage' : 'Enter amount'}
                className="flex-1"
              />
              {updateType !== 'set' && (
                <Button
                  variant={isPercentage ? 'default' : 'outline'}
                  onClick={() => setIsPercentage(!isPercentage)}
                  className="w-20"
                >
                  {isPercentage ? '%' : 'Units'}
                </Button>
              )}
            </div>
          </div>

          {/* Preview */}
          {value && parseFloat(value) > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">Preview:</p>
              <div className="space-y-1">
                {selectedProducts.slice(0, 3).map((product) => {
                  let newStock = product.stockLevel;
                  const numValue = parseFloat(value);

                  if (updateType === 'set') {
                    newStock = numValue;
                  } else if (updateType === 'increase') {
                    if (isPercentage) {
                      newStock = Math.round(product.stockLevel * (1 + numValue / 100));
                    } else {
                      newStock = product.stockLevel + numValue;
                    }
                  } else {
                    if (isPercentage) {
                      newStock = Math.round(product.stockLevel * (1 - numValue / 100));
                    } else {
                      newStock = Math.max(0, product.stockLevel - numValue);
                    }
                  }

                  return (
                    <div key={product.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{product.name}</span>
                      <span>
                        <span className="text-muted-foreground">{product.stockLevel}</span>
                        {' → '}
                        <span className="font-medium text-blue-600">{Math.round(newStock)}</span>
                        {' '}{product.unit}
                      </span>
                    </div>
                  );
                })}
                {selectedProducts.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    ...and {selectedProducts.length - 3} more products
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleApply}
              disabled={!value || parseFloat(value) <= 0}
            >
              Apply to {selectedProducts.length} Products
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
