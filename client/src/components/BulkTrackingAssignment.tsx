import { useState } from "react";
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
import { Navigation, Truck } from "lucide-react";
import { toast } from "sonner";

interface BulkTrackingAssignmentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onAssign: (prefix: string, carrier: string) => void;
}

export default function BulkTrackingAssignment({
  open,
  onOpenChange,
  selectedCount,
  onAssign
}: BulkTrackingAssignmentProps) {
  const [trackingPrefix, setTrackingPrefix] = useState("");
  const [carrier, setCarrier] = useState("");
  const [startNumber, setStartNumber] = useState("1");

  const carriers = [
    "LBC Express",
    "JRS Express",
    "J&T Express",
    "Ninja Van",
    "Flash Express",
    "2GO Express"
  ];

  const handleAssign = () => {
    if (!trackingPrefix || !carrier) {
      toast.error("Please fill in all required fields");
      return;
    }

    onAssign(trackingPrefix, carrier);
    setTrackingPrefix("");
    setCarrier("");
    setStartNumber("1");
  };

  const generatePreview = () => {
    if (!trackingPrefix) return [];
    
    const start = parseInt(startNumber) || 1;
    const previews = [];
    
    for (let i = 0; i < Math.min(3, selectedCount); i++) {
      const number = (start + i).toString().padStart(6, '0');
      previews.push(`${trackingPrefix}${number}`);
    }
    
    return previews;
  };

  const previews = generatePreview();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk Assign Tracking Numbers</DialogTitle>
          <DialogDescription>
            Assign tracking numbers to {selectedCount} selected shipments
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Carrier Selection */}
          <div className="space-y-2">
            <Label>Carrier *</Label>
            <Select value={carrier} onValueChange={setCarrier}>
              <SelectTrigger>
                <SelectValue placeholder="Select carrier" />
              </SelectTrigger>
              <SelectContent>
                {carriers.map((c) => (
                  <SelectItem key={c} value={c}>
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      {c}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tracking Number Configuration */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tracking Number Prefix *</Label>
              <Input
                value={trackingPrefix}
                onChange={(e) => setTrackingPrefix(e.target.value.toUpperCase())}
                placeholder="e.g., LBC, JRS, JNT"
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground">
                Letters only, will be followed by sequential numbers
              </p>
            </div>

            <div className="space-y-2">
              <Label>Start Number</Label>
              <Input
                type="number"
                min="1"
                value={startNumber}
                onChange={(e) => setStartNumber(e.target.value)}
                placeholder="1"
              />
              <p className="text-xs text-muted-foreground">
                Starting number for sequential tracking numbers
              </p>
            </div>
          </div>

          {/* Preview */}
          {previews.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Navigation className="w-4 h-4 text-blue-600" />
                <p className="text-sm font-medium">Preview:</p>
              </div>
              <div className="space-y-1">
                {previews.map((preview, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Shipment {index + 1}</span>
                    <span className="font-mono font-medium text-blue-600">{preview}</span>
                  </div>
                ))}
                {selectedCount > 3 && (
                  <p className="text-xs text-muted-foreground pt-2">
                    ...and {selectedCount - 3} more tracking numbers
                  </p>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                <p className="text-xs text-muted-foreground">
                  <strong>Carrier:</strong> {carrier || 'Not selected'}
                </p>
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
              onClick={handleAssign}
              disabled={!trackingPrefix || !carrier}
            >
              Assign to {selectedCount} Shipments
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
