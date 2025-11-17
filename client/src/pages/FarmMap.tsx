import { useState, useEffect } from "react";
import { MapView } from "@/components/Map";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Map as MapIcon, Layers, Filter } from "lucide-react";

type ColorMode = "crop" | "performance";

interface Farm {
  id: number;
  name: string;
  farmerName: string;
  latitude: number;
  longitude: number;
  crops: string[];
  size: number;
  municipality: string;
  barangay: string;
  averageYield: number;
}

// Color palettes
const CROP_COLORS: Record<string, string> = {
  Rice: "#10b981", // green-500
  Corn: "#f59e0b", // amber-500
  Vegetables: "#22c55e", // green-500
  Sugarcane: "#a855f7", // purple-500
  Coconut: "#8b5cf6", // violet-500
  Banana: "#eab308", // yellow-500
  Cassava: "#f97316", // orange-500
};

const PERFORMANCE_COLORS = {
  high: "#10b981", // green-500 (>75th percentile)
  medium: "#eab308", // yellow-500 (25th-75th percentile)
  low: "#ef4444", // red-500 (<25th percentile)
};

export default function FarmMap() {
  const [colorMode, setColorMode] = useState<ColorMode>("crop");
  const [selectedCrop, setSelectedCrop] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null);

  // Fetch all farms
  const { data: farms, isLoading } = trpc.farms.list.useQuery({});

  // Calculate performance percentiles
  const calculatePerformanceLevel = (yield_: number, allYields: number[]) => {
    const sorted = [...allYields].sort((a, b) => a - b);
    const p25 = sorted[Math.floor(sorted.length * 0.25)];
    const p75 = sorted[Math.floor(sorted.length * 0.75)];
    
    if (yield_ >= p75) return "high";
    if (yield_ >= p25) return "medium";
    return "low";
  };

  // Filter farms based on selected filters
  const filteredFarms = farms?.filter((farm) => {
    if (selectedCrop !== "all" && !farm.crops.includes(selectedCrop)) {
      return false;
    }
    
    if (selectedRegion !== "all") {
      if (selectedRegion === "bacolod" && farm.municipality !== "Bacolod City") {
        return false;
      }
      if (selectedRegion === "laguna" && farm.municipality === "Bacolod City") {
        return false;
      }
    }
    
    return true;
  }) || [];

  // Get marker color based on color mode
  const getMarkerColor = (farm: Farm) => {
    if (colorMode === "crop") {
      // Use primary crop color
      const primaryCrop = farm.crops[0] || "Rice";
      return CROP_COLORS[primaryCrop] || "#6b7280"; // gray-500 default
    } else {
      // Performance-based color
      const allYields = farms?.map(f => f.averageYield || 0) || [];
      const level = calculatePerformanceLevel(farm.averageYield || 0, allYields);
      return PERFORMANCE_COLORS[level];
    }
  };

  // Create markers when farms or filters change
  useEffect(() => {
    if (!mapInstance || !filteredFarms.length) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));

    // Create info window if not exists
    let iw = infoWindow;
    if (!iw) {
      iw = new google.maps.InfoWindow();
      setInfoWindow(iw);
    }

    // Create new markers
    const newMarkers = filteredFarms.map((farm) => {
      const marker = new google.maps.Marker({
        position: { lat: farm.latitude, lng: farm.longitude },
        map: mapInstance,
        title: farm.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: getMarkerColor(farm),
          fillOpacity: 0.9,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      // Add click listener for info window
      marker.addListener("click", () => {
        const content = `
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">${farm.name}</h3>
            <p style="margin: 4px 0;"><strong>Farmer:</strong> ${farm.farmerName}</p>
            <p style="margin: 4px 0;"><strong>Location:</strong> ${farm.barangay}, ${farm.municipality}</p>
            <p style="margin: 4px 0;"><strong>Size:</strong> ${farm.size} ha</p>
            <p style="margin: 4px 0;"><strong>Crops:</strong> ${farm.crops.join(", ")}</p>
            <p style="margin: 4px 0;"><strong>Avg Yield:</strong> ${farm.averageYield?.toFixed(2) || "N/A"} t/ha</p>
          </div>
        `;
        iw?.setContent(content);
        iw?.open(mapInstance, marker);
      });

      return marker;
    });

    setMarkers(newMarkers);

    // Fit bounds to show all markers
    if (newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      newMarkers.forEach(marker => {
        const pos = marker.getPosition();
        if (pos) bounds.extend(pos);
      });
      mapInstance.fitBounds(bounds);
    }
  }, [mapInstance, filteredFarms, colorMode]);

  // Get unique crops for filter
  const uniqueCrops = Array.from(
    new Set(farms?.flatMap(f => f.crops) || [])
  ).sort();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <MapIcon className="w-8 h-8 text-primary" />
                Farm Map View
              </h1>
              <p className="text-muted-foreground mt-1">
                Geographic visualization of all {filteredFarms.length} farms
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Color Mode Toggle */}
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Color by:</span>
              <div className="flex gap-1">
                <Button
                  variant={colorMode === "crop" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setColorMode("crop")}
                >
                  Crop Type
                </Button>
                <Button
                  variant={colorMode === "performance" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setColorMode("performance")}
                >
                  Performance
                </Button>
              </div>
            </div>

            {/* Crop Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by crop" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Crops</SelectItem>
                  {uniqueCrops.map(crop => (
                    <SelectItem key={crop} value={crop}>{crop}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Region Filter */}
            <div className="flex items-center gap-2">
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="bacolod">Bacolod</SelectItem>
                  <SelectItem value="laguna">Laguna</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Farm Count Badge */}
            <Badge variant="secondary" className="ml-auto">
              {filteredFarms.length} farms
            </Badge>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="container mx-auto px-4 py-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Legend</h3>
          <div className="flex flex-wrap gap-4">
            {colorMode === "crop" ? (
              // Crop legend
              Object.entries(CROP_COLORS).map(([crop, color]) => (
                <div key={crop} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm">{crop}</span>
                </div>
              ))
            ) : (
              // Performance legend
              <>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white"
                    style={{ backgroundColor: PERFORMANCE_COLORS.high }}
                  />
                  <span className="text-sm">High Performance (&gt;75th percentile)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white"
                    style={{ backgroundColor: PERFORMANCE_COLORS.medium }}
                  />
                  <span className="text-sm">Medium Performance (25th-75th)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white"
                    style={{ backgroundColor: PERFORMANCE_COLORS.low }}
                  />
                  <span className="text-sm">Low Performance (&lt;25th percentile)</span>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Map Container */}
      <div className="container mx-auto px-4 pb-8">
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="h-[600px] flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="h-[600px] relative">
              <MapView
                onMapReady={(map) => setMapInstance(map)}
                intent="navigational"
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
