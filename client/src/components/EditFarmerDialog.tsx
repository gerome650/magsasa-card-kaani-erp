import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { updateFarmer, type Farmer } from "@/data/farmersData";

interface EditFarmerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farmer: Farmer | null;
  onSuccess?: () => void;
}

export default function EditFarmerDialog({
  open,
  onOpenChange,
  farmer,
  onSuccess,
}: EditFarmerDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    contactNumber: "",
    email: "",
    barangay: "",
    municipality: "Calauan",
    farmSize: "",
    primaryCrop: "",
    status: "active" as "active" | "inactive",
  });

  useEffect(() => {
    if (farmer) {
      setFormData({
        name: farmer.name,
        contactNumber: farmer.contactNumber,
        email: farmer.email || "",
        barangay: farmer.address.barangay,
        municipality: farmer.address.municipality,
        farmSize: farmer.farmSize?.toString() || "",
        primaryCrop: farmer.primaryCrop || "",
        status: farmer.status,
      });
    }
  }, [farmer]);

  const barangays = [
    "Balayhangin",
    "Bangyas",
    "Dayap",
    "Hanggan",
    "Imok",
    "Lamot 1",
    "Lamot 2",
    "Limao",
    "Mabacan",
    "Masiit",
    "Paliparan",
    "Perez",
    "Prinza",
    "San Isidro",
    "Santo Tomas",
  ];

  const crops = [
    "Palay (Rice)",
    "Corn",
    "Coconut",
    "Vegetables",
    "Fruits",
    "Root Crops",
  ];

  const handleSubmit = () => {
    if (!farmer) return;

    // Validation
    if (!formData.name || !formData.contactNumber || !formData.barangay) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Update farmer
    const updates: Partial<Farmer> = {
      name: formData.name,
      contactNumber: formData.contactNumber,
      email: formData.email || undefined,
      address: {
        barangay: formData.barangay,
        municipality: formData.municipality,
      },
      farmSize: formData.farmSize ? parseFloat(formData.farmSize) : 0,
      primaryCrop: formData.primaryCrop || "Not specified",
      status: formData.status,
    };

    updateFarmer(farmer.id, updates);

    toast.success(`Farmer ${formData.name} updated successfully!`);
    
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Farmer Details</DialogTitle>
          <DialogDescription>
            Update farmer information in the MAGSASA-CARD system
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Personal Information</h3>
            
            <div className="grid gap-2">
              <Label htmlFor="name">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="contact">
                Contact Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contact"
                value={formData.contactNumber}
                onChange={(e) =>
                  setFormData({ ...formData, contactNumber: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "inactive") =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Address</h3>
            
            <div className="grid gap-2">
              <Label htmlFor="barangay">
                Barangay <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.barangay}
                onValueChange={(value) =>
                  setFormData({ ...formData, barangay: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {barangays.map((barangay) => (
                    <SelectItem key={barangay} value={barangay}>
                      {barangay}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="municipality">Municipality</Label>
              <Input
                id="municipality"
                value={formData.municipality}
                disabled
              />
            </div>
          </div>

          {/* Farm Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Farm Information</h3>
            
            <div className="grid gap-2">
              <Label htmlFor="farmSize">Farm Size (hectares)</Label>
              <Input
                id="farmSize"
                type="number"
                step="0.1"
                value={formData.farmSize}
                onChange={(e) =>
                  setFormData({ ...formData, farmSize: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="primaryCrop">Primary Crop</Label>
              <Select
                value={formData.primaryCrop}
                onValueChange={(value) =>
                  setFormData({ ...formData, primaryCrop: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {crops.map((crop) => (
                    <SelectItem key={crop} value={crop}>
                      {crop}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
