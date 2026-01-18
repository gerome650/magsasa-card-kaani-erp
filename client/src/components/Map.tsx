/**
 * GOOGLE MAPS FRONTEND INTEGRATION - ESSENTIAL GUIDE
 *
 * USAGE FROM PARENT COMPONENT:
 * ======
 *
 * const mapRef = useRef<google.maps.Map | null>(null);
 *
 * <MapView
 *   initialCenter={{ lat: 40.7128, lng: -74.0060 }}
 *   initialZoom={15}
 *   onMapReady={(map) => {
 *     mapRef.current = map; // Store to control map from parent anytime, google map itself is in charge of the re-rendering, not react state.
 * </MapView>
 *
 * ======
 * Available Libraries and Core Features:
 * -------------------------------
 * 📍 MARKER (from `marker` library)
 * - Attaches to map using { map, position }
 * new google.maps.marker.AdvancedMarkerElement({
 *   map,
 *   position: { lat: 37.7749, lng: -122.4194 },
 *   title: "San Francisco",
 * });
 *
 * -------------------------------
 * 🏢 PLACES (from `places` library)
 * - Does not attach directly to map; use data with your map manually.
 * const place = new google.maps.places.Place({ id: PLACE_ID });
 * await place.fetchFields({ fields: ["displayName", "location"] });
 * map.setCenter(place.location);
 * new google.maps.marker.AdvancedMarkerElement({ map, position: place.location });
 *
 * -------------------------------
 * 🧭 GEOCODER (from `geocoding` library)
 * - Standalone service; manually apply results to map.
 * const geocoder = new google.maps.Geocoder();
 * geocoder.geocode({ address: "New York" }, (results, status) => {
 *   if (status === "OK" && results[0]) {
 *     map.setCenter(results[0].geometry.location);
 *     new google.maps.marker.AdvancedMarkerElement({
 *       map,
 *       position: results[0].geometry.location,
 *     });
 *   }
 * });
 *
 * -------------------------------
 * 📐 GEOMETRY (from `geometry` library)
 * - Pure utility functions; not attached to map.
 * const dist = google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
 *
 * -------------------------------
 * 🛣️ ROUTES (from `routes` library)
 * - Combines DirectionsService (standalone) + DirectionsRenderer (map-attached)
 * const directionsService = new google.maps.DirectionsService();
 * const directionsRenderer = new google.maps.DirectionsRenderer({ map });
 * directionsService.route(
 *   { origin, destination, travelMode: "DRIVING" },
 *   (res, status) => status === "OK" && directionsRenderer.setDirections(res)
 * );
 *
 * -------------------------------
 * 🌦️ MAP LAYERS (attach directly to map)
 * - new google.maps.TrafficLayer().setMap(map);
 * - new google.maps.TransitLayer().setMap(map);
 * - new google.maps.BicyclingLayer().setMap(map);
 *
 * -------------------------------
 * ✅ SUMMARY
 * - “map-attached” → AdvancedMarkerElement, DirectionsRenderer, Layers.
 * - “standalone” → Geocoder, DirectionsService, DistanceMatrixService, ElevationService.
 * - “data-only” → Place, Geometry utilities.
 */

/// <reference types="@types/google.maps" />

import { useEffect, useRef, useState } from "react";
import { usePersistFn } from "@/hooks/usePersistFn";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

declare global {
  interface Window {
    google?: typeof google;
  }
}

const API_KEY = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
const FORGE_BASE_URL =
  import.meta.env.VITE_FRONTEND_FORGE_API_URL ||
  "https://forge.butterfly-effect.dev";
const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;

const SCRIPT_LOAD_TIMEOUT_MS = 20000; // 20 seconds

/**
 * Detects common Google Maps error patterns from console errors or API responses.
 * Returns a diagnostic hint if a known error pattern is found.
 */
function detectGoogleMapsError(msg: string): string | null {
  if (!import.meta.env.DEV) return null;

  const msgLower = msg.toLowerCase();

  // Common Google Maps error patterns
  if (msgLower.includes("apinotactivatedmaperror") || msgLower.includes("api not activated")) {
    return "Maps JavaScript API is not enabled in Google Cloud.";
  }
  if (msgLower.includes("referernotallowedmaperror") || msgLower.includes("referer not allowed")) {
    return "Referrer restrictions are blocking this request. Add localhost:3000/* to allowed referrers.";
  }
  if (msgLower.includes("invalidkeymaperror") || msgLower.includes("invalid key")) {
    return "Invalid or expired API key.";
  }
  if (msgLower.includes("quotaexceeded") || msgLower.includes("over_quota") || msgLower.includes("quota exceeded")) {
    return "API quota exceeded.";
  }

  return null;
}

/**
 * Loads Google Maps JavaScript API script with timeout and error handling.
 * Resolves when window.google.maps is available, rejects on failure or timeout.
 */
function loadMapScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // QA: Dev-only token validation
    if (import.meta.env.DEV && !API_KEY) {
      console.warn(
        "[MapView][DEV] VITE_FRONTEND_FORGE_API_KEY is missing. Map script will fail to load."
      );
    }

    if (import.meta.env.DEV) {
      console.info("[MapView][DEV] Starting Google Maps script load...");
    }

    // Check if already loaded
    if (window.google?.maps) {
      if (import.meta.env.DEV) {
        console.info("[MapView][DEV] Google Maps already loaded, skipping script injection.");
      }
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&v=weekly&libraries=marker,places,geocoding,geometry`;
    script.async = true;
    script.crossOrigin = "anonymous";

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let resolved = false;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      // Don't remove script immediately - let it finish loading if it's still trying
    };

    const checkGoogleMaps = () => {
      if (window.google?.maps) {
        resolved = true;
        cleanup();
        if (import.meta.env.DEV) {
          console.info("[MapView][DEV] Google Maps script loaded successfully");
        }
        resolve();
      }
    };

    // Poll for window.google.maps availability (script.onload doesn't guarantee API is ready)
    const pollInterval = setInterval(() => {
      checkGoogleMaps();
      if (resolved) {
        clearInterval(pollInterval);
      }
    }, 100);

    // Timeout after SCRIPT_LOAD_TIMEOUT_MS
    timeoutId = setTimeout(() => {
      clearInterval(pollInterval);
      if (!resolved) {
        resolved = true;
        cleanup();
        const error = new Error("Google Maps script load timeout");
        if (import.meta.env.DEV) {
          console.error("[MapView][DEV] Google Maps script load timed out after 20s");
        }
        reject(error);
      }
    }, SCRIPT_LOAD_TIMEOUT_MS);

    script.onload = () => {
      // Script loaded, but API might not be ready yet
      // Polling will handle the actual resolution
      checkGoogleMaps();
    };

    script.onerror = () => {
      clearInterval(pollInterval);
      if (!resolved) {
        resolved = true;
        cleanup();
        const error = new Error(
          API_KEY
            ? "Failed to load Google Maps script (check network or API key validity)"
            : "Failed to load Google Maps script (VITE_FRONTEND_FORGE_API_KEY is missing)"
        );
        if (import.meta.env.DEV) {
          console.error("[MapView][DEV] Google Maps script failed to load:", error.message);
          const hint = detectGoogleMapsError(error.message);
          if (hint) {
            console.warn(`[MapView][DEV] Hint: ${hint}`);
          }
        }
        reject(error);
      }
    };

    document.head.appendChild(script);
  });
}

interface MapViewProps {
  className?: string;
  initialCenter?: google.maps.LatLngLiteral;
  initialZoom?: number;
  onMapReady?: (map: google.maps.Map) => void;
  onError?: (reason: string) => void;
}

export function MapView({
  className,
  initialCenter = { lat: 37.7749, lng: -122.4194 },
  initialZoom = 12,
  onMapReady,
  onError,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const init = usePersistFn(async () => {
    setIsLoading(true);
    setHasError(false);
    setErrorMessage(null);

    try {
      await loadMapScript();
    } catch (error) {
      setIsLoading(false);
      setHasError(true);
      
      const errorMsg = error instanceof Error ? error.message : "Failed to load Google Maps";
      setErrorMessage(errorMsg);

      if (import.meta.env.DEV) {
        console.error("[MapView][DEV] Failed to load map script:", error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        const hint = detectGoogleMapsError(errorMsg);
        if (hint) {
          console.warn(`[MapView][DEV] Hint: ${hint}`);
        }
        if (!API_KEY) {
          console.info("[MapView][DEV] Set VITE_FRONTEND_FORGE_API_KEY to enable map tiles");
        }
      }

      // Notify parent component
      if (onError) {
        onError(errorMsg);
      }
      return;
    }

    if (!mapContainer.current) {
      const errorMsg = "Map container not found";
      setIsLoading(false);
      setHasError(true);
      setErrorMessage(errorMsg);
      console.error("[MapView]", errorMsg);
      if (onError) {
        onError(errorMsg);
      }
      return;
    }

    // QA: Dev-only container size check before map init
    if (import.meta.env.DEV) {
      const rect = mapContainer.current.getBoundingClientRect();
      console.info("[MapView][DEV] Initializing map with container size:", {
        width: rect.width,
        height: rect.height,
      });
      if (rect.height < 50) {
        console.warn(
          "[MapView][DEV] Container height is very small before map init. Map may not render correctly."
        );
      }
    }

    if (!window.google?.maps) {
      const errorMsg = "Google Maps API not available after script load";
      setIsLoading(false);
      setHasError(true);
      setErrorMessage(errorMsg);
      console.error("[MapView]", errorMsg);
      if (import.meta.env.DEV) {
        const hint = detectGoogleMapsError(errorMsg);
        if (hint) {
          console.warn(`[MapView][DEV] Hint: ${hint}`);
        }
      }
      if (onError) {
        onError(errorMsg);
      }
      return;
    }

    try {
      map.current = new window.google.maps.Map(mapContainer.current, {
        zoom: initialZoom,
        center: initialCenter,
        mapTypeControl: true,
        fullscreenControl: true,
        zoomControl: true,
        streetViewControl: true,
        mapId: "DEMO_MAP_ID",
      });

      if (import.meta.env.DEV) {
        console.info("[MapView][DEV] Google Maps instance created successfully");
      }

      setIsLoading(false);
      setHasError(false);

      if (onMapReady) {
        onMapReady(map.current);
      }
    } catch (error) {
      setIsLoading(false);
      setHasError(true);
      const errorMsg = error instanceof Error ? error.message : "Failed to initialize Google Maps";
      setErrorMessage(errorMsg);
      
      if (import.meta.env.DEV) {
        console.error("[MapView][DEV] Failed to create map instance:", error);
        const hint = detectGoogleMapsError(errorMsg);
        if (hint) {
          console.warn(`[MapView][DEV] Hint: ${hint}`);
        }
      }
      
      if (onError) {
        onError(errorMsg);
      }
    }
  });

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div ref={mapContainer} className={cn("w-full h-[500px] relative", className)}>
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}

      {/* Error state - Clean fallback for all environments */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="max-w-md mx-4 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Map temporarily unavailable</h3>
            <p className="text-sm text-gray-600">
              Map tiles could not be loaded. Filters and farm data remain available.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
