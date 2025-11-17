import { useState } from "react";
import { BatchOrder, calculateMOQProgress } from "@/data/batchOrdersData";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  TrendingUp,
  Users,
  Calendar,
  MapPin,
  DollarSign,
  Package,
  Truck
} from "lucide-react";
import { toast } from "sonner";

interface JoinBatchDialogProps {
  batch: BatchOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoin?: (batchId: string, quantity: number, paymentMethod: string) => void;
}

export default function JoinBatchDialog({
  batch,
  open,
  onOpenChange,
  onJoin
}: JoinBatchDialogProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<string>("loan");

  const progress = calculateMOQProgress(batch);
  const savingsPerUnit = batch.unitPrice - batch.bulkPrice;
  const deliveryShare = Math.round(batch.deliveryCost / (batch.farmerCount + 1)); // +1 for new farmer
  const productCost = quantity * batch.bulkPrice;
  const totalCost = productCost + deliveryShare;
  const totalSavings = quantity * savingsPerUnit;

  const handleJoin = () => {
    if (quantity < 1) {
      toast.error("Please enter a valid quantity");
      return;
    }

    onJoin?.(batch.id, quantity, paymentMethod);
    toast.success(`Successfully joined ${batch.batchNumber}!`, {
      description: `You ordered ${quantity} ${batch.unit} for ₱${totalCost.toLocaleString()}`
    });
    onOpenChange(false);
    
    // Reset form
    setQuantity(1);
    setPaymentMethod("loan");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Package className="w-6 h-6 text-green-600" />
            Join Batch Order & Save!
          </DialogTitle>
          <DialogDescription>
            Join other farmers to meet MOQ and get bulk pricing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Info */}
          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
            <h3 className="font-semibold text-lg mb-2">{batch.productName}</h3>
            <p className="text-sm text-muted-foreground mb-3">{batch.supplierName}</p>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Regular Price</p>
                <p className="font-semibold line-through text-red-600">
                  ₱{batch.unitPrice.toLocaleString()}/{batch.unit}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Batch Price</p>
                <p className="font-semibold text-green-600 text-lg">
                  ₱{batch.bulkPrice.toLocaleString()}/{batch.unit}
                </p>
              </div>
            </div>
          </div>

          {/* Savings Highlight */}
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-700 dark:text-green-400">
                Save ₱{savingsPerUnit.toLocaleString()} per {batch.unit}
              </span>
            </div>
            <p className="text-sm text-green-600 dark:text-green-500">
              That's {Math.round((savingsPerUnit / batch.unitPrice) * 100)}% savings compared to individual orders!
            </p>
          </div>

          {/* MOQ Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Progress to MOQ: {batch.currentQuantity} / {batch.moq} {batch.unit}
              </span>
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2 mb-2" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{batch.farmerCount} farmers already joined</span>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantity ({batch.unit}) *
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              placeholder="Enter quantity"
            />
            <p className="text-xs text-muted-foreground">
              Minimum order: 1 {batch.unit}
            </p>
          </div>

          {/* Cost Breakdown */}
          <div className="border rounded-lg p-4 space-y-2">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Your Cost Breakdown
            </h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Product ({quantity} {batch.unit} × ₱{batch.bulkPrice.toLocaleString()})
                </span>
                <span className="font-medium">₱{productCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Delivery Share (₱{batch.deliveryCost.toLocaleString()} ÷ {batch.farmerCount + 1} farmers)
                </span>
                <span className="font-medium">₱{deliveryShare.toLocaleString()}</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-base">
                <span className="font-semibold">Total Cost</span>
                <span className="font-bold text-lg">₱{totalCost.toLocaleString()}</span>
              </div>
              <div className="bg-green-50 dark:bg-green-950 rounded p-2 flex justify-between">
                <span className="text-green-700 dark:text-green-400 font-medium">
                  Your Savings
                </span>
                <span className="text-green-700 dark:text-green-400 font-bold">
                  ₱{totalSavings.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <Label>Payment Method *</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
                <RadioGroupItem value="loan" id="loan" />
                <Label htmlFor="loan" className="flex-1 cursor-pointer">
                  <div>
                    <p className="font-medium">CARD MRI Loan</p>
                    <p className="text-xs text-muted-foreground">
                      Deduct from loan balance (recommended)
                    </p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash" className="flex-1 cursor-pointer">
                  <div>
                    <p className="font-medium">Cash on Delivery</p>
                    <p className="text-xs text-muted-foreground">
                      Pay when you collect your order
                    </p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
                <RadioGroupItem value="bank-transfer" id="bank-transfer" />
                <Label htmlFor="bank-transfer" className="flex-1 cursor-pointer">
                  <div>
                    <p className="font-medium">Bank Transfer</p>
                    <p className="text-xs text-muted-foreground">
                      Transfer to CARD MRI account
                    </p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Delivery Info */}
          <div className="border rounded-lg p-4 space-y-2 bg-blue-50 dark:bg-blue-950">
            <h4 className="font-semibold flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Delivery Information
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Estimated Delivery</p>
                  <p className="text-muted-foreground">
                    {new Date(batch.deliveryDate!).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Collection Point</p>
                  <p className="text-muted-foreground">{batch.deliveryLocation}</p>
                </div>
              </div>
            </div>
          </div>

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
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={handleJoin}
            >
              Join Batch Order - ₱{totalCost.toLocaleString()}
            </Button>
          </div>

          {/* Note */}
          <p className="text-xs text-muted-foreground text-center">
            By joining this batch order, you agree to collect your order at the specified location and date.
            You will receive SMS/email notifications about batch status and delivery updates.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
