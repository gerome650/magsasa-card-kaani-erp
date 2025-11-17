import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, Check, MapPin, Tractor } from "lucide-react";
import { MapView } from "@/components/Map";

type FormData = {
  name: string;
  farmerName: string;
  barangay: string;
  municipality: string;
  latitude: number;
  longitude: number;
  size: number;
  crops: string[];
  soilType: string;
  irrigationType: "Irrigated" | "Rainfed" | "Upland";
  status: "active" | "inactive" | "fallow";
};

const CROP_OPTIONS = [
  "Palay (Rice)",
  "Corn",
  "Tomato",
  "Eggplant",
  "Okra",
  "Banana",
  "Cassava",
  "Sweet Potato",
  "Vegetables",
  "Other",
];

const MUNICIPALITIES = [
  "Calauan",
  "Cavinti",
  "Famy",
  "Kalayaan",
  "Liliw",
  "Luisiana",
  "Lumban",
  "Mabitac",
  "Magdalena",
  "Majayjay",
  "Nagcarlan",
  "Paete",
  "Pagsanjan",
  "Pakil",
  "Pangil",
  "Pila",
  "Rizal",
  "San Pablo City",
  "Santa Cruz",
  "Santa Maria",
  "Siniloan",
  "Victoria",
];

export default function FarmNew() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    farmerName: "",
    barangay: "",
    municipality: "Calauan",
    latitude: 14.1475,
    longitude: 121.3189,
    size: 0,
    crops: [],
    soilType: "Loam",
    irrigationType: "Irrigated",
    status: "active",
  });

  const [drawnBoundaries, setDrawnBoundaries] = useState<google.maps.Polygon[]>([]);
  const [calculatedArea, setCalculatedArea] = useState<number>(0);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null);

  const utils = trpc.useContext();
  
  const createFarmMutation = trpc.farms.create.useMutation({
    onMutate: async (newFarm) => {
      // Cancel any outgoing refetches to prevent overwriting optimistic update
      await utils.farms.list.cancel();
      
      // Snapshot the previous value
      const previousFarms = utils.farms.list.getData();
      
      // Optimistically update the cache with the new farm
      const optimisticFarm = {
        id: Date.now(), // Temporary ID
        name: newFarm.name,
        farmerName: newFarm.farmerName,
        barangay: newFarm.barangay,
        municipality: newFarm.municipality,
        latitude: newFarm.latitude,
        longitude: newFarm.longitude,
        size: newFarm.size.toString(),
        crops: JSON.stringify(newFarm.crops),
        soilType: newFarm.soilType,
        irrigationType: newFarm.irrigationType,
        status: newFarm.status,
        registrationDate: new Date().toISOString(),
        userId: 0, // Will be set by server
        averageYield: null,
      };
      
      utils.farms.list.setData(undefined, (old) => {
        return old ? [...old, optimisticFarm] : [optimisticFarm];
      });
      
      // Show optimistic toast
      toast.success("Creating farm...", { duration: 1000 });
      
      // Return context with snapshot
      return { previousFarms };
    },
    onSuccess: (data) => {
      toast.success("Farm created successfully!");
      // Invalidate to refetch with real data from server
      utils.farms.list.invalidate();
      navigate(`/farms/${data.farmId}`);
    },
    onError: (error, newFarm, context) => {
      // Rollback to previous state on error
      if (context?.previousFarms) {
        utils.farms.list.setData(undefined, context.previousFarms);
      }
      toast.error(`Failed to create farm: ${error.message}`);
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      utils.farms.list.invalidate();
    },
  });

  const saveBoundariesMutation = trpc.boundaries.save.useMutation({
    onMutate: () => {
      toast.success("Saving boundaries...", { duration: 1000 });
    },
    onSuccess: () => {
      toast.success("Boundaries saved successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to save boundaries: ${error.message}`);
    },
  });

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCrop = (crop: string) => {
    setFormData((prev) => ({
      ...prev,
      crops: prev.crops.includes(crop)
        ? prev.crops.filter((c) => c !== crop)
        : [...prev.crops, crop],
    }));
  };

  const calculatePolygonArea = (polygon: google.maps.Polygon) => {
    const path = polygon.getPath();
    const area = google.maps.geometry.spherical.computeArea(path);
    return area / 10000; // Convert to hectares
  };

  const handleMapReady = (map: google.maps.Map) => {
    setMapInstance(map);

    // Initialize DrawingManager
    const manager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [google.maps.drawing.OverlayType.POLYGON],
      },
      polygonOptions: {
        fillColor: "#10b981",
        fillOpacity: 0.3,
        strokeWeight: 2,
        strokeColor: "#059669",
        clickable: true,
        editable: true,
        zIndex: 1,
      },
    });

    manager.setMap(map);
    setDrawingManager(manager);

    // Listen for polygon complete
    google.maps.event.addListener(manager, "overlaycomplete", (event: any) => {
      if (event.type === google.maps.drawing.OverlayType.POLYGON) {
        const polygon = event.overlay as google.maps.Polygon;
        setDrawnBoundaries((prev) => [...prev, polygon]);

        // Calculate area
        const area = calculatePolygonArea(polygon);
        setCalculatedArea((prev) => prev + area);

        // Update form data with calculated size
        updateFormData("size", calculatedArea + area);

        // Disable drawing mode after completing a polygon
        manager.setDrawingMode(null);

        // Listen for polygon edits
        google.maps.event.addListener(polygon.getPath(), "set_at", () => {
          recalculateAllAreas();
        });
        google.maps.event.addListener(polygon.getPath(), "insert_at", () => {
          recalculateAllAreas();
        });
      }
    });
  };

  const recalculateAllAreas = () => {
    let totalArea = 0;
    drawnBoundaries.forEach((polygon) => {
      totalArea += calculatePolygonArea(polygon);
    });
    setCalculatedArea(totalArea);
    updateFormData("size", totalArea);
  };

  const clearBoundaries = () => {
    drawnBoundaries.forEach((polygon) => polygon.setMap(null));
    setDrawnBoundaries([]);
    setCalculatedArea(0);
    updateFormData("size", 0);
  };

  const enableDrawing = () => {
    if (drawingManager) {
      drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.name || !formData.farmerName || !formData.barangay) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.crops.length === 0) {
      toast.error("Please select at least one crop");
      return;
    }

    if (formData.size === 0) {
      toast.error("Please draw farm boundaries on the map");
      return;
    }

    try {
      // Create farm
      const result = await createFarmMutation.mutateAsync({
        name: formData.name,
        farmerName: formData.farmerName,
        barangay: formData.barangay,
        municipality: formData.municipality,
        latitude: formData.latitude.toString(),
        longitude: formData.longitude.toString(),
        size: formData.size,
        crops: formData.crops,
        soilType: formData.soilType,
        irrigationType: formData.irrigationType,
        status: formData.status,
      });

      // Save boundaries if any were drawn
      if (drawnBoundaries.length > 0) {
        const boundariesData = drawnBoundaries.map((polygon, index) => {
          const path = polygon.getPath();
          const coordinates = [];
          for (let i = 0; i < path.getLength(); i++) {
            const point = path.getAt(i);
            coordinates.push([point.lng(), point.lat()]);
          }
          // Close the polygon
          coordinates.push(coordinates[0]);

          const geoJson = JSON.stringify({
            type: "Polygon",
            coordinates: [coordinates],
          });

          return {
            parcelIndex: index,
            geoJson,
            area: calculatePolygonArea(polygon),
          };
        });

        await saveBoundariesMutation.mutateAsync({
          farmId: result.farmId,
          boundaries: boundariesData,
        });
      }
    } catch (error) {
      console.error("Error creating farm:", error);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.name && formData.farmerName && formData.barangay;
      case 2:
        return formData.crops.length > 0;
      case 3:
        return drawnBoundaries.length > 0;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/farms")}
            className="mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Farms
          </Button>
          <h1 className="text-3xl font-bold">Register New Farm</h1>
          <p className="text-muted-foreground mt-1">
            Complete the form to register a new farm in the system
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                s < step
                  ? "bg-green-600 text-white"
                  : s === step
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {s < step ? <Check className="w-5 h-5" /> : s}
            </div>
            {s < 3 && (
              <div
                className={`w-24 h-1 ${
                  s < step ? "bg-green-600" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1 && "Basic Information"}
            {step === 2 && "Farm Characteristics"}
            {step === 3 && "Farm Boundaries"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Enter the basic details of the farm"}
            {step === 2 && "Specify the crops and farm characteristics"}
            {step === 3 && "Draw the farm boundaries on the map"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Farm Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Santos Rice Farm"
                    value={formData.name}
                    onChange={(e) => updateFormData("name", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="farmerName">
                    Farmer Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="farmerName"
                    placeholder="e.g., Maria Santos"
                    value={formData.farmerName}
                    onChange={(e) => updateFormData("farmerName", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="barangay">
                    Barangay <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="barangay"
                    placeholder="e.g., San Isidro"
                    value={formData.barangay}
                    onChange={(e) => updateFormData("barangay", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="municipality">Municipality</Label>
                  <Select
                    value={formData.municipality}
                    onValueChange={(value) => updateFormData("municipality", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MUNICIPALITIES.map((muni) => (
                        <SelectItem key={muni} value={muni}>
                          {muni}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.000001"
                    value={formData.latitude}
                    onChange={(e) =>
                      updateFormData("latitude", parseFloat(e.target.value))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.000001"
                    value={formData.longitude}
                    onChange={(e) =>
                      updateFormData("longitude", parseFloat(e.target.value))
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Farm Characteristics */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <Label className="mb-3 block">
                  Crops <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {CROP_OPTIONS.map((crop) => (
                    <div key={crop} className="flex items-center space-x-2">
                      <Checkbox
                        id={crop}
                        checked={formData.crops.includes(crop)}
                        onCheckedChange={() => toggleCrop(crop)}
                      />
                      <label
                        htmlFor={crop}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {crop}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="soilType">Soil Type</Label>
                  <Select
                    value={formData.soilType}
                    onValueChange={(value) => updateFormData("soilType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Clay">Clay</SelectItem>
                      <SelectItem value="Clay Loam">Clay Loam</SelectItem>
                      <SelectItem value="Loam">Loam</SelectItem>
                      <SelectItem value="Sandy Loam">Sandy Loam</SelectItem>
                      <SelectItem value="Sandy">Sandy</SelectItem>
                      <SelectItem value="Silt">Silt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="irrigationType">Irrigation Type</Label>
                  <Select
                    value={formData.irrigationType}
                    onValueChange={(value: any) =>
                      updateFormData("irrigationType", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Irrigated">Irrigated</SelectItem>
                      <SelectItem value="Rainfed">Rainfed</SelectItem>
                      <SelectItem value="Upland">Upland</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Map Boundaries */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Use the drawing tools to mark your farm boundaries on the map
                  </p>
                  {calculatedArea > 0 && (
                    <p className="text-sm font-semibold text-green-600 mt-1">
                      Total Area: {calculatedArea.toFixed(2)} hectares
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={enableDrawing}
                    disabled={!mapInstance}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Draw Boundary
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearBoundaries}
                    disabled={drawnBoundaries.length === 0}
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden" style={{ height: "500px" }}>
                <MapView
                  onMapReady={handleMapReady}
                  center={{ lat: formData.latitude, lng: formData.longitude }}
                  zoom={15}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">
                  Drawing Instructions:
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Click "Draw Boundary" to start drawing</li>
                  <li>• Click on the map to add points for your farm boundary</li>
                  <li>• Complete the polygon by clicking the first point again</li>
                  <li>• You can draw multiple parcels for non-contiguous farms</li>
                  <li>• Drag the points to adjust the boundary after drawing</li>
                </ul>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {step < 3 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || createFarmMutation.isPending}
              >
                {createFarmMutation.isPending ? (
                  <>Creating...</>
                ) : (
                  <>
                    <Tractor className="w-4 h-4 mr-2" />
                    Create Farm
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
