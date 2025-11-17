import { useRoute, Link } from "wouter";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  MapPin,
  User,
  Calendar,
  TrendingUp,
  Droplets,
  Mountain,
  Edit,
  Map as MapIcon,
  Satellite,
  Layers,
  X,
  Ruler,
} from "lucide-react";
import { getFarmById } from "@/data/farmsData";
import { MapView } from "@/components/Map";

export default function FarmDetail() {
  const [, params] = useRoute("/farms/:id");
  const farm = params?.id ? getFarmById(params.id) : null;
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawnBoundaries, setDrawnBoundaries] = useState<google.maps.Polygon[]>([]);
  const [parcelAreas, setParcelAreas] = useState<number[]>([]);
  const [calculatedArea, setCalculatedArea] = useState<number | null>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap');
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [terrainEnabled, setTerrainEnabled] = useState(false);
  const [terrainLayer, setTerrainLayer] = useState<google.maps.ImageMapType | null>(null);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurementMarkers, setMeasurementMarkers] = useState<google.maps.Marker[]>([]);
  const [measurementLine, setMeasurementLine] = useState<google.maps.Polyline | null>(null);
  const [measuredDistance, setMeasuredDistance] = useState<number | null>(null);

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
                    <input
                      type="file"
                      id="boundary-upload"
                      accept=".kml,.geojson,.json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            try {
                              const content = event.target?.result as string;
                              let coordinates: { lat: number; lng: number }[] = [];

                              if (file.name.endsWith('.geojson') || file.name.endsWith('.json')) {
                                // Parse GeoJSON
                                const geojson = JSON.parse(content);
                                if (geojson.type === 'FeatureCollection' && geojson.features?.[0]) {
                                  const coords = geojson.features[0].geometry.coordinates[0];
                                  coordinates = coords.map((c: number[]) => ({ lng: c[0], lat: c[1] }));
                                } else if (geojson.type === 'Feature') {
                                  const coords = geojson.geometry.coordinates[0];
                                  coordinates = coords.map((c: number[]) => ({ lng: c[0], lat: c[1] }));
                                }
                              } else if (file.name.endsWith('.kml')) {
                                // Parse KML
                                const parser = new DOMParser();
                                const xmlDoc = parser.parseFromString(content, 'text/xml');
                                const coordsText = xmlDoc.querySelector('coordinates')?.textContent?.trim();
                                if (coordsText) {
                                  coordinates = coordsText.split(/\s+/).map(coord => {
                                    const [lng, lat] = coord.split(',').map(Number);
                                    return { lat, lng };
                                  });
                                }
                              }

                              if (coordinates.length > 0) {
                                // Store for later use when map is ready
                                (window as any).pendingBoundaryCoordinates = coordinates;
                                alert(`Successfully imported ${coordinates.length} coordinates from ${file.name}`);
                                // Trigger page reload to render boundary
                                window.location.reload();
                              } else {
                                alert('No valid coordinates found in file');
                              }
                            } catch (error) {
                              alert('Error parsing file: ' + (error as Error).message);
                            }
                          };
                          reader.readAsText(file);
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('boundary-upload')?.click()}
                    >
                      Upload KML/GeoJSON
                    </Button>
                    <Button
                      variant={isDrawingMode ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsDrawingMode(!isDrawingMode)}
                    >
                      {isDrawingMode ? "Stop Drawing" : "Draw Boundary"}
                    </Button>
                    <Button
                      variant={isMeasuring ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setIsMeasuring(!isMeasuring);
                        if (isMeasuring) {
                          // Clear measurement when exiting
                          measurementMarkers.forEach(marker => marker.setMap(null));
                          if (measurementLine) measurementLine.setMap(null);
                          setMeasurementMarkers([]);
                          setMeasurementLine(null);
                          setMeasuredDistance(null);
                        }
                      }}
                    >
                      <Ruler className="w-4 h-4 mr-1" />
                      {isMeasuring ? "Stop Measuring" : "Measure Distance"}
                    </Button>
                    {drawnBoundaries.length > 0 && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            if (drawnBoundaries.length > 0) {
                              const allParcels = drawnBoundaries.map(boundary => {
                                const path = boundary.getPath();
                                const coordinates: { lat: number; lng: number }[] = [];
                                for (let i = 0; i < path.getLength(); i++) {
                                  const point = path.getAt(i);
                                  coordinates.push({
                                    lat: point.lat(),
                                    lng: point.lng()
                                  });
                                }
                                return coordinates;
                              });
                              // TODO: Save to backend
                              console.log('Saving parcels:', allParcels);
                              alert(`${drawnBoundaries.length} parcel(s) saved! Total area: ${calculatedArea?.toFixed(2)} hectares`);
                            }
                          }}
                        >
                          Save {drawnBoundaries.length} Parcel{drawnBoundaries.length > 1 ? 's' : ''}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            if (drawnBoundaries.length > 0) {
                              // Extract coordinates from all parcels
                              const allParcels = drawnBoundaries.map(boundary => {
                                const path = boundary.getPath();
                                const coordinates: { lat: number; lng: number }[] = [];
                                for (let i = 0; i < path.getLength(); i++) {
                                  const point = path.getAt(i);
                                  coordinates.push({
                                    lat: point.lat(),
                                    lng: point.lng()
                                  });
                                }
                                return coordinates;
                              });

                              // Ask user for format
                              const format = confirm('Download as GeoJSON? (Cancel for KML)') ? 'geojson' : 'kml';
                              const timestamp = new Date().toISOString().split('T')[0];
                              const filename = `${farm.name.replace(/\s+/g, '_')}_boundary_${timestamp}`;

                              let content: string;
                              let mimeType: string;
                              let extension: string;

                              if (format === 'geojson') {
                                // Generate GeoJSON with MultiPolygon
                                const geojson = {
                                  type: 'FeatureCollection',
                                  features: [
                                    {
                                      type: 'Feature',
                                      properties: {
                                        name: farm.name,
                                        farmer: farm.farmerName,
                                        size: farm.size,
                                        crops: farm.crops.join(', '),
                                        calculatedArea: calculatedArea?.toFixed(2),
                                        parcelCount: drawnBoundaries.length,
                                        parcelAreas: parcelAreas.map(a => a.toFixed(2))
                                      },
                                      geometry: {
                                        type: drawnBoundaries.length === 1 ? 'Polygon' : 'MultiPolygon',
                                        coordinates: drawnBoundaries.length === 1 
                                          ? [allParcels[0].map(c => [c.lng, c.lat])]
                                          : allParcels.map(parcel => [parcel.map(c => [c.lng, c.lat])])
                                      }
                                    }
                                  ]
                                };
                                content = JSON.stringify(geojson, null, 2);
                                mimeType = 'application/geo+json';
                                extension = 'geojson';
                              } else {
                                // Generate KML with multiple Placemarks
                                const placemarks = allParcels.map((parcel, index) => {
                                  const coordsString = parcel
                                    .map(c => `${c.lng},${c.lat},0`)
                                    .join(' ');
                                  return `    <Placemark>
      <name>${farm.name} - Parcel ${index + 1}</name>
      <description>
        Farmer: ${farm.farmerName}
        Parcel ${index + 1} of ${drawnBoundaries.length}
        Area: ${parcelAreas[index].toFixed(2)} ha
      </description>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>${coordsString}</coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>`;
                                }).join('\n');
                                
                                content = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${farm.name}</name>
    <description>Farm boundaries for ${farm.farmerName} - ${drawnBoundaries.length} parcel(s), Total: ${calculatedArea?.toFixed(2)} ha</description>
${placemarks}
  </Document>
</kml>`;
                                mimeType = 'application/vnd.google-earth.kml+xml';
                                extension = 'kml';
                              }

                              // Trigger download
                              const blob = new Blob([content], { type: mimeType });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${filename}.${extension}`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);

                              alert(`${drawnBoundaries.length} parcel(s) exported as ${extension.toUpperCase()}!`);
                            }
                          }}
                        >
                          Download {drawnBoundaries.length} Parcel{drawnBoundaries.length > 1 ? 's' : ''}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (drawnBoundaries.length > 0) {
                              // Remove all parcels from map
                              drawnBoundaries.forEach(boundary => boundary.setMap(null));
                              setDrawnBoundaries([]);
                              setParcelAreas([]);
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
                {measuredDistance !== null && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800">
                        Measured Distance:
                      </span>
                      <span className="text-sm font-bold text-purple-900">
                        {measuredDistance < 1000 
                          ? `${measuredDistance.toFixed(2)} meters`
                          : `${(measuredDistance / 1000).toFixed(2)} kilometers`
                        }
                      </span>
                    </div>
                  </div>
                )}
                {calculatedArea && (
                  <div className="space-y-2">
                    {drawnBoundaries.length > 1 && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-sm font-medium text-blue-800 mb-2">
                          📦 {drawnBoundaries.length} Parcels (Non-contiguous Land)
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {parcelAreas.map((area, index) => {
                            const colors = [
                              'bg-green-100 text-green-700',
                              'bg-blue-100 text-blue-700',
                              'bg-orange-100 text-orange-700',
                              'bg-purple-100 text-purple-700',
                              'bg-pink-100 text-pink-700',
                            ];
                            return (
                              <div key={index} className="flex items-center justify-between gap-2 text-xs">
                                <span className={`px-2 py-1 rounded ${colors[index % colors.length]}`}>
                                  Parcel {index + 1}
                                </span>
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">{area.toFixed(2)} ha</span>
                                  <button
                                    onClick={() => {
                                      // Remove polygon from map
                                      drawnBoundaries[index].setMap(null);
                                      
                                      // Remove from arrays
                                      const newBoundaries = drawnBoundaries.filter((_, i) => i !== index);
                                      const newAreas = parcelAreas.filter((_, i) => i !== index);
                                      
                                      setDrawnBoundaries(newBoundaries);
                                      setParcelAreas(newAreas);
                                      
                                      // Recalculate total area
                                      if (newAreas.length > 0) {
                                        const totalArea = newAreas.reduce((sum, a) => sum + a, 0);
                                        setCalculatedArea(totalArea);
                                      } else {
                                        setCalculatedArea(null);
                                      }
                                    }}
                                    className="p-0.5 hover:bg-red-100 rounded transition-colors"
                                    title="Delete this parcel"
                                  >
                                    <X className="w-3 h-3 text-red-600" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {drawnBoundaries.length > 1 ? 'Total' : 'Calculated'} Area: <strong>{calculatedArea.toFixed(2)} hectares</strong>
                      </span>
                      <span className="text-sm text-muted-foreground">
                        | Entered Size: <strong>{farm.size} hectares</strong>
                      </span>
                    </div>
                    {(() => {
                      const difference = Math.abs(calculatedArea - farm.size);
                      const percentDiff = (difference / farm.size) * 100;
                      
                      if (percentDiff > 10) {
                        return (
                          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-yellow-800">
                                ⚠️ Area Mismatch Detected
                              </p>
                              <p className="text-xs text-yellow-700 mt-1">
                                The drawn boundary area differs by {percentDiff.toFixed(1)}% from the entered farm size.
                                {calculatedArea > farm.size 
                                  ? ` The drawn area is ${difference.toFixed(2)} hectares larger.`
                                  : ` The drawn area is ${difference.toFixed(2)} hectares smaller.`
                                }
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                if (confirm(`Update farm size from ${farm.size} ha to ${calculatedArea.toFixed(2)} ha?`)) {
                                  // TODO: Update farm size in backend
                                  alert('Farm size would be updated to match drawn boundary');
                                }
                              }}
                            >
                              Update Size
                            </Button>
                          </div>
                        );
                      } else if (percentDiff > 5) {
                        return (
                          <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            ℹ️ Minor difference: {percentDiff.toFixed(1)}% ({difference.toFixed(2)} ha)
                          </div>
                        );
                      } else {
                        return (
                          <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                            ✓ Area matches entered size ({percentDiff.toFixed(1)}% difference)
                          </div>
                        );
                      }
                    })()}
                  </div>
                )}
                
                {/* Map Type Switcher */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">Map View</span>
                    <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors">
                      <Checkbox
                        checked={terrainEnabled}
                        onCheckedChange={(checked) => {
                          const enabled = checked === true;
                          setTerrainEnabled(enabled);
                          
                          if (mapInstance) {
                            if (enabled) {
                              // Switch to terrain map type which shows elevation and topography
                              const currentType = mapInstance.getMapTypeId();
                              if (currentType === 'roadmap') {
                                mapInstance.setMapTypeId('terrain');
                                setMapType('roadmap'); // Keep UI state as roadmap
                              } else {
                                // For satellite/hybrid, enable terrain overlay
                                mapInstance.setOptions({ 
                                  // @ts-ignore - tilt is valid
                                  tilt: 45 
                                });
                              }
                            } else {
                              // Switch back to regular roadmap if currently on terrain
                              const currentType = mapInstance.getMapTypeId();
                              if (currentType === 'terrain') {
                                mapInstance.setMapTypeId('roadmap');
                              } else {
                                mapInstance.setOptions({ 
                                  // @ts-ignore
                                  tilt: 0 
                                });
                              }
                            }
                          }
                        }}
                      />
                      <Mountain className="w-4 h-4" />
                      <span>Show Terrain</span>
                    </label>
                  </div>
                  <div className="flex gap-1 bg-muted rounded-lg p-1">
                    <Button
                      type="button"
                      variant={mapType === 'roadmap' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-8 px-3"
                      onClick={() => {
                        setMapType('roadmap');
                        if (mapInstance) {
                          mapInstance.setMapTypeId('roadmap');
                        }
                      }}
                    >
                      <MapIcon className="w-4 h-4 mr-1" />
                      Roadmap
                    </Button>
                    <Button
                      type="button"
                      variant={mapType === 'satellite' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-8 px-3"
                      onClick={() => {
                        setMapType('satellite');
                        if (mapInstance) {
                          mapInstance.setMapTypeId('satellite');
                        }
                      }}
                    >
                      <Satellite className="w-4 h-4 mr-1" />
                      Satellite
                    </Button>
                    <Button
                      type="button"
                      variant={mapType === 'hybrid' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-8 px-3"
                      onClick={() => {
                        setMapType('hybrid');
                        if (mapInstance) {
                          mapInstance.setMapTypeId('hybrid');
                        }
                      }}
                    >
                      <Layers className="w-4 h-4 mr-1" />
                      Hybrid
                    </Button>
                  </div>
                </div>
                
                <div className="h-96 rounded-lg overflow-hidden border">
                  <MapView
                    onMapReady={(map, google) => {
                      // Store map instance for map type switching
                      setMapInstance(map);
                      
                      // Set initial map type
                      map.setMapTypeId(mapType);
                      
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

                      // Check for pending uploaded boundary coordinates
                      const pendingCoords = (window as any).pendingBoundaryCoordinates;
                      if (pendingCoords && pendingCoords.length > 0) {
                        const uploadedBoundary = new google.maps.Polygon({
                          paths: pendingCoords,
                          fillColor: '#3b82f6',
                          fillOpacity: 0.3,
                          strokeWeight: 2,
                          strokeColor: '#2563eb',
                          editable: true,
                          draggable: true,
                          map,
                        });
                        
                        // Calculate and display area
                        const area = google.maps.geometry.spherical.computeArea(uploadedBoundary.getPath());
                        const hectares = area / 10000;
                        setDrawnBoundaries([uploadedBoundary]);
                        setParcelAreas([hectares]);
                        setCalculatedArea(hectares);

                        // Update area on edit
                        google.maps.event.addListener(uploadedBoundary.getPath(), 'set_at', () => {
                          const newArea = google.maps.geometry.spherical.computeArea(uploadedBoundary.getPath());
                          const newHectares = newArea / 10000;
                          setParcelAreas([newHectares]);
                          setCalculatedArea(newHectares);
                        });
                        google.maps.event.addListener(uploadedBoundary.getPath(), 'insert_at', () => {
                          const newArea = google.maps.geometry.spherical.computeArea(uploadedBoundary.getPath());
                          const newHectares = newArea / 10000;
                          setParcelAreas([newHectares]);
                          setCalculatedArea(newHectares);
                        });

                        // Fit map to boundary
                        const bounds = new google.maps.LatLngBounds();
                        pendingCoords.forEach((coord: { lat: number; lng: number }) => {
                          bounds.extend(coord);
                        });
                        map.fitBounds(bounds);

                        // Clear pending coordinates
                        delete (window as any).pendingBoundaryCoordinates;
                      }
                      // Display existing boundary if available
                      else if (farm.boundary && farm.boundary.length > 0) {
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
                        
                        // Calculate and display existing area
                        const area = google.maps.geometry.spherical.computeArea(existingBoundary.getPath());
                        const hectares = area / 10000;
                        setDrawnBoundaries([existingBoundary]);
                        setParcelAreas([hectares]);
                        setCalculatedArea(hectares);

                        // Update area on edit
                        google.maps.event.addListener(existingBoundary.getPath(), 'set_at', () => {
                          const newArea = google.maps.geometry.spherical.computeArea(existingBoundary.getPath());
                          const newHectares = newArea / 10000;
                          setParcelAreas([newHectares]);
                          setCalculatedArea(newHectares);
                        });
                        google.maps.event.addListener(existingBoundary.getPath(), 'insert_at', () => {
                          const newArea = google.maps.geometry.spherical.computeArea(existingBoundary.getPath());
                          const newHectares = newArea / 10000;
                          setParcelAreas([newHectares]);
                          setCalculatedArea(newHectares);
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

                      // Color palette for different parcels
                      const parcelColors = [
                        { fill: '#22c55e', stroke: '#16a34a' }, // Green
                        { fill: '#3b82f6', stroke: '#2563eb' }, // Blue
                        { fill: '#f59e0b', stroke: '#d97706' }, // Orange
                        { fill: '#8b5cf6', stroke: '#7c3aed' }, // Purple
                        { fill: '#ec4899', stroke: '#db2777' }, // Pink
                      ];

                      // Toggle drawing mode
                      const checkDrawingMode = setInterval(() => {
                        if (isDrawingMode) {
                          drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
                        } else {
                          drawingManager.setDrawingMode(null);
                        }
                      }, 100);

                      // Handle polygon complete
                      google.maps.event.addListener(drawingManager, 'polygoncomplete', (polygon: google.maps.Polygon) => {
                        // Get color for this parcel
                        const colorIndex = drawnBoundaries.length % parcelColors.length;
                        const color = parcelColors[colorIndex];
                        
                        // Apply color to polygon
                        polygon.setOptions({
                          fillColor: color.fill,
                          strokeColor: color.stroke,
                        });

                        // Add to boundaries array
                        setDrawnBoundaries(prev => [...prev, polygon]);
                        
                        // Calculate area for this parcel
                        const area = google.maps.geometry.spherical.computeArea(polygon.getPath());
                        const hectares = area / 10000; // Convert m² to hectares
                        setParcelAreas(prev => [...prev, hectares]);

                        // Calculate total area
                        const totalArea = [...parcelAreas, hectares].reduce((sum, a) => sum + a, 0);
                        setCalculatedArea(totalArea);

                        // Update area on edit
                        const parcelIndex = drawnBoundaries.length;
                        google.maps.event.addListener(polygon.getPath(), 'set_at', () => {
                          const newArea = google.maps.geometry.spherical.computeArea(polygon.getPath());
                          const newHectares = newArea / 10000;
                          setParcelAreas(prev => {
                            const updated = [...prev];
                            updated[parcelIndex] = newHectares;
                            setCalculatedArea(updated.reduce((sum, a) => sum + a, 0));
                            return updated;
                          });
                        });
                        google.maps.event.addListener(polygon.getPath(), 'insert_at', () => {
                          const newArea = google.maps.geometry.spherical.computeArea(polygon.getPath());
                          const newHectares = newArea / 10000;
                          setParcelAreas(prev => {
                            const updated = [...prev];
                            updated[parcelIndex] = newHectares;
                            setCalculatedArea(updated.reduce((sum, a) => sum + a, 0));
                            return updated;
                          });
                        });

                        // Keep drawing mode active for adding more parcels
                        // User can click "Stop Drawing" to exit
                      });

                      // Add measurement click listener
                      const measurementClickListener = google.maps.event.addListener(map, 'click', (event: google.maps.MapMouseEvent) => {
                        if (!isMeasuring) return;
                        
                        const clickedLocation = event.latLng;
                        if (!clickedLocation) return;

                        if (measurementMarkers.length === 0) {
                          // First click - place start marker
                          const startMarker = new google.maps.Marker({
                            position: clickedLocation,
                            map,
                            icon: {
                              path: google.maps.SymbolPath.CIRCLE,
                              scale: 8,
                              fillColor: '#9333ea',
                              fillOpacity: 1,
                              strokeColor: '#ffffff',
                              strokeWeight: 2,
                            },
                            title: 'Start point',
                          });
                          setMeasurementMarkers([startMarker]);
                        } else if (measurementMarkers.length === 1) {
                          // Second click - place end marker and calculate distance
                          const endMarker = new google.maps.Marker({
                            position: clickedLocation,
                            map,
                            icon: {
                              path: google.maps.SymbolPath.CIRCLE,
                              scale: 8,
                              fillColor: '#9333ea',
                              fillOpacity: 1,
                              strokeColor: '#ffffff',
                              strokeWeight: 2,
                            },
                            title: 'End point',
                          });
                          
                          // Draw line between markers
                          const line = new google.maps.Polyline({
                            path: [measurementMarkers[0].getPosition()!, clickedLocation],
                            strokeColor: '#9333ea',
                            strokeOpacity: 0.8,
                            strokeWeight: 3,
                            map,
                          });
                          
                          // Calculate distance
                          const distance = google.maps.geometry.spherical.computeDistanceBetween(
                            measurementMarkers[0].getPosition()!,
                            clickedLocation
                          );
                          
                          setMeasurementMarkers([...measurementMarkers, endMarker]);
                          setMeasurementLine(line);
                          setMeasuredDistance(distance);
                          setIsMeasuring(false);
                        }
                      });

                      return () => {
                        clearInterval(checkDrawingMode);
                        google.maps.event.removeListener(measurementClickListener);
                      };
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
