import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { farmersData } from "@/data/farmersData";
import { harvestData } from "@/data/harvestData";
import { useAuth } from "@/_core/hooks/useAuth";
import { TrendingUp, Sprout, DollarSign, Award, Calendar, MapPin, Phone, Mail, CheckCircle } from "lucide-react";
import AddHarvestDialog from "@/components/AddHarvestDialog";
import { ImageLightbox } from "@/components/ImageLightbox";

export default function FarmerDashboard() {
  const { user } = useAuth();
  const [isAddHarvestOpen, setIsAddHarvestOpen] = useState(false);
  const [harvests, setHarvests] = useState(harvestData);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  // Find the farmer profile for the logged-in user
  // For demo, we'll use the first farmer (Maria Santos) for the Farmer role
  const farmerProfile = farmersData.find((f: any) => f.email === user?.email) || farmersData[0];
  
  // Get harvests for this farmer
  const farmerHarvests = harvests.filter((h: any) => h.farmerId === farmerProfile.id);
  
  // Handle adding new harvest
  const handleAddHarvest = (newHarvest: any) => {
    setHarvests([newHarvest, ...harvests]);
  };
  
  // Calculate metrics
  const totalHarvest = farmerHarvests.length > 0 ? farmerHarvests.reduce((sum: number, h: any) => sum + h.quantity, 0) : 0;
  const totalEarnings = farmerHarvests.length > 0 ? farmerHarvests.reduce((sum: number, h: any) => sum + (h.totalValue || 0), 0) : 0;
  const avgYield = farmerProfile.totalLandArea > 0 && totalHarvest > 0 ? totalHarvest / farmerProfile.totalLandArea : 0;
  
  // Get crop distribution
  const cropCounts = farmerHarvests.length > 0 ? farmerHarvests.reduce((acc: Record<string, number>, h: any) => {
    acc[h.crop] = (acc[h.crop] || 0) + h.quantity;
    return acc;
  }, {} as Record<string, number>) : {};
  
  // Recent activities
  const recentHarvests = farmerHarvests
    .sort((a: any, b: any) => new Date(b.harvestDate).getTime() - new Date(a.harvestDate).getTime())
    .slice(0, 5);
  
  // CARD member benefits
  const memberSavings = totalEarnings * 0.03; // 3% savings on inputs

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-[#00C805] to-emerald-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">My Farm Dashboard</h1>
        <p className="text-emerald-50">Welcome back, {farmerProfile.name}!</p>
      </div>


      {/* My Farm Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Farm</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{farmerProfile.name}</div>
            <p className="text-xs text-muted-foreground">
              {farmerProfile.barangay}, {farmerProfile.municipality}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crop</CardTitle>
            <Sprout className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{farmerProfile.crops[0] || "Palay/Rice"}</div>
            <p className="text-xs text-muted-foreground">
              Primary crop
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Area</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{farmerProfile.totalLandArea} ha</div>
            <p className="text-xs text-muted-foreground">
              Farm size
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">
              Farm status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* My Activity Section */}
      <Card>
        <CardHeader>
          <CardTitle>My Activity</CardTitle>
          <CardDescription>Recent orders and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Recent Orders</h3>
              <p className="text-sm text-muted-foreground text-center py-4">No recent orders</p>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Recommendations</h3>
              <p className="text-sm text-muted-foreground text-center py-4">No recommendations at this time</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Harvest Dialog */}
      <AddHarvestDialog
        open={isAddHarvestOpen}
        onOpenChange={setIsAddHarvestOpen}
        onAdd={handleAddHarvest}
        farmerId={farmerProfile.id}
        farmerName={farmerProfile.name}
      />

      {/* Image Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
      />
    </div>
  );
}
