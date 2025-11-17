import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Calculator, CheckCircle } from "lucide-react";
import AgScoreBadge from "./AgScoreBadge";
import AgScoreBreakdown from "./AgScoreBreakdown";

interface AgScoreRecalculateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farmers: Array<{
    id: string;
    name: string;
    location: string;
  }>;
  onSubmitForApproval?: (data: any) => void;
}

export default function AgScoreRecalculateDialog({
  open,
  onOpenChange,
  farmers,
  onSubmitForApproval
}: AgScoreRecalculateDialogProps) {
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>("");
  const [cropType, setCropType] = useState<string>("");
  const [farmSystem, setFarmSystem] = useState<string>("");
  const [farmSize, setFarmSize] = useState<string>("");
  const [projectedYield, setProjectedYield] = useState<string>("");
  const [farmLocation, setFarmLocation] = useState<string>("");
  
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculatedScore, setCalculatedScore] = useState<any>(null);

  const selectedFarmer = farmers.find(f => f.id === selectedFarmerId);

  const handleFarmerSelect = (farmerId: string) => {
    setSelectedFarmerId(farmerId);
    const farmer = farmers.find(f => f.id === farmerId);
    
    // Pre-fill with mock existing data
    if (farmer) {
      setFarmLocation(farmer.location);
      // Reset other fields to allow fresh input
      setCropType("");
      setFarmSystem("");
      setFarmSize("");
      setProjectedYield("");
      setCalculatedScore(null);
    }
  };

  const handleCalculate = async () => {
    // Validation
    if (!selectedFarmerId || !cropType || !farmSystem || !farmSize || !projectedYield) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsCalculating(true);

    // Simulate API call to KaAni for AgScore calculation
    setTimeout(() => {
      // Mock calculation based on yield
      const yieldValue = parseFloat(projectedYield);
      const sizeValue = parseFloat(farmSize);
      
      // Simple mock scoring logic
      let harvestScore = 500;
      if (yieldValue >= 6) harvestScore = 750;
      else if (yieldValue >= 5) harvestScore = 650;
      else if (yieldValue >= 4) harvestScore = 550;
      else if (yieldValue >= 3) harvestScore = 450;
      else harvestScore = 350;

      const climateScore = 500 + Math.floor(Math.random() * 200);
      const soilScore = 500 + Math.floor(Math.random() * 200);
      const baselineScore = Math.floor(
        0.5 * climateScore + 0.3 * soilScore + 0.2 * harvestScore
      );

      // Determine tier (inverted: higher = better)
      let tier = 4;
      let qualitativeTier = "Moderate Performance";
      if (baselineScore >= 850) {
        tier = 7;
        qualitativeTier = "Very High Performance";
      } else if (baselineScore >= 700) {
        tier = 6;
        qualitativeTier = "High Performance";
      } else if (baselineScore >= 550) {
        tier = 5;
        qualitativeTier = "Moderately High Performance";
      } else if (baselineScore >= 400) {
        tier = 4;
        qualitativeTier = "Moderate Performance";
      } else if (baselineScore >= 250) {
        tier = 3;
        qualitativeTier = "Moderately Low Performance";
      } else if (baselineScore >= 100) {
        tier = 2;
        qualitativeTier = "Low Performance";
      } else {
        tier = 1;
        qualitativeTier = "Very Low Performance";
      }

      const newScore = {
        baselineScore,
        climateScore,
        soilScore,
        harvestScore,
        tier,
        qualitativeTier,
        alpha: climateScore * 0.6 + soilScore * 0.4 - harvestScore * 0.92,
        alphaRisk: 500,
        confidenceWeight: 0.92
      };

      setCalculatedScore(newScore);
      setIsCalculating(false);

      toast.success("AgScore™ calculated successfully!", {
        description: `New score: ${baselineScore}/1000 (${qualitativeTier})`
      });
    }, 2000);
  };

  const handleSubmitForApproval = () => {
    if (!calculatedScore) {
      toast.error("Please calculate AgScore™ first");
      return;
    }

    const submissionData = {
      farmerId: selectedFarmerId,
      farmerName: selectedFarmer?.name,
      location: farmLocation,
      cropType,
      farmSystem,
      farmSize: parseFloat(farmSize),
      projectedYield: parseFloat(projectedYield),
      agScore: calculatedScore,
      submittedAt: new Date().toISOString()
    };

    if (onSubmitForApproval) {
      onSubmitForApproval(submissionData);
    }

    toast.success("AgScore™ submitted for approval", {
      description: `Submission for ${selectedFarmer?.name} added to review queue`
    });

    // Reset form
    handleReset();
    onOpenChange(false);
  };

  const handleReset = () => {
    setSelectedFarmerId("");
    setCropType("");
    setFarmSystem("");
    setFarmSize("");
    setProjectedYield("");
    setFarmLocation("");
    setCalculatedScore(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-green-600" />
            Recalculate AgScore™
          </DialogTitle>
          <DialogDescription>
            Update farmer data and calculate new AgScore™ for submission to approval queue
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Farmer Selection */}
          <div className="space-y-2">
            <Label htmlFor="farmer">Select Farmer *</Label>
            <Select value={selectedFarmerId} onValueChange={handleFarmerSelect}>
              <SelectTrigger id="farmer">
                <SelectValue placeholder="Choose a farmer..." />
              </SelectTrigger>
              <SelectContent>
                {farmers.map((farmer) => (
                  <SelectItem key={farmer.id} value={farmer.id}>
                    {farmer.name} - {farmer.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedFarmerId && (
            <>
              {/* Crop Type */}
              <div className="space-y-2">
                <Label htmlFor="cropType">Crop Type *</Label>
                <Select value={cropType} onValueChange={setCropType}>
                  <SelectTrigger id="cropType">
                    <SelectValue placeholder="Select crop type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Palay (Rice)">Palay (Rice)</SelectItem>
                    <SelectItem value="Corn (Maize)">Corn (Maize)</SelectItem>
                    <SelectItem value="Tomato">Tomato</SelectItem>
                    <SelectItem value="Eggplant">Eggplant</SelectItem>
                    <SelectItem value="Cabbage">Cabbage</SelectItem>
                    <SelectItem value="Lettuce">Lettuce</SelectItem>
                    <SelectItem value="Cucumber">Cucumber</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Farm System */}
              <div className="space-y-2">
                <Label htmlFor="farmSystem">Farm System/Variety *</Label>
                <Select value={farmSystem} onValueChange={setFarmSystem}>
                  <SelectTrigger id="farmSystem">
                    <SelectValue placeholder="Select system..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Irrigated">Irrigated</SelectItem>
                    <SelectItem value="Rainfed">Rainfed</SelectItem>
                    <SelectItem value="Greenhouse">Greenhouse</SelectItem>
                    <SelectItem value="Organic">Organic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Farm Size */}
              <div className="space-y-2">
                <Label htmlFor="farmSize">Farm Size (hectares) *</Label>
                <Input
                  id="farmSize"
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="e.g., 2.5"
                  value={farmSize}
                  onChange={(e) => setFarmSize(e.target.value)}
                />
              </div>

              {/* Projected Yield */}
              <div className="space-y-2">
                <Label htmlFor="projectedYield">Projected Yield (MT/ha) *</Label>
                <Input
                  id="projectedYield"
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="e.g., 5.8"
                  value={projectedYield}
                  onChange={(e) => setProjectedYield(e.target.value)}
                />
              </div>

              {/* Farm Location */}
              <div className="space-y-2">
                <Label htmlFor="farmLocation">Farm Location</Label>
                <Input
                  id="farmLocation"
                  placeholder="Barangay, Municipality"
                  value={farmLocation}
                  onChange={(e) => setFarmLocation(e.target.value)}
                />
              </div>

              {/* Calculate Button */}
              <Button
                onClick={handleCalculate}
                disabled={isCalculating || !cropType || !farmSystem || !farmSize || !projectedYield}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isCalculating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calculating AgScore™...
                  </>
                ) : (
                  <>
                    <Calculator className="mr-2 h-4 w-4" />
                    Calculate AgScore™
                  </>
                )}
              </Button>

              {/* Calculated Score Display */}
              {calculatedScore && (
                <div className="mt-6 space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-green-900">New AgScore™ Calculated</h3>
                    <AgScoreBadge
                      score={calculatedScore.baselineScore}
                      tier={calculatedScore.tier}
                      qualitativeTier={calculatedScore.qualitativeTier}
                      size="md"
                    />
                  </div>

                  <AgScoreBreakdown
                    climateScore={calculatedScore.climateScore}
                    soilScore={calculatedScore.soilScore}
                    harvestScore={calculatedScore.harvestScore}
                    baselineScore={calculatedScore.baselineScore}
                  />
                  
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-green-700 font-medium">Confidence Weight:</span>
                      <span className="ml-2 text-green-900">{(calculatedScore.confidenceWeight * 100).toFixed(0)}%</span>
                    </div>
                    <div>
                      <span className="text-green-700 font-medium">Alpha Risk:</span>
                      <span className="ml-2 text-green-900">{calculatedScore.alphaRisk}/1000</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-green-200">
                    <p className="text-sm text-green-800 mb-3">
                      Review the calculated AgScore™ and submit for approval to update farmer records.
                    </p>
                    <Button
                      onClick={handleSubmitForApproval}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Submit for Approval
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
