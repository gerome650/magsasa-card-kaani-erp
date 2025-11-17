import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  MapPin,
  Maximize2,
  Wheat,
  User,
  Calendar,
  TrendingUp,
  Edit,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { FarmsSkeleton } from "@/components/FarmsSkeleton";
import { type Farm } from "@/data/farmsData";
import { Link, useLocation } from "wouter";
import { EmptyState } from "@/components/EmptyState";

export default function Farms() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBarangay, setSelectedBarangay] = useState("all");
  const [selectedCrop, setSelectedCrop] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Fetch farms from database via tRPC
  const { data: dbFarms, isLoading, error } = trpc.farms.list.useQuery();
  
  // Transform database format to frontend format
  const farms: Farm[] = dbFarms ? dbFarms.map(farm => ({
    id: farm.id.toString(),
    name: farm.name,
    farmerName: farm.farmerName,
    location: {
      barangay: farm.barangay,
      municipality: farm.municipality,
      coordinates: {
        lat: parseFloat(farm.latitude as unknown as string),
        lng: parseFloat(farm.longitude as unknown as string),
      },
    },
    size: parseFloat(farm.size as unknown as string),
    crops: Array.isArray(farm.crops) ? farm.crops : JSON.parse(farm.crops as unknown as string),
    soilType: farm.soilType || 'Unknown',
    irrigationType: farm.irrigationType || 'Rainfed',
    status: farm.status as 'active' | 'inactive' | 'fallow',
    dateRegistered: farm.registrationDate ? new Date(farm.registrationDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    averageYield: farm.averageYield ? parseFloat(farm.averageYield as unknown as string) : undefined,
  })) : [];

  // Get unique values for filters
  const barangays = ["all", ...Array.from(new Set(farms.map((f) => f.location.barangay)))];
  const crops = ["all", ...Array.from(new Set(farms.flatMap((f) => f.crops)))];

  // Apply filters
  let filteredFarms = farms.filter((farm) => {
    const matchesSearch =
      farm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farm.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farm.location.barangay.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBarangay =
      selectedBarangay === "all" || farm.location.barangay === selectedBarangay;

    const matchesCrop =
      selectedCrop === "all" || farm.crops.includes(selectedCrop);

    const matchesStatus =
      selectedStatus === "all" || farm.status === selectedStatus;

    return matchesSearch && matchesBarangay && matchesCrop && matchesStatus;
  });

  // Calculate statistics
  const totalFarms = filteredFarms.length;
  const totalArea = filteredFarms.reduce((sum, farm) => sum + farm.size, 0);
  const activeFarms = filteredFarms.filter((f) => f.status === "active").length;
  const avgYield = filteredFarms.reduce((sum, farm) => sum + (farm.averageYield || 0), 0) / filteredFarms.length || 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "inactive":
        return "bg-gray-100 text-gray-700";
      case "fallow":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getIrrigationColor = (type: string) => {
    switch (type) {
      case "Irrigated":
        return "bg-blue-100 text-blue-700";
      case "Rainfed":
        return "bg-cyan-100 text-cyan-700";
      case "Upland":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Show loading skeleton while fetching data
  if (isLoading) {
    return <FarmsSkeleton />;
  }
  
  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Farms</h1>
            <p className="text-muted-foreground mt-1">
              Manage farm locations, crops, and production data
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-red-600 font-semibold mb-2">Failed to load farms</p>
            <p className="text-muted-foreground">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Farms</h1>
          <p className="text-muted-foreground mt-1">
            Manage farm locations, crops, and production data
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Farm
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Farms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFarms}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeFarms} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Area
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalArea.toFixed(1)} ha</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all farms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Yield
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgYield.toFixed(1)} MT/ha</div>
            <p className="text-xs text-muted-foreground mt-1">
              Per hectare
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unique Crops
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{crops.length - 1}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Different varieties
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search farms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedBarangay} onValueChange={setSelectedBarangay}>
          <SelectTrigger>
            <SelectValue placeholder="All Barangays" />
          </SelectTrigger>
          <SelectContent>
            {barangays.map((barangay) => (
              <SelectItem key={barangay} value={barangay}>
                {barangay === "all" ? "All Barangays" : barangay}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedCrop} onValueChange={setSelectedCrop}>
          <SelectTrigger>
            <SelectValue placeholder="All Crops" />
          </SelectTrigger>
          <SelectContent>
            {crops.map((crop) => (
              <SelectItem key={crop} value={crop}>
                {crop === "all" ? "All Crops" : crop}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger>
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="fallow">Fallow</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Farms Grid or Empty State */}
      {filteredFarms.length === 0 ? (
        farms.length === 0 ? (
          // No farms at all - show main empty state
          <EmptyState
            icon={Tractor}
            title="No farms registered yet"
            description="Get started by registering your first farm. Add farm details, draw boundaries on the map, and start tracking your agricultural operations."
            actionLabel="Register First Farm"
            onAction={() => navigate('/farms/new')}
          />
        ) : (
          // Farms exist but filtered out - show filter empty state
          <EmptyState
            icon={Search}
            title="No farms match your filters"
            description="Try adjusting your search criteria or filters to find the farms you're looking for."
            actionLabel="Clear Filters"
            onAction={() => {
              setSearchQuery("");
              setSelectedBarangay("all");
              setSelectedCrop("all");
              setSelectedStatus("all");
            }}
            secondaryActionLabel="Register New Farm"
            onSecondaryAction={() => navigate('/farms/new')}
          />
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFarms.map((farm) => (
          <Card key={farm.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{farm.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {farm.farmerName}
                    </span>
                  </div>
                </div>
                <Badge className={getStatusColor(farm.status)}>
                  {farm.status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Location */}
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  {farm.location.barangay}, {farm.location.municipality}
                </span>
              </div>

              {/* Farm Details */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Size</p>
                  <p className="font-semibold">{farm.size} ha</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Soil Type</p>
                  <p className="font-semibold">{farm.soilType}</p>
                </div>
              </div>

              {/* Irrigation */}
              <div>
                <Badge className={getIrrigationColor(farm.irrigationType)}>
                  {farm.irrigationType}
                </Badge>
              </div>

              {/* Crops */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Crops</p>
                <div className="flex flex-wrap gap-1">
                  {farm.crops.map((crop) => (
                    <Badge key={crop} variant="outline" className="text-xs">
                      {crop}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Yield */}
              {farm.averageYield && (
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-muted-foreground">
                    Avg Yield: <strong>{farm.averageYield} MT/ha</strong>
                  </span>
                </div>
              )}

              {/* Last Harvest */}
              {farm.lastHarvest && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Last Harvest: {formatDate(farm.lastHarvest)}
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Link href={`/farms/${farm.id}`} className="flex-1">
                  <Button variant="default" className="w-full" size="sm">
                    <Maximize2 className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </Link>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      )}


    </div>
  );
}
