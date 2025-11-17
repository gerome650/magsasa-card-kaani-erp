import { Link } from "wouter";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Eye } from "lucide-react";
import { getFarms, type Farm } from "@/data/farmsData";

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
                      <TableCell className="font-medium">{farm.name}</TableCell>
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
