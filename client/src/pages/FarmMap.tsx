import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { MapView } from "@/components/Map";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Map as MapIcon, Layers, Filter } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

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
  const clustererRef = useRef<any>(null); // MarkerClusterer instance
  const performanceStartRef = useRef<number>(0);

  // Fetch farms with coordinates (excludes farms without lat/lng)
  // This ensures Map View only shows mappable farms
  const { data: farms, isLoading, error: mapListError } = trpc.farms.mapList.useQuery({});
  
  // Fetch all farms for integrity checks (Dashboard/Analytics count)
  // Note: This is a lightweight query for comparison only, not used for rendering
  const { data: allFarms } = trpc.farms.list.useQuery({});
  
  // Data Quality metrics (consistency check)
  // Note: In production, this will be surfaced in a dedicated Data Quality widget
  // For now, only enabled in development for diagnostics
  const { data: consistencyMetrics } = trpc.farms.consistencyCheck.useQuery(
    undefined,
    { 
      enabled: import.meta.env.DEV, // Only fetch in development
      refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    }
  );
  
  // Debounce filter changes to reduce marker recreation
  const debouncedSelectedCrop = useDebounce(selectedCrop, 300);
  const debouncedSelectedRegion = useDebounce(selectedRegion, 300);
  
  // Integrity checks (non-breaking, logs warnings only)
  // These checks compare Map View data (with coordinates) vs Dashboard/Analytics data (all farms)
  useEffect(() => {
    if (!farms || !allFarms || farms.length === 0 || allFarms.length === 0) return;
    
    // Check 1: Missing coordinate farms
    const mapCount = farms.length;
    const dashboardCount = allFarms.length;
    const missingCoordinateFarms = dashboardCount - mapCount;
    const missingPercentage = dashboardCount > 0 ? (missingCoordinateFarms / dashboardCount) * 100 : 0;
    
    if (missingCoordinateFarms > 0) {
      if (missingPercentage > 5) {
        console.warn(`[MapIntegrity] ${missingCoordinateFarms} farms (${missingPercentage.toFixed(1)}%) missing coordinates. Map shows ${mapCount}, Dashboard shows ${dashboardCount}.`);
      } else {
        console.log(`[MapIntegrity] ${missingCoordinateFarms} farms (${missingPercentage.toFixed(1)}%) missing coordinates - within normal range (<5%).`);
      }
    }
    
    // Check 2: Crop mismatch
    const mapCrops = new Set<string>();
    farms.forEach(farm => {
      try {
        const farmCrops = Array.isArray(farm.crops) ? farm.crops : (typeof farm.crops === 'string' ? JSON.parse(farm.crops) : []);
        if (Array.isArray(farmCrops)) {
          farmCrops.forEach((crop: string) => mapCrops.add(crop));
        }
      } catch (e) {
        // Skip invalid crop data
      }
    });
    
    const dashboardCrops = new Set<string>();
    allFarms.forEach(farm => {
      try {
        const farmCrops = Array.isArray(farm.crops) ? farm.crops : (typeof farm.crops === 'string' ? JSON.parse(farm.crops) : []);
        if (Array.isArray(farmCrops)) {
          farmCrops.forEach((crop: string) => dashboardCrops.add(crop));
        }
      } catch (e) {
        // Skip invalid crop data
      }
    });
    
    const cropDiff = Array.from(dashboardCrops).filter(c => !mapCrops.has(c));
    if (cropDiff.length > 0) {
      console.warn(`[MapIntegrity] Crop type mismatch: ${cropDiff.length} crop types in Dashboard not in Map View (likely due to missing coordinates):`, cropDiff.slice(0, 5));
    }
    
    // Check 3: Region/Barangay mismatch
    const mapBarangays = new Set(farms.map(f => f.barangay).filter(Boolean));
    const dashboardBarangays = new Set(allFarms.map(f => f.barangay).filter(Boolean));
    const barangayDiff = Array.from(dashboardBarangays).filter(b => !mapBarangays.has(b));
    
    if (barangayDiff.length > 0) {
      console.warn(`[MapIntegrity] Barangay mismatch: ${barangayDiff.length} barangays in Dashboard not in Map View (likely due to missing coordinates):`, barangayDiff.slice(0, 5));
    }
    
    const mapMunicipalities = new Set(farms.map(f => f.municipality).filter(Boolean));
    const dashboardMunicipalities = new Set(allFarms.map(f => f.municipality).filter(Boolean));
    const municipalityDiff = Array.from(dashboardMunicipalities).filter(m => !mapMunicipalities.has(m));
    
    if (municipalityDiff.length > 0) {
      console.warn(`[MapIntegrity] Municipality mismatch: ${municipalityDiff.length} municipalities in Dashboard not in Map View (likely due to missing coordinates):`, municipalityDiff);
    }
  }, [farms, allFarms]);

  // Memoize performance percentiles calculation
  const performancePercentiles = useMemo(() => {
    if (!farms || farms.length === 0) return { p25: 0, p75: 0 };
    const allYields = farms.map(f => f.averageYield || 0).filter(y => y > 0);
    if (allYields.length === 0) return { p25: 0, p75: 0 };
    const sorted = [...allYields].sort((a, b) => a - b);
    return {
      p25: sorted[Math.floor(sorted.length * 0.25)],
      p75: sorted[Math.floor(sorted.length * 0.75)],
    };
  }, [farms]);

  // Calculate performance level (optimized to use pre-calculated percentiles)
  const calculatePerformanceLevel = useCallback((yield_: number, percentiles: { p25: number; p75: number }) => {
    if (yield_ >= percentiles.p75) return "high";
    if (yield_ >= percentiles.p25) return "medium";
    return "low";
  }, []);

  // Filter farms based on selected filters (using debounced values)
  // Memoize to avoid recalculating on every render
  const filteredFarms = useMemo(() => {
    if (!farms) return [];
    
    return farms.filter((farm) => {
      if (debouncedSelectedCrop !== "all" && !farm.crops.includes(debouncedSelectedCrop)) {
        return false;
      }
      
      if (debouncedSelectedRegion !== "all") {
        if (debouncedSelectedRegion === "bacolod" && farm.municipality !== "Bacolod City") {
          return false;
        }
        if (debouncedSelectedRegion === "laguna" && farm.municipality === "Bacolod City") {
          return false;
        }
      }
      
      return true;
    });
  }, [farms, debouncedSelectedCrop, debouncedSelectedRegion]);

  // Get marker color based on color mode (memoized)
  const getMarkerColor = useCallback((farm: Farm) => {
    if (colorMode === "crop") {
      // Use primary crop color
      const primaryCrop = farm.crops[0] || "Rice";
      return CROP_COLORS[primaryCrop] || "#6b7280"; // gray-500 default
    } else {
      // Performance-based color
      const level = calculatePerformanceLevel(farm.averageYield || 0, performancePercentiles);
      return PERFORMANCE_COLORS[level];
    }
  }, [colorMode, performancePercentiles, calculatePerformanceLevel]);

  // Create markers when farms or filters change (with performance optimization)
  useEffect(() => {
    if (!mapInstance || !filteredFarms.length) {
      // Clear markers if no farms
      if (markers.length > 0) {
        markers.forEach(marker => marker.setMap(null));
        setMarkers([]);
      }
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
        clustererRef.current = null;
      }
      return;
    }

    performanceStartRef.current = performance.now();

    // Clear existing markers and clusterer
    markers.forEach(marker => marker.setMap(null));
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
      clustererRef.current = null;
    }

    // Create info window if not exists
    let iw = infoWindow;
    if (!iw) {
      iw = new google.maps.InfoWindow();
      setInfoWindow(iw);
    }

    // Helper to validate coordinates
    const isValidCoordinate = (lat?: number | string | null, lng?: number | string | null): boolean => {
      const latNum = typeof lat === 'string' ? parseFloat(lat) : lat;
      const lngNum = typeof lng === 'string' ? parseFloat(lng) : lng;
      return typeof latNum === "number" && typeof lngNum === "number" &&
             !Number.isNaN(latNum) && !Number.isNaN(lngNum) &&
             latNum !== 0 && lngNum !== 0 &&
             latNum >= -90 && latNum <= 90 &&
             lngNum >= -180 && lngNum <= 180;
    };
    
    // Create new markers (optimized: batch creation)
    const newMarkers: google.maps.Marker[] = [];
    
    // For large datasets (>1000 markers), use simplified rendering
    const useSimplifiedMarkers = filteredFarms.length > 1000;
    
    for (const farm of filteredFarms) {
      // Skip farms with invalid coordinates (defensive check)
      // QA: Log farm ID only (no coordinates) to keep logs PII-safe
      if (!isValidCoordinate(farm.latitude, farm.longitude)) {
        console.warn(`[FarmMap] Skipping farm ${farm.id} with invalid coordinates`);
        continue;
      }
      
      const marker = new google.maps.Marker({
        position: { lat: Number(farm.latitude), lng: Number(farm.longitude) },
        map: null, // Don't attach to map yet (will be handled by clusterer)
        title: farm.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: useSimplifiedMarkers ? 6 : 8, // Smaller markers for large datasets
          fillColor: getMarkerColor(farm as Farm),
          fillOpacity: 0.9,
          strokeColor: "#ffffff",
          strokeWeight: useSimplifiedMarkers ? 1 : 2,
        },
        optimized: true, // Use optimized rendering
      });

      // Add click listener for info window
      marker.addListener("click", () => {
        const content = `
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">${farm.name}</h3>
            <p style="margin: 4px 0;"><strong>Farmer:</strong> ${farm.farmerName}</p>
            <p style="margin: 4px 0;"><strong>Location:</strong> ${farm.barangay}, ${farm.municipality}</p>
            <p style="margin: 4px 0;"><strong>Size:</strong> ${farm.size} ha</p>
            <p style="margin: 4px 0;"><strong>Crops:</strong> ${Array.isArray(farm.crops) ? farm.crops.join(", ") : String(farm.crops || "")}</p>
            <p style="margin: 4px 0;"><strong>Avg Yield:</strong> ${farm.averageYield ? Number(farm.averageYield).toFixed(2) : "N/A"} t/ha</p>
          </div>
        `;
        iw?.setContent(content);
        iw?.open(mapInstance, marker);
      });

      newMarkers.push(marker);
    }

    setMarkers(newMarkers);

    // Use MarkerClusterer for better performance with many markers
    // For now, we'll use a simple approach: only show markers in viewport
    // In production, you'd use @googlemaps/markerclusterer library
    if (newMarkers.length > 100) {
      // For >100 markers, implement viewport-based rendering
      // This is a simplified version - full clustering would require the library
      const bounds = mapInstance.getBounds();
      if (bounds) {
        // Only show markers in current viewport
        const visibleMarkers = newMarkers.filter(marker => {
          const pos = marker.getPosition();
          return pos && bounds.contains(pos);
        });
        visibleMarkers.forEach(marker => marker.setMap(mapInstance));
        
        // Listen to map bounds changes to update visible markers
        const boundsListener = google.maps.event.addListener(mapInstance, 'bounds_changed', () => {
          const newBounds = mapInstance.getBounds();
          if (newBounds) {
            newMarkers.forEach(marker => {
              const pos = marker.getPosition();
              if (pos) {
                marker.setMap(newBounds.contains(pos) ? mapInstance : null);
              }
            });
          }
        });
        
        // Store listener for cleanup
        (mapInstance as any)._boundsListener = boundsListener;
      } else {
        // If bounds not available, show all markers
        newMarkers.forEach(marker => marker.setMap(mapInstance));
      }
    } else {
      // For <=100 markers, show all
      newMarkers.forEach(marker => marker.setMap(mapInstance));
    }

    // Fit bounds to show all markers (only if reasonable number)
    if (newMarkers.length > 0 && newMarkers.length <= 500) {
      const bounds = new google.maps.LatLngBounds();
      newMarkers.forEach(marker => {
        const pos = marker.getPosition();
        if (pos) bounds.extend(pos);
      });
      mapInstance.fitBounds(bounds);
    }

    const duration = performance.now() - performanceStartRef.current;
    // QA: Performance logging for monitoring (only logs if > 100ms to avoid noise)
    if (duration > 100) {
      console.log(`[FarmMap] Marker rendering took ${duration.toFixed(2)}ms for ${newMarkers.length} markers`);
    }
  }, [mapInstance, filteredFarms, colorMode, getMarkerColor, infoWindow, markers]);

  // Get unique crops for filter (memoized)
  const uniqueCrops = useMemo(() => {
    if (!farms) return [];
    const crops = new Set<string>();
    farms.forEach(farm => {
      const farmCrops = Array.isArray(farm.crops) ? farm.crops : (typeof farm.crops === 'string' ? JSON.parse(farm.crops) : []);
      farmCrops.forEach((crop: string) => crops.add(crop));
    });
    return Array.from(crops).sort();
  }, [farms]);

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

      {/* Error Display */}
      {mapListError && (
        <div className="container mx-auto px-4 py-4">
          <Card className="p-4 bg-red-50 border-red-200">
            <h3 className="font-semibold mb-2 text-red-900">Unable to Load Map Data</h3>
            <p className="text-sm text-red-700">{mapListError.message || "An error occurred while loading map data. Please try again later."}</p>
          </Card>
        </div>
      )}

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

      {/* Data Quality Panel (Development Only) */}
      {import.meta.env.DEV && consistencyMetrics && (
        <div className="container mx-auto px-4 py-4">
          <Card className="p-4 bg-blue-50 border-blue-200">
            <h3 className="font-semibold mb-3 text-blue-900">Data Quality Metrics (Dev Only)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Farms</p>
                <p className="font-bold">{consistencyMetrics.totalFarms}</p>
              </div>
              <div>
                <p className="text-muted-foreground">With Coordinates</p>
                <p className="font-bold">{consistencyMetrics.farmsWithCoordinates}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Missing Coords</p>
                <p className={`font-bold ${consistencyMetrics.missingCoordinatePercentage > 10 ? 'text-red-600' : 'text-green-600'}`}>
                  {consistencyMetrics.missingCoordinateCount} ({consistencyMetrics.missingCoordinatePercentage}%)
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Distinct Crops</p>
                <p className="font-bold">{consistencyMetrics.distinctCropsTotal} / {consistencyMetrics.distinctCropsWithCoordinates}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Distinct Barangays</p>
                <p className="font-bold">{consistencyMetrics.distinctBarangaysTotal} / {consistencyMetrics.distinctBarangaysWithCoordinates}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              In production, these metrics will be available in a dedicated Data Quality widget.
            </p>
          </Card>
        </div>
      )}

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
                initialCenter={{ lat: 14.5995, lng: 120.9842 }}
                initialZoom={10}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
