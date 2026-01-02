import { Link } from "wouter";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Eye, Tractor, Map, Wheat, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { FarmListSkeleton } from "@/components/FarmListSkeleton";
import { type Farm } from "@/data/farmsData";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';



export default function FarmList() {
  // Fetch farms from database via tRPC
  const { data: dbFarms, isLoading, error } = trpc.farms.list.useQuery();
  
  // Transform database format to frontend format
  const allFarms: Farm[] = dbFarms ? dbFarms.map(farm => {
    const irrigationType = (farm as any).irrigationType;
    const validIrrigationType: 'Irrigated' | 'Rainfed' | 'Upland' = 
      (irrigationType === 'Irrigated' || irrigationType === 'Rainfed' || irrigationType === 'Upland')
        ? irrigationType
        : 'Rainfed';
    
    return {
      id: farm.id.toString(),
      farmerId: (farm as any).userId?.toString() || farm.id.toString(),
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
      crops: Array.isArray(farm.crops) ? farm.crops : (typeof farm.crops === 'string' ? JSON.parse(farm.crops) : []),
      soilType: (farm as any).soilType || 'Unknown',
      irrigationType: validIrrigationType,
      status: farm.status as 'active' | 'inactive' | 'fallow',
      dateRegistered: farm.registrationDate ? new Date(farm.registrationDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      averageYield: farm.averageYield ? parseFloat(farm.averageYield as unknown as string) : undefined,
    };
  }) : [];
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cropFilter, setCropFilter] = useState<string>("all");

  // Get unique crops for filter
  const allCrops = Array.from(new Set(allFarms.flatMap(farm => farm.crops)));

  // Filter farms
  const filteredFarms = allFarms.filter(farm => {
    const matchesSearch = 
      farm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farm.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farm.location.barangay.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farm.location.municipality.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || farm.status === statusFilter;
    
    const matchesCrop = cropFilter === "all" || farm.crops.some(crop => crop === cropFilter);
    
    return matchesSearch && matchesStatus && matchesCrop;
  });

  // Calculate statistics
  const totalFarms = allFarms.length;
  const totalArea = allFarms.reduce((sum, farm) => sum + farm.size, 0);
  const activeFarms = allFarms.filter(farm => farm.status === 'active').length;
  const activeFarmsPercentage = totalFarms > 0 ? (activeFarms / totalFarms) * 100 : 0;
  
  // Find most common crop
  const cropCounts = allFarms.flatMap(farm => farm.crops).reduce((acc, crop) => {
    acc[crop] = (acc[crop] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const mostCommonCrop = Object.entries(cropCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  
  // Prepare data for pie chart
  const cropDistributionData = Object.entries(cropCounts).map(([name, value]) => ({
    name,
    value
  })).sort((a, b) => b.value - a.value);
  
  // Colors for pie chart
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4'];

  const getStatusBadge = (status: Farm['status']) => {
    const variants: Record<Farm['status'], { variant: "default" | "secondary" | "outline"; label: string }> = {
      active: { variant: "default", label: "Active" },
      inactive: { variant: "secondary", label: "Inactive" },
      fallow: { variant: "outline", label: "Fallow" }
    };
    const config = variants[status];
    return <Badge variant={config.variant} className={status === 'active' ? 'bg-green-600' : status === 'fallow' ? 'bg-yellow-600' : ''}>{config.label}</Badge>;
  };

  // Show loading skeleton while fetching data
  if (isLoading) {
    return <FarmListSkeleton />;
  }
  
  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Farm Management Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage and monitor all registered farms in the MAGSASA-CARD system
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Farm Management Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor all registered farms in the MAGSASA-CARD system
          </p>
        </div>
        <Button asChild>
          <Link href="/farms/new">
            <Plus className="w-4 h-4 mr-2" />
            Add New Farm
          </Link>
        </Button>
      </div>

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Farms</CardTitle>
            <Tractor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFarms}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered in system
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Area</CardTitle>
            <Map className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalArea.toFixed(1)} ha</div>
            <p className="text-xs text-muted-foreground mt-1">
              Combined farm area
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Farms</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeFarms}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {activeFarmsPercentage.toFixed(0)}%
              </Badge>
              {' '}of total farms
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Crop</CardTitle>
            <Wheat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{mostCommonCrop}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Most common crop type
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Crop Distribution Pie Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Crop Distribution</CardTitle>
            {cropFilter !== "all" && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCropFilter("all")}
              >
                Clear Filter
              </Button>
            )}
          </div>
          {cropFilter !== "all" && (
            <p className="text-sm text-muted-foreground mt-2">
              Showing farms growing: <Badge variant="outline">{cropFilter}</Badge>
            </p>
          )}
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={cropDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                onClick={(data) => {
                  // Toggle filter: if clicking the same crop, clear filter; otherwise set new filter
                  if (cropFilter === data.name) {
                    setCropFilter("all");
                  } else {
                    setCropFilter(data.name);
                  }
                }}
                cursor="pointer"
              >
                {cropDistributionData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    opacity={cropFilter === "all" || cropFilter === entry.name ? 1 : 0.3}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value} farms`, 'Count']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registered Farms ({filteredFarms.length} of {allFarms.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by farm name, farmer, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="fallow">Fallow</SelectItem>
              </SelectContent>
            </Select>
            <Select value={cropFilter} onValueChange={setCropFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by crop" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Crops</SelectItem>
                {allCrops.map(crop => (
                  <SelectItem key={crop} value={crop}>{crop}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {filteredFarms.length > 0 ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Farm Name</TableHead>
                    <TableHead>Farmer</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Crops</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFarms.map(farm => (
                      <TableRow key={farm.id}>
                        <TableCell className="font-medium">
                          {farm.name}
                        </TableCell>
                        <TableCell>{farm.farmerName}</TableCell>
                        <TableCell>
                        <div className="text-sm">
                          <div>{farm.location.barangay}</div>
                          <div className="text-muted-foreground">{farm.location.municipality}</div>
                        </div>
                        </TableCell>
                        <TableCell>{farm.size} ha</TableCell>
                        <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {farm.crops.slice(0, 2).map(crop => (
                            <Badge key={crop} variant="outline" className="text-xs">
                              {crop}
                            </Badge>
                          ))}
                          {farm.crops.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{farm.crops.length - 2}
                            </Badge>
                          )}
                        </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(farm.status)}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/farms/${farm.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all" || cropFilter !== "all"
                  ? "No farms match your filters. Try adjusting your search criteria."
                  : "No farms registered yet. Click 'Add New Farm' to get started."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
