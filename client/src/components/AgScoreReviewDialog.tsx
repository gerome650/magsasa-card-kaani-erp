import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PendingAgScoreSubmission } from "@/data/pendingAgScores";
import { useState } from "react";
import { CheckCircle, XCircle, MapPin, Wheat, TrendingUp, Cloud, Sprout, Award } from "lucide-react";
import { toast } from "sonner";
import AgScoreBadge from "./AgScoreBadge";

interface AgScoreReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: PendingAgScoreSubmission | null;
  onApprove: (submissionId: string, comment: string) => void;
  onReject: (submissionId: string, comment: string) => void;
}

export default function AgScoreReviewDialog({
  open,
  onOpenChange,
  submission,
  onApprove,
  onReject
}: AgScoreReviewDialogProps) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!submission) return null;

  const handleApprove = async () => {
    if (!comment.trim()) {
      toast.error("Please add a comment before approving");
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      onApprove(submission.id, comment);
      toast.success("AgScore™ approved successfully");
      setComment("");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to approve AgScore™");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      toast.error("Please add a comment explaining the rejection");
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      onReject(submission.id, comment);
      toast.success("AgScore™ rejected. Feedback sent to farmer.");
      setComment("");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to reject AgScore™");
    } finally {
      setIsSubmitting(false);
    }
  };

  const { submittedData, calculatedScore } = submission;
  
  // Invert scores for display
  const displayClimate = 1000 - calculatedScore.climateScore;
  const displaySoil = 1000 - calculatedScore.soilScore;
  const displayHarvest = 1000 - calculatedScore.harvestScore;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Review AgScore™ Submission</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Submitted by {submission.farmerName} on {new Date(submission.submittedDate).toLocaleDateString()}
          </p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Farmer Information */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Farmer Information
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Farmer ID</p>
                <p className="font-medium">{submission.farmerId}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Name</p>
                <p className="font-medium">{submission.farmerName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Location</p>
                <p className="font-medium">
                  {submittedData.barangay}, {submittedData.municipality}, {submittedData.province}
                </p>
              </div>
              {submittedData.coordinates && (
                <div>
                  <p className="text-muted-foreground">Coordinates</p>
                  <p className="font-medium text-xs">
                    {submittedData.coordinates.lat.toFixed(4)}, {submittedData.coordinates.lng.toFixed(4)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Submitted Farm Data */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Wheat className="w-4 h-4" />
              Submitted Farm Data
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Crop Type</p>
                <p className="font-medium">{submittedData.cropType}</p>
              </div>
              <div>
                <p className="text-muted-foreground">System/Variety</p>
                <p className="font-medium">{submittedData.systemOrVariety}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Projected Yield</p>
                <p className="font-medium">{submittedData.projectedYieldPerHa} MT/ha</p>
              </div>
              <div>
                <p className="text-muted-foreground">Farm Size</p>
                <p className="font-medium">{submittedData.areaSizeHa} hectares</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Total Projected Harvest</p>
                <p className="font-medium text-lg">
                  {(submittedData.projectedYieldPerHa * submittedData.areaSizeHa).toFixed(2)} MT
                </p>
              </div>
            </div>
          </div>

          {/* Calculated AgScore */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-green-600" />
              Calculated AgScore™
            </h3>
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Overall Score</p>
                <AgScoreBadge 
                  score={calculatedScore.baselineScore}
                  tier={calculatedScore.tier}
                  qualitativeTier={calculatedScore.qualitativeTier}
                  size="lg"
                />
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Confidence Weight</p>
                <p className="text-2xl font-bold text-green-600">
                  {(calculatedScore.confidenceWeight * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            {/* Component Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-blue-600" />
                  <span>Climate Score</span>
                  <Badge variant="outline" className="text-xs">50% weight</Badge>
                </div>
                <span className="font-semibold">{displayClimate}/1000</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-amber-600" />
                  <span>Soil Score</span>
                  <Badge variant="outline" className="text-xs">30% weight</Badge>
                </div>
                <span className="font-semibold">{displaySoil}/1000</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Wheat className="w-4 h-4 text-green-600" />
                  <span>Harvest Score</span>
                  <Badge variant="outline" className="text-xs">20% weight</Badge>
                </div>
                <span className="font-semibold">{displayHarvest}/1000</span>
              </div>
            </div>

            {/* Alpha Metric */}
            <div className="mt-4 pt-4 border-t border-green-200">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span>Alpha Risk</span>
                  <Badge variant="outline" className="text-xs">{calculatedScore.alphaTierLabel}</Badge>
                </div>
                <span className="font-semibold">{1000 - calculatedScore.alphaRisk}/1000</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Performance vs. environmental context
              </p>
            </div>
          </div>

          {/* Review Comment */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Review Comment <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add your review comment here. For approval, confirm data accuracy. For rejection, explain what needs correction..."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This comment will be shared with the farmer via KaAni.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleReject}
              variant="outline"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
              disabled={isSubmitting}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={handleApprove}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={isSubmitting}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
