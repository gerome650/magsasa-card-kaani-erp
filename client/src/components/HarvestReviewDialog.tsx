import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, User, MapPin, Calendar, Package, DollarSign, TrendingUp } from "lucide-react";
import { useState } from "react";
import { HarvestRecord } from "@/data/harvestData";
import { ImageLightbox } from "@/components/ImageLightbox";
import { toast } from "sonner";

interface HarvestReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  harvest: HarvestRecord | null;
  onApprove: (harvestId: string, comment: string) => void;
  onReject: (harvestId: string, reason: string) => void;
}

export default function HarvestReviewDialog({
  open,
  onOpenChange,
  harvest,
  onApprove,
  onReject
}: HarvestReviewDialogProps) {
  const [comment, setComment] = useState("");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  if (!harvest) return null;

  const handleApprove = () => {
    if (!comment.trim()) {
      toast.error("Please add a comment before approving");
      return;
    }
    onApprove(harvest.id, comment);
    setComment("");
    onOpenChange(false);
  };

  const handleReject = () => {
    if (!comment.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    onReject(harvest.id, comment);
    setComment("");
    onOpenChange(false);
  };

  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index);
    setIsLightboxOpen(true);
  };

  const qualityColors = {
    'Premium': 'bg-purple-100 text-purple-700',
    'Grade A': 'bg-green-100 text-green-700',
    'Grade B': 'bg-blue-100 text-blue-700',
    'Grade C': 'bg-gray-100 text-gray-700'
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Harvest Review</DialogTitle>
            <DialogDescription>
              Review harvest submission and approve or reject with comments
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Farmer Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <User className="h-5 w-5" />
                Farmer Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{harvest.farmerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Farmer ID</p>
                  <p className="font-medium">{harvest.farmerId}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Location
                  </p>
                  <p className="font-medium">{harvest.farmLocation}</p>
                </div>
              </div>
            </div>

            {/* Harvest Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Harvest Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Crop Type</p>
                  <p className="font-medium text-lg">{harvest.crop}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Harvest Date
                  </p>
                  <p className="font-medium">{new Date(harvest.harvestDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p className="font-medium text-lg">{harvest.quantity.toLocaleString()} {harvest.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quality Grade</p>
                  <Badge className={qualityColors[harvest.qualityGrade]}>{harvest.qualityGrade}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Land Area</p>
                  <p className="font-medium">{harvest.landAreaHarvested} hectares</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Yield per Hectare
                  </p>
                  <p className="font-medium">{harvest.yieldPerHectare.toFixed(2)} {harvest.unit}/ha</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Estimated Value
                  </p>
                  <p className="font-semibold text-xl text-green-600">
                    ₱{harvest.totalValue.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    @ ₱{harvest.pricePerUnit}/kg
                  </p>
                </div>
              </div>
            </div>

            {/* Harvest Photos */}
            {harvest.photos && harvest.photos.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">
                  📷 Harvest Photos ({harvest.photos.length})
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {harvest.photos.map((photo, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border-2 border-gray-200 hover:border-green-500"
                      onClick={() => handlePhotoClick(index)}
                    >
                      <img
                        src={photo}
                        alt={`Harvest photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {index + 1}/{harvest.photos?.length || 0}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {harvest.notes && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Farmer's Notes</h3>
                <p className="text-sm text-muted-foreground">{harvest.notes}</p>
              </div>
            )}

            {/* Approval Form */}
            <div className="border-t pt-4">
              <Label htmlFor="comment" className="text-base font-semibold">
                Review Comment *
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                Provide feedback or reason for approval/rejection
              </p>
              <Textarea
                id="comment"
                placeholder="Enter your review comments here..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                className="gap-2"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </Button>
              <Button
                onClick={handleApprove}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4" />
                Approve
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Lightbox */}
      {harvest.photos && harvest.photos.length > 0 && (
        <ImageLightbox
          images={harvest.photos || []}
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          initialIndex={selectedPhotoIndex}
        />
      )}
    </>
  );
}
