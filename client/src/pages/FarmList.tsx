import { Link } from "wouter";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Plus, Search, Eye, Tractor, Map, TrendingUp, Wheat, TrendingDown } from "lucide-react";
import { getFarms, type Farm } from "@/data/farmsData";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

// Helper function to generate mock farm statistics for preview
const generateFarmStats = (farm: Farm) => {
  // Generate mock yield data (2-4 recent harvests)
  const harvestCount = Math.floor(Math.random() * 3) + 2;
  const yields = Array.from({ length: harvestCount }, (_, i) => ({
    date: new Date(Date.now() - (i + 1) * 90 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    quantity: Math.floor(Math.random() * 5000) + 1000,
    crop: farm.crops[Math.floor(Math.random() * farm.crops.length)]
  }));
  
  // Calculate mock financials
  const totalRevenue = yields.reduce((sum, y) => sum + (y.quantity * 20), 0); // ₱20/kg average
  const totalCosts = Math.floor(farm.size * (Math.random() * 30000 + 20000)); // ₱20k-50k per hectare
  const profit = totalRevenue - totalCosts;
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
  
  return { yields, totalRevenue, totalCosts, profit, profitMargin };
};

export default function FarmList() {
  const allFarms = getFarms();
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
                  {filteredFarms.map(farm => {
                    const stats = generateFarmStats(farm);
                    return (
                    <TableRow key={farm.id}>
                      <TableCell className="font-medium">
                        <HoverCard openDelay={300}>
                          <HoverCardTrigger asChild>
                            <span className="cursor-help underline decoration-dotted">{farm.name}</span>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-80">
                            <div className="space-y-3">
                              <div>
                                <h4 className="font-semibold text-sm mb-2">Recent Harvests</h4>
                                <div className="space-y-1">
                                  {stats.yields.slice(0, 3).map((harvest, idx) => (
                                    <div key={idx} className="text-xs flex justify-between">
                                      <span className="text-muted-foreground">{harvest.date}</span>
                                      <span>{harvest.crop}: {harvest.quantity.toLocaleString()} kg</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="border-t pt-2">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <p className="text-muted-foreground">Total Revenue</p>
                                    <p className="font-semibold">₱{stats.totalRevenue.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Total Costs</p>
                                    <p className="font-semibold">₱{stats.totalCosts.toLocaleString()}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="border-t pt-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">Profit Margin</span>
                                  <div className="flex items-center gap-1">
                                    {stats.profitMargin >= 0 ? (
                                      <TrendingUp className="w-4 h-4 text-green-600" />
                                    ) : (
                                      <TrendingDown className="w-4 h-4 text-red-600" />
                                    )}
                                    <span className={`font-semibold text-sm ${
                                      stats.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {stats.profitMargin.toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
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
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/farms/${farm.id}`}>
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                    );
                  })}
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
