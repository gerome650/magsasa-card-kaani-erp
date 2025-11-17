import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart3, PieChart, TrendingUp, Wheat, MapPin, Activity } from "lucide-react";
import { MunicipalityBarChart } from "@/components/charts/MunicipalityBarChart";
import { CropDistributionPieChart } from "@/components/charts/CropDistributionPieChart";
import { YieldTrendsLineChart } from "@/components/charts/YieldTrendsLineChart";

export default function Analytics() {
  const { data: dbFarms, isLoading } = trpc.farms.list.useQuery();

  // Transform database format to frontend format
  const farms = dbFarms ? dbFarms.map(farm => ({
    id: farm.id.toString(),
    name: farm.name,
    farmerName: farm.farmerName,
    municipality: farm.municipality,
    size: parseFloat(farm.size as unknown as string),
    crops: Array.isArray(farm.crops) ? farm.crops : JSON.parse(farm.crops as unknown as string),
    status: farm.status as 'active' | 'inactive' | 'fallow',
    averageYield: farm.averageYield ? parseFloat(farm.averageYield as unknown as string) : 0,
    registrationDate: farm.registrationDate ? new Date(farm.registrationDate) : new Date(),
  })) : [];

  // Calculate statistics
  const totalFarms = farms.length;
  const totalArea = farms.reduce((sum, farm) => sum + farm.size, 0);
  const activeFarms = farms.filter(f => f.status === "active").length;
  const avgYield = farms.length > 0 
    ? farms.reduce((sum, farm) => sum + farm.averageYield, 0) / farms.length 
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Visualize farm data with interactive charts
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                <div className="h-3 bg-muted rounded w-20"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Visualize farm data with interactive charts
        </p>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wheat className="w-4 h-4" />
              Total Farms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFarms}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeFarms} active ({totalFarms > 0 ? ((activeFarms / totalFarms) * 100).toFixed(0) : 0}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Total Area
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalArea.toFixed(1)} ha</div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg: {totalFarms > 0 ? (totalArea / totalFarms).toFixed(1) : 0} ha/farm
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Average Yield
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgYield.toFixed(2)} t/ha</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all farms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Activity Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalFarms > 0 ? ((activeFarms / totalFarms) * 100).toFixed(0) : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeFarms} of {totalFarms} farms
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Farms by Municipality Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Farms by Municipality
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MunicipalityBarChart farms={farms} />
          </CardContent>
        </Card>

        {/* Crop Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Crop Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CropDistributionPieChart farms={farms} />
          </CardContent>
        </Card>
      </div>

      {/* Yield Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Yield Trends Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <YieldTrendsLineChart farms={farms} />
        </CardContent>
      </Card>
    </div>
  );
}
