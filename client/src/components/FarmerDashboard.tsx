import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { farmersData } from "@/data/farmersData";
import { harvestData } from "@/data/harvestData";
import { useAuth } from "@/contexts/AuthContext";
import { TrendingUp, Sprout, DollarSign, Award, Calendar, MapPin, Phone, Mail } from "lucide-react";
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
        <h1 className="text-3xl font-bold mb-2">Welcome back, {farmerProfile.name}!</h1>
        <p className="text-emerald-50">Here's your farm performance overview</p>
      </div>

      {/* Farmer Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
          <CardDescription>Your farmer information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{farmerProfile.barangay}, {farmerProfile.municipality}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{farmerProfile.contactNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{farmerProfile.email || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Member since {new Date(farmerProfile.cardMemberSince).getFullYear()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Harvests</CardTitle>
            <Sprout className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{farmerHarvests.length}</div>
            <p className="text-xs text-muted-foreground">
              {totalHarvest.toFixed(1)} MT total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{(totalEarnings / 1000).toFixed(1)}K</div>
            <p className="text-xs text-muted-foreground">
              From all harvests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Yield</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgYield.toFixed(1)} MT/ha</div>
            <p className="text-xs text-muted-foreground">
              Per hectare
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Farm Size</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{farmerProfile.totalLandArea} ha</div>
            <p className="text-xs text-muted-foreground">
              {farmerProfile.crops.join(", ")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CARD Member Benefits */}
      <Card className="border-[#00C805]">
        <CardHeader>
          <CardTitle className="text-[#00C805]">🎉 CARD Member Benefits</CardTitle>
          <CardDescription>Your exclusive savings and perks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
              <div>
                <p className="font-semibold">Total Savings on Inputs</p>
                <p className="text-sm text-muted-foreground">3% discount on all agricultural products</p>
              </div>
              <div className="text-2xl font-bold text-[#00C805]">₱{memberSavings.toFixed(0)}</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">✓ Discounted Seeds</p>
                <p className="text-xs text-muted-foreground">Save 3% on all seed purchases</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">✓ Fertilizer Deals</p>
                <p className="text-xs text-muted-foreground">Special pricing on fertilizers</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">✓ Loan Access</p>
                <p className="text-xs text-muted-foreground">Priority loan processing</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Crop Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>My Crop Distribution</CardTitle>
          <CardDescription>Harvest breakdown by crop type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(cropCounts).map(([crop, quantity]) => {
              const percentage = ((quantity as number) / totalHarvest) * 100;
              return (
                <div key={crop}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{crop}</span>
                    <span className="text-sm text-muted-foreground">{(quantity as number).toFixed(1)} MT ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#00C805] h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Harvest Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Harvest Activity</CardTitle>
          <CardDescription>Your latest harvest records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentHarvests.length > 0 ? (
              recentHarvests.map((harvest: any) => (
                <div key={harvest.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Sprout className="h-5 w-5 text-[#00C805]" />
                      </div>
                      <div>
                        <p className="font-medium">{harvest.crop}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(harvest.harvestDate).toLocaleDateString()} • {harvest.quality}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{harvest.quantity} {harvest.unit}</p>
                      <p className="text-sm text-muted-foreground">₱{(harvest.totalValue || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  {harvest.photos && harvest.photos.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">📷 {harvest.photos.length} photo{harvest.photos.length > 1 ? 's' : ''}</span>
                      <div className="flex gap-2">
                        {harvest.photos.slice(0, 3).map((photo: string, index: number) => (
                          <img
                            key={index}
                            src={photo}
                            alt={`Harvest photo ${index + 1}`}
                            className="h-16 w-16 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => {
                              setLightboxImages(harvest.photos);
                              setLightboxIndex(index);
                              setIsLightboxOpen(true);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No harvest records yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and resources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              className="p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors"
              onClick={() => setIsAddHarvestOpen(true)}
            >
              <p className="font-medium">📝 Record New Harvest</p>
              <p className="text-sm text-muted-foreground mt-1">Add your latest harvest data</p>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors">
              <p className="font-medium">🛒 Browse Marketplace</p>
              <p className="text-sm text-muted-foreground mt-1">Shop for seeds and supplies</p>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors">
              <p className="font-medium">💰 Apply for Loan</p>
              <p className="text-sm text-muted-foreground mt-1">Access CARD financing options</p>
            </button>
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
