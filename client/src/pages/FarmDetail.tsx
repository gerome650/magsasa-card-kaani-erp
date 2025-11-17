import { useRoute, Link } from "wouter";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  MapPin,
  User,
  Calendar,
  TrendingUp,
  Droplets,
  Mountain,
  Edit,
} from "lucide-react";
import { getFarmById } from "@/data/farmsData";
import { MapView } from "@/components/Map";

export default function FarmDetail() {
  const [, params] = useRoute("/farms/:id");
  const farm = params?.id ? getFarmById(params.id) : null;
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawnBoundary, setDrawnBoundary] = useState<google.maps.Polygon | null>(null);
  const [calculatedArea, setCalculatedArea] = useState<number | null>(null);

  if (!farm) {
    return (
      <div className="space-y-6">
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Farm not found</p>
          <Link href="/farms">
            <Button className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Farms
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

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
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/farms">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Farms
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{farm.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge className={getStatusColor(farm.status)}>{farm.status}</Badge>
            <Badge className={getIrrigationColor(farm.irrigationType)}>
              {farm.irrigationType}
            </Badge>
          </div>
        </div>
        <Button>
          <Edit className="w-4 h-4 mr-2" />
          Edit Farm
        </Button>
      </div>

      {/* Farm Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Farm Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Farm ID</p>
                  <p className="font-semibold">{farm.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Size</p>
                  <p className="font-semibold">{farm.size} hectares</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Soil Type</p>
                  <p className="font-semibold">{farm.soilType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Irrigation</p>
                  <p className="font-semibold">{farm.irrigationType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date Registered</p>
                  <p className="font-semibold">{formatDate(farm.dateRegistered)}</p>
                </div>
                {farm.lastHarvest && (
                  <div>
                    <p className="text-sm text-muted-foreground">Last Harvest</p>
                    <p className="font-semibold">{formatDate(farm.lastHarvest)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Location Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-semibold">
                  Barangay {farm.location.barangay}, {farm.location.municipality}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Coordinates</p>
                <p className="text-sm">
                  Latitude: {farm.location.coordinates.lat.toFixed(6)}
                </p>
                <p className="text-sm">
                  Longitude: {farm.location.coordinates.lng.toFixed(6)}
                </p>
              </div>

              {/* Map with Drawing Tools */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Farm Location & Boundary</h4>
                  <div className="flex gap-2">
                    <Button
                      variant={isDrawingMode ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsDrawingMode(!isDrawingMode)}
                    >
                      {isDrawingMode ? "Stop Drawing" : "Draw Boundary"}
                    </Button>
                    {drawnBoundary && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            if (drawnBoundary) {
                              const path = drawnBoundary.getPath();
                              const coordinates: { lat: number; lng: number }[] = [];
                              for (let i = 0; i < path.getLength(); i++) {
                                const point = path.getAt(i);
                                coordinates.push({
                                  lat: point.lat(),
                                  lng: point.lng()
                                });
                              }
                              // TODO: Save to backend
                              console.log('Saving boundary:', coordinates);
                              alert(`Boundary saved! Area: ${calculatedArea?.toFixed(2)} hectares`);
                            }
                          }}
                        >
                          Save Boundary
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (drawnBoundary) {
                              drawnBoundary.setMap(null);
                              setDrawnBoundary(null);
                              setCalculatedArea(null);
                            }
                          }}
                        >
                          Clear Boundary
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {calculatedArea && (
                  <div className="text-sm text-muted-foreground">
                    Calculated Area: <strong>{calculatedArea.toFixed(2)} hectares</strong>
                  </div>
                )}
                <div className="h-96 rounded-lg overflow-hidden border">
                  <MapView
                    onMapReady={(map, google) => {
                      // Center map on farm location
                      const position = {
                        lat: farm.location.coordinates.lat,
                        lng: farm.location.coordinates.lng,
                      };
                      map.setCenter(position);
                      map.setZoom(15);

                      // Add marker for farm
                      new google.maps.Marker({
                        position,
                        map,
                        title: farm.name,
                      });

                      // Display existing boundary if available
                      if (farm.boundary && farm.boundary.length > 0) {
                        const existingBoundary = new google.maps.Polygon({
                          paths: farm.boundary,
                          fillColor: '#22c55e',
                          fillOpacity: 0.3,
                          strokeWeight: 2,
                          strokeColor: '#16a34a',
                          editable: true,
                          draggable: true,
                          map,
                        });
                        setDrawnBoundary(existingBoundary);
                        
                        // Calculate and display existing area
                        const area = google.maps.geometry.spherical.computeArea(existingBoundary.getPath());
                        setCalculatedArea(area / 10000);

                        // Update area on edit
                        google.maps.event.addListener(existingBoundary.getPath(), 'set_at', () => {
                          const newArea = google.maps.geometry.spherical.computeArea(existingBoundary.getPath());
                          setCalculatedArea(newArea / 10000);
                        });
                        google.maps.event.addListener(existingBoundary.getPath(), 'insert_at', () => {
                          const newArea = google.maps.geometry.spherical.computeArea(existingBoundary.getPath());
                          setCalculatedArea(newArea / 10000);
                        });
                      }

                      // Initialize Drawing Manager
                      const drawingManager = new google.maps.drawing.DrawingManager({
                        drawingMode: null,
                        drawingControl: false,
                        polygonOptions: {
                          fillColor: '#22c55e',
                          fillOpacity: 0.3,
                          strokeWeight: 2,
                          strokeColor: '#16a34a',
                          editable: true,
                          draggable: true,
                        },
                      });
                      drawingManager.setMap(map);

                      // Toggle drawing mode
                      const checkDrawingMode = setInterval(() => {
                        if (isDrawingMode && !drawnBoundary) {
                          drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
                        } else {
                          drawingManager.setDrawingMode(null);
                        }
                      }, 100);

                      // Handle polygon complete
                      google.maps.event.addListener(drawingManager, 'polygoncomplete', (polygon: google.maps.Polygon) => {
                        setDrawnBoundary(polygon);
                        setIsDrawingMode(false);
                        
                        // Calculate area
                        const area = google.maps.geometry.spherical.computeArea(polygon.getPath());
                        const hectares = area / 10000; // Convert m² to hectares
                        setCalculatedArea(hectares);

                        // Update area on edit
                        google.maps.event.addListener(polygon.getPath(), 'set_at', () => {
                          const newArea = google.maps.geometry.spherical.computeArea(polygon.getPath());
                          setCalculatedArea(newArea / 10000);
                        });
                        google.maps.event.addListener(polygon.getPath(), 'insert_at', () => {
                          const newArea = google.maps.geometry.spherical.computeArea(polygon.getPath());
                          setCalculatedArea(newArea / 10000);
                        });
                      });

                      return () => clearInterval(checkDrawingMode);
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Crops Card */}
          <Card>
            <CardHeader>
              <CardTitle>Crops</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {farm.crops.map((crop) => (
                  <Badge key={crop} variant="outline" className="text-sm">
                    {crop}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Farmer Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Farmer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/farmers/${farm.farmerId}`}>
                <div className="hover:bg-gray-50 p-3 rounded-lg transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-lg font-bold text-green-600">
                        {farm.farmerName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">{farm.farmerName}</p>
                      <p className="text-xs text-muted-foreground">
                        View Profile →
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Production Stats */}
          {farm.averageYield && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Production
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Average Yield</p>
                  <p className="text-2xl font-bold text-green-600">
                    {farm.averageYield} MT/ha
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Production
                  </p>
                  <p className="text-xl font-semibold">
                    {(farm.averageYield * farm.size).toFixed(1)} MT
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Mountain className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>{farm.soilType}</strong> soil
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>{farm.irrigationType}</strong> irrigation
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  Registered {formatDate(farm.dateRegistered)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
