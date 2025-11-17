# Google Places API Autocomplete Integration

## Overview

The Google Places API autocomplete feature provides intelligent location search for barangay and municipality fields in the farm registration wizard. It improves data accuracy, reduces typos, and automatically extracts coordinates for map centering.

---

## Features

### 1. Smart Location Search
- **Type-ahead Suggestions**: Real-time suggestions as you type
- **Philippines-Specific**: Restricted to Philippine locations only
- **Type Filtering**: Separate filters for barangay vs municipality searches
- **Address Parsing**: Automatic extraction of barangay, municipality, province, and coordinates

### 2. Auto-Fill Functionality
- **Barangay Field**: Auto-fills from selected place
- **Municipality Field**: Auto-fills from selected place
- **Latitude/Longitude**: Auto-extracts coordinates
- **Map Centering**: Automatically centers map on selected location

### 3. User Experience
- **Visual Feedback**: MapPin icon, loading spinner, clear button
- **Error Handling**: Graceful fallback for API failures
- **Manual Override**: Users can still type custom values
- **Toast Notifications**: Success messages with formatted address

---

## User Flow

### Farm Creation (Step 1: Basic Information)

1. **Search for Barangay**
   - Click on the "Barangay" field
   - Start typing (e.g., "San Isidro")
   - Google Places shows matching suggestions
   - Select a suggestion from the dropdown

2. **Auto-Fill Results**
   - Barangay field fills with selected barangay name
   - Municipality field auto-fills with parent municipality
   - Latitude/Longitude fields update automatically
   - Map centers on selected location (Step 3)
   - Toast notification: "Location set to [formatted address]"

3. **Search for Municipality** (Alternative)
   - Click on the "Municipality" field
   - Start typing (e.g., "Calauan")
   - Select from suggestions
   - Municipality field fills
   - Coordinates update
   - Map centers on municipality

4. **Manual Entry** (Fallback)
   - Type directly without selecting from dropdown
   - Custom values are preserved
   - Coordinates must be entered manually
   - Map centering requires manual coordinate input

---

## Technical Implementation

### Component: `PlacesAutocomplete.tsx`

```typescript
interface PlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  className?: string;
  type?: "barangay" | "municipality" | "general";
  disabled?: boolean;
}
```

**Key Features**:
- Google Places Autocomplete initialization
- Country restriction: Philippines (`ph`)
- Type-specific filtering (sublocality, locality, political)
- Place selection event handling
- Address component extraction
- Loading and error states

### Helper Function: `extractAddressComponents()`

```typescript
function extractAddressComponents(place: google.maps.places.PlaceResult) {
  return {
    barangay: string;        // From sublocality_level_1 or neighborhood
    municipality: string;    // From locality or administrative_area_level_2
    province: string;        // From administrative_area_level_1
    latitude: number;        // From geometry.location.lat()
    longitude: number;       // From geometry.location.lng()
    formatted_address: string;
    place_id: string;
  };
}
```

**Address Component Mapping**:
- **Barangay**: `sublocality_level_1`, `neighborhood`
- **Municipality**: `locality`, `administrative_area_level_2`
- **Province**: `administrative_area_level_1`

### Integration in `FarmNew.tsx`

**Barangay Autocomplete**:
```typescript
<PlacesAutocomplete
  value={formData.barangay}
  onChange={(value) => updateFormData("barangay", value)}
  onPlaceSelect={(place) => {
    const components = extractAddressComponents(place);
    
    if (components.barangay) {
      updateFormData("barangay", components.barangay);
    }
    
    if (components.municipality) {
      updateFormData("municipality", components.municipality);
    }
    
    if (components.latitude && components.longitude) {
      updateFormData("latitude", components.latitude);
      updateFormData("longitude", components.longitude);
      centerMapOnCoordinates(components.latitude, components.longitude);
      toast.success(`Location set to ${components.formatted_address}`);
    }
  }}
  placeholder="Search for barangay (e.g., San Isidro)"
  type="barangay"
/>
```

**Municipality Autocomplete**:
```typescript
<PlacesAutocomplete
  value={formData.municipality}
  onChange={(value) => updateFormData("municipality", value)}
  onPlaceSelect={(place) => {
    const components = extractAddressComponents(place);
    
    if (components.municipality) {
      updateFormData("municipality", components.municipality);
    }
    
    if (components.latitude && components.longitude) {
      updateFormData("latitude", components.latitude);
      updateFormData("longitude", components.longitude);
      centerMapOnCoordinates(components.latitude, components.longitude);
      toast.success(`Location set to ${components.formatted_address}`);
    }
  }}
  placeholder="Search for municipality (e.g., Calauan)"
  type="municipality"
/>
```

### Map Centering Function

```typescript
const centerMapOnCoordinates = (lat: number, lng: number) => {
  if (mapInstance) {
    mapInstance.setCenter({ lat, lng });
    mapInstance.setZoom(16); // Zoom in to show details
  }
};
```

---

## Autocomplete Configuration

### Type-Specific Options

**Barangay Search**:
```typescript
{
  componentRestrictions: { country: "ph" },
  types: ["sublocality", "neighborhood", "political"],
  fields: ["address_components", "formatted_address", "geometry", "name", "place_id"]
}
```

**Municipality Search**:
```typescript
{
  componentRestrictions: { country: "ph" },
  types: ["locality", "administrative_area_level_2", "political"],
  fields: ["address_components", "formatted_address", "geometry", "name", "place_id"]
}
```

**General Search**:
```typescript
{
  componentRestrictions: { country: "ph" },
  types: ["geocode"],
  fields: ["address_components", "formatted_address", "geometry", "name", "place_id"]
}
```

---

## Error Handling

### Common Issues

1. **Google Maps Not Loaded**
   - **Symptom**: Autocomplete doesn't initialize
   - **Cause**: Google Maps script not loaded yet
   - **Solution**: Component waits for `window.google.maps.places` with retry logic

2. **No Place Details Available**
   - **Symptom**: Error message: "No details available for this location"
   - **Cause**: Selected place has no geometry/coordinates
   - **Solution**: Error message displayed, user can try different place

3. **API Initialization Failed**
   - **Symptom**: Error message: "Failed to initialize autocomplete"
   - **Cause**: Google Maps API error or network issue
   - **Solution**: Error logged to console, user can type manually

4. **Missing Address Components**
   - **Symptom**: Barangay or municipality not auto-filled
   - **Cause**: Place doesn't have required address components
   - **Solution**: Fallback to formatted_address or manual entry

### Fallback Behavior

- **API Failure**: Input remains functional as regular text field
- **No Results**: User can type custom value
- **Partial Data**: Auto-fill available fields, leave others for manual entry
- **Network Issues**: Loading state clears, manual entry enabled

---

## Best Practices

### For Users

1. **Start Typing**: Begin with barangay or municipality name
2. **Select from Dropdown**: Choose from suggestions for best accuracy
3. **Verify Auto-Fill**: Check that municipality and coordinates are correct
4. **Manual Override**: Type custom values if needed
5. **Check Map**: Verify location on map (Step 3) before submitting

### For Developers

1. **Restrict Country**: Always use `componentRestrictions: { country: "ph" }`
2. **Limit Fields**: Request only needed fields to reduce API costs
3. **Handle Errors**: Provide fallback for API failures
4. **Debounce Requests**: Autocomplete handles this internally
5. **Extract Components**: Use helper function for consistent parsing
6. **Validate Data**: Check for null/undefined before using
7. **Center Map**: Always update map when coordinates change

---

## API Usage and Costs

### Google Places API

**Pricing** (as of 2024):
- Autocomplete - Per Session: $0.017 per session
- Place Details: $0.017 per request
- Fields: Additional charges for premium fields

**Optimization**:
- Session-based pricing (cheaper than per-request)
- Limited fields requested (only essential data)
- Country restriction reduces irrelevant results
- Type filtering improves relevance

**Rate Limits**:
- No hard limit on requests
- Billed per session/request
- Recommend monitoring usage in Google Cloud Console

**Authentication**:
- Uses Manus proxy (no API key needed from user)
- Automatic authentication via MapView component
- Same proxy as Google Maps integration

---

## Troubleshooting

### Autocomplete Not Working

**Check**:
1. Is Google Maps loaded? (Check browser console)
2. Is MapView component rendered? (Required for proxy auth)
3. Are there JavaScript errors? (Check console)
4. Is network connection stable?

**Solutions**:
- Ensure MapView is on the page (Step 3)
- Refresh page to reload Google Maps
- Check browser console for errors
- Try manual entry as fallback

### Wrong Location Selected

**Cause**: Multiple places with same name  
**Solution**: Check formatted address in toast notification, re-select if wrong

### Coordinates Not Updating

**Cause**: Place has no geometry data  
**Solution**: Try different search term or enter coordinates manually

### Map Not Centering

**Cause**: Map instance not initialized yet  
**Solution**: Map centers when you reach Step 3, or refresh after selection

---

## Future Enhancements

### Planned Features
- [ ] **Recent Searches**: Show recently selected locations
- [ ] **Current Location**: "Use my location" button with geolocation
- [ ] **Favorites**: Save frequently used locations
- [ ] **Bulk Import**: CSV upload with address geocoding
- [ ] **Address Validation**: Warn if location outside Laguna province
- [ ] **Offline Mode**: Cache common barangays/municipalities
- [ ] **Keyboard Shortcuts**: Quick access to autocomplete
- [ ] **Voice Input**: Speech-to-text for location search

### Performance Optimizations
- [ ] Debounce user input (reduce API calls)
- [ ] Cache autocomplete results (reduce duplicate requests)
- [ ] Lazy load Google Maps (faster initial page load)
- [ ] Prefetch common locations (faster autocomplete)

### UX Improvements
- [ ] Highlight matching text in suggestions
- [ ] Show place type icons (barangay vs municipality)
- [ ] Display distance from current location
- [ ] Add map preview in dropdown
- [ ] Show province in suggestions for clarity

---

## Examples

### Example 1: Search for Barangay

**User Input**: "San Isidro"

**Autocomplete Suggestions**:
- San Isidro, Calauan, Laguna
- San Isidro, Pila, Laguna
- San Isidro, Lumban, Laguna

**User Selects**: "San Isidro, Calauan, Laguna"

**Auto-Fill Results**:
- Barangay: "San Isidro"
- Municipality: "Calauan"
- Latitude: 14.1475
- Longitude: 121.3189
- Toast: "Location set to San Isidro, Calauan, Laguna, Philippines"

### Example 2: Search for Municipality

**User Input**: "Calauan"

**Autocomplete Suggestions**:
- Calauan, Laguna, Philippines

**User Selects**: "Calauan, Laguna, Philippines"

**Auto-Fill Results**:
- Municipality: "Calauan"
- Latitude: 14.1475
- Longitude: 121.3189
- Toast: "Location set to Calauan, Laguna, Philippines"

---

## API Reference

### PlacesAutocomplete Component

```tsx
import { PlacesAutocomplete, extractAddressComponents } from "@/components/PlacesAutocomplete";

<PlacesAutocomplete
  value={location}
  onChange={setLocation}
  onPlaceSelect={(place) => {
    const components = extractAddressComponents(place);
    console.log(components);
  }}
  placeholder="Search for a location"
  type="barangay"
  className="w-full"
  disabled={false}
/>
```

### extractAddressComponents Function

```typescript
const place: google.maps.places.PlaceResult = /* from autocomplete */;
const components = extractAddressComponents(place);

console.log(components.barangay);        // "San Isidro"
console.log(components.municipality);    // "Calauan"
console.log(components.province);        // "Laguna"
console.log(components.latitude);        // 14.1475
console.log(components.longitude);       // 121.3189
console.log(components.formatted_address); // "San Isidro, Calauan, Laguna, Philippines"
console.log(components.place_id);        // "ChIJ..."
```

---

## Support

For issues or questions about the Places autocomplete feature:
1. Check this documentation first
2. Review error messages in browser console
3. Test with different search terms
4. Try manual entry as fallback
5. Contact development team if issue persists

---

**Last Updated**: 2024-11-17  
**Version**: 1.0.0  
**Author**: MAGSASA-CARD Development Team
