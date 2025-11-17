import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  className?: string;
  type?: "barangay" | "municipality" | "general";
  disabled?: boolean;
}

export function PlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Search for a location...",
  className,
  type = "general",
  disabled = false,
}: PlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!inputRef.current || disabled) return;

    // Wait for Google Maps to be loaded
    const initAutocomplete = () => {
      if (!window.google?.maps?.places) {
        setTimeout(initAutocomplete, 100);
        return;
      }

      try {
        // Configure autocomplete options based on type
        const options: google.maps.places.AutocompleteOptions = {
          componentRestrictions: { country: "ph" }, // Restrict to Philippines
          fields: [
            "address_components",
            "formatted_address",
            "geometry",
            "name",
            "place_id",
          ],
        };

        // Set types based on field type
        if (type === "barangay") {
          options.types = ["sublocality", "neighborhood", "political"];
        } else if (type === "municipality") {
          options.types = ["locality", "administrative_area_level_2", "political"];
        } else {
          options.types = ["geocode"];
        }

        // Initialize autocomplete
        const autocomplete = new google.maps.places.Autocomplete(
          inputRef.current!,
          options
        );

        // Listen for place selection
        autocomplete.addListener("place_changed", () => {
          setIsLoading(true);
          setError(null);

          const place = autocomplete.getPlace();

          if (!place.geometry || !place.geometry.location) {
            setError("No details available for this location");
            setIsLoading(false);
            return;
          }

          // Update input value with place name
          const placeName = place.name || place.formatted_address || "";
          onChange(placeName);

          // Call callback with full place details
          if (onPlaceSelect) {
            onPlaceSelect(place);
          }

          setIsLoading(false);
        });

        autocompleteRef.current = autocomplete;
      } catch (err) {
        console.error("Error initializing Places Autocomplete:", err);
        setError("Failed to initialize autocomplete");
      }
    };

    initAutocomplete();

    // Cleanup
    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [type, disabled, onChange, onPlaceSelect]);

  const handleClear = () => {
    onChange("");
    setError(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn("pl-9 pr-9", className)}
          disabled={disabled}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
        {!isLoading && value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={handleClear}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
    </div>
  );
}

// Helper function to extract address components
export function extractAddressComponents(place: google.maps.places.PlaceResult) {
  const components = place.address_components || [];
  
  let barangay = "";
  let municipality = "";
  let province = "";
  
  for (const component of components) {
    const types = component.types;
    
    // Extract barangay (sublocality_level_1 or neighborhood)
    if (types.includes("sublocality_level_1") || types.includes("neighborhood")) {
      barangay = component.long_name;
    }
    
    // Extract municipality (locality or administrative_area_level_2)
    if (types.includes("locality") || types.includes("administrative_area_level_2")) {
      municipality = component.long_name;
    }
    
    // Extract province
    if (types.includes("administrative_area_level_1")) {
      province = component.long_name;
    }
  }
  
  // Extract coordinates
  const latitude = place.geometry?.location?.lat() || 0;
  const longitude = place.geometry?.location?.lng() || 0;
  
  return {
    barangay,
    municipality,
    province,
    latitude,
    longitude,
    formatted_address: place.formatted_address || "",
    place_id: place.place_id || "",
  };
}
