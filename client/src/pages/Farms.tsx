import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Trash2,
  Download,
  X,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { FarmsSkeleton } from "@/components/FarmsSkeleton";
import { type Farm } from "@/data/farmsData";
import { Link, useLocation, useSearch } from "wouter";
import { EmptyState } from "@/components/EmptyState";
import { useDebounce } from "@/hooks/useDebounce";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";
import { FilterChips } from "@/components/FilterChips";
import { HighlightText } from "@/components/HighlightText";
import { FilterBreadcrumb } from "@/components/FilterBreadcrumb";

export default function Farms() {
  const [, navigate] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  
  // Initialize state from URL parameters
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const start = searchParams.get("startDate");
    const end = searchParams.get("endDate");
    if (start && end) {
      return {
        from: new Date(start),
        to: new Date(end),
      };
    }
    return undefined;
  });
  const [selectedBarangay, setSelectedBarangay] = useState(searchParams.get("barangay") || "all");
  const [selectedCrop, setSelectedCrop] = useState(searchParams.get("crop") || "all");
  const [selectedStatus, setSelectedStatus] = useState<string>(searchParams.get("status") || "all");
  const [selectedFarms, setSelectedFarms] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Check if user came from Analytics page
  const fromAnalytics = searchParams.get("from") === "analytics";

  // Debounce search query to reduce API calls
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Debounced URL sync - update URL parameters after 500ms of no changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams();
      
      if (searchQuery) params.set("search", searchQuery);
      if (dateRange?.from) params.set("startDate", dateRange.from.toISOString().split('T')[0]);
      if (dateRange?.to) params.set("endDate", dateRange.to.toISOString().split('T')[0]);
      if (selectedBarangay !== "all") params.set("barangay", selectedBarangay);
      if (selectedCrop !== "all") params.set("crop", selectedCrop);
      if (selectedStatus !== "all") params.set("status", selectedStatus);
      
      const newUrl = params.toString() ? `/farms?${params.toString()}` : "/farms";
      
      // Only update if URL actually changed to prevent unnecessary history entries
      if (window.location.pathname + window.location.search !== newUrl) {
        window.history.replaceState({}, "", newUrl);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, dateRange, selectedBarangay, selectedCrop, selectedStatus]);

  // Fetch farms from database via tRPC with search and date filters
  const { data: dbFarms, isLoading, error } = trpc.farms.list.useQuery({
    search: debouncedSearch || undefined,
    startDate: dateRange?.from ? dateRange.from.toISOString().split('T')[0] : undefined,
    endDate: dateRange?.to ? dateRange.to.toISOString().split('T')[0] : undefined,
  });
  const utils = trpc.useUtils();
  const bulkDeleteMutation = trpc.farms.bulkDelete.useMutation({
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await utils.farms.list.cancel();
      
      // Snapshot previous value
      const previousFarms = utils.farms.list.getData();
      
      // Optimistically update cache
      utils.farms.list.setData(undefined, (old) => {
        if (!old) return old;
        return old.filter(farm => !variables.ids.includes(farm.id));
      });
      
      // Show optimistic toast
      import('sonner').then(({ toast }) => {
        toast.loading(`Deleting ${variables.ids.length} farm${variables.ids.length !== 1 ? 's' : ''}...`);
      });
      
      return { previousFarms };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousFarms) {
        utils.farms.list.setData(undefined, context.previousFarms);
      }
      import('sonner').then(({ toast }) => {
        toast.dismiss();
        toast.error('Failed to delete farms', {
          description: err.message,
        });
      });
    },
    onSuccess: (data) => {
      import('sonner').then(({ toast }) => {
        toast.dismiss();
        if (data.failed.length === 0) {
          toast.success(`Successfully deleted ${data.success.length} farm${data.success.length !== 1 ? 's' : ''}`);
        } else {
          toast.warning(`Deleted ${data.success.length} farm${data.success.length !== 1 ? 's' : ''}, ${data.failed.length} failed`, {
            description: `Failed farms: ${data.failed.map(f => f.id).join(', ')}`,
          });
        }
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      utils.farms.list.invalidate();
    },
  });
  
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

  // Bulk operations handlers
  const handleSelectAll = () => {
    if (selectedFarms.size === filteredFarms.length) {
      setSelectedFarms(new Set());
    } else {
      setSelectedFarms(new Set(filteredFarms.map(f => f.id)));
    }
  };

  const handleSelectFarm = (farmId: string) => {
    const newSelected = new Set(selectedFarms);
    if (newSelected.has(farmId)) {
      newSelected.delete(farmId);
    } else {
      newSelected.add(farmId);
    }
    setSelectedFarms(newSelected);
  };

  const handleExportSelected = () => {
    const selectedFarmData = filteredFarms.filter(f => selectedFarms.has(f.id));
    
    // CSV headers
    const headers = [
      'Farm Name',
      'Farmer Name',
      'Barangay',
      'Municipality',
      'Latitude',
      'Longitude',
      'Size (ha)',
      'Crops',
      'Soil Type',
      'Irrigation Type',
      'Status',
      'Average Yield (MT/ha)',
      'Date Registered'
    ];

    // CSV rows
    const rows = selectedFarmData.map(farm => [
      farm.name,
      farm.farmerName,
      farm.location.barangay,
      farm.location.municipality,
      farm.location.coordinates.lat,
      farm.location.coordinates.lng,
      farm.size,
      farm.crops.join('; '),
      farm.soilType,
      farm.irrigationType,
      farm.status,
      farm.averageYield || '',
      farm.dateRegistered
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `farms_export_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Show success message
    import('sonner').then(({ toast }) => {
      toast.success(`Exported ${selectedFarms.size} farm${selectedFarms.size !== 1 ? 's' : ''} to CSV`);
    });
  };

  const handleDeleteSelected = () => {
    const farmIds = Array.from(selectedFarms).map(id => parseInt(id));
    bulkDeleteMutation.mutate({ ids: farmIds });
    setSelectedFarms(new Set());
    setShowDeleteDialog(false);
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

      {/* Bulk Action Toolbar */}
      {selectedFarms.size > 0 && (
        <Card className="bg-muted/50 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">
                  {selectedFarms.size} farm{selectedFarms.size !== 1 ? 's' : ''} selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFarms(new Set())}
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Selection
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportSelected}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by farm name or farmer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
        />

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

      {/* Filter Breadcrumb - Shows active filters with individual clear buttons */}
      <FilterBreadcrumb
        searchQuery={searchQuery}
        dateRange={dateRange}
        selectedBarangay={selectedBarangay}
        selectedCrop={selectedCrop}
        selectedStatus={selectedStatus}
        showBackToAnalytics={fromAnalytics}
        onClearSearch={() => setSearchQuery("")}
        onClearDateRange={() => setDateRange(undefined)}
        onClearBarangay={() => setSelectedBarangay("all")}
        onClearCrop={() => setSelectedCrop("all")}
        onClearStatus={() => setSelectedStatus("all")}
        onClearAll={() => {
          setSearchQuery("");
          setDateRange(undefined);
          setSelectedBarangay("all");
          setSelectedCrop("all");
          setSelectedStatus("all");
        }}
      />

      {/* Filter Chips */}
      <FilterChips
        searchQuery={searchQuery}
        dateRange={dateRange}
        selectedBarangay={selectedBarangay}
        selectedCrop={selectedCrop}
        selectedStatus={selectedStatus}
        onClearSearch={() => setSearchQuery("")}
        onClearDateRange={() => setDateRange(undefined)}
        onClearBarangay={() => setSelectedBarangay("all")}
        onClearCrop={() => setSelectedCrop("all")}
        onClearStatus={() => setSelectedStatus("all")}
        onClearAll={() => {
          setSearchQuery("");
          setDateRange(undefined);
          setSelectedBarangay("all");
          setSelectedCrop("all");
          setSelectedStatus("all");
        }}
      />

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
        <div className="space-y-4">
          {/* Select All Checkbox */}
          <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
            <Checkbox
              id="select-all"
              checked={filteredFarms.length > 0 && selectedFarms.size === filteredFarms.length}
              onCheckedChange={handleSelectAll}
            />
            <label
              htmlFor="select-all"
              className="text-sm font-medium cursor-pointer"
            >
              Select all {filteredFarms.length} farm{filteredFarms.length !== 1 ? 's' : ''}
            </label>
          </div>

          {/* Farms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFarms.map((farm) => (
            <Card 
              key={farm.id} 
              className={`hover:shadow-lg transition-all ${
                selectedFarms.has(farm.id) ? 'ring-2 ring-primary bg-primary/5' : ''
              }`}
            >
            <CardHeader>
              <div className="flex items-start justify-between">
                <Checkbox
                  checked={selectedFarms.has(farm.id)}
                  onCheckedChange={() => handleSelectFarm(farm.id)}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    <HighlightText text={farm.name} highlight={searchQuery} />
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      <HighlightText text={farm.farmerName} highlight={searchQuery} />
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
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedFarms.size} farm{selectedFarms.size !== 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected farms and all associated data including boundaries, yields, and cost records.
              {selectedFarms.size <= 5 && (
                <div className="mt-4">
                  <p className="font-medium mb-2">Farms to be deleted:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {filteredFarms
                      .filter(f => selectedFarms.has(f.id))
                      .map(f => (
                        <li key={f.id} className="text-sm">{f.name} - {f.farmerName}</li>
                      ))
                    }
                  </ul>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {selectedFarms.size} Farm{selectedFarms.size !== 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
