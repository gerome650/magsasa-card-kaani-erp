# Add New Farm Feature Documentation

## Overview

The Add New Farm feature allows users to register new farms in the MAGSASA-CARD system with comprehensive information including basic details, farm characteristics, and precise boundary mapping using Google Maps.

## User Journey

### Step 1: Basic Information
Users provide essential farm identification details:
- **Farm Name** (required): Unique identifier for the farm
- **Farmer Name** (required): Name of the farm owner/operator
- **Barangay** (required): Local administrative division
- **Municipality**: Selected from 22 Laguna municipalities
- **Latitude/Longitude**: GPS coordinates (default: Calauan center)

### Step 2: Farm Characteristics
Users specify agricultural details:
- **Crops** (required): Multi-select from 10 common crops:
  - Palay (Rice), Corn, Tomato, Eggplant, Okra
  - Banana, Cassava, Sweet Potato, Vegetables, Other
- **Soil Type**: Clay, Clay Loam, Loam, Sandy Loam, Sandy, Silt
- **Irrigation Type**: Irrigated, Rainfed, or Upland

### Step 3: Boundary Drawing
Interactive map interface for precise farm boundary definition:
- **Google Maps DrawingManager** integration
- **Polygon drawing tools** with editable vertices
- **Automatic area calculation** in hectares
- **Multiple parcel support** for non-contiguous farms
- **Real-time area updates** as boundaries are edited

## Technical Implementation

### Component Structure
```
FarmNew.tsx
├── Multi-step wizard (3 steps)
├── Form state management
├── Google Maps integration
├── tRPC mutations
└── Navigation logic
```

### Key Features

#### 1. Progress Indicator
- Visual 3-step progress bar
- Step validation before proceeding
- Back/Next navigation with state preservation

#### 2. Form Validation
- Required field checks (name, farmer, barangay, crops)
- Minimum 1 crop selection required
- Boundary drawing required (size > 0)
- Real-time validation feedback

#### 3. Map Integration
- Google Maps DrawingManager API
- Polygon drawing with custom styling:
  - Fill: Green (#10b981, 30% opacity)
  - Stroke: Dark green (#059669, 2px)
- Editable boundaries after drawing
- Spherical geometry for accurate area calculation

#### 4. Area Calculation
```javascript
const calculatePolygonArea = (polygon) => {
  const path = polygon.getPath();
  const area = google.maps.geometry.spherical.computeArea(path);
  return area / 10000; // Convert m² to hectares
};
```

#### 5. Data Submission
Two-phase submission process:
1. **Create Farm** via `trpc.farms.create.useMutation`
2. **Save Boundaries** via `trpc.boundaries.save.useMutation`

### Database Schema Integration

#### Farm Record
```typescript
{
  name: string;
  farmerName: string;
  barangay: string;
  municipality: string;
  latitude: string;
  longitude: string;
  size: number;  // Calculated from boundaries
  crops: string[];  // JSON array
  soilType: string;
  irrigationType: "Irrigated" | "Rainfed" | "Upland";
  status: "active" | "inactive" | "fallow";
}
```

#### Boundary Records
```typescript
{
  farmId: number;
  parcelIndex: number;  // 0, 1, 2... for multiple parcels
  geoJson: string;  // GeoJSON Polygon format
  area: number;  // Hectares
}
```

### GeoJSON Format
Boundaries are stored as standard GeoJSON Polygon:
```json
{
  "type": "Polygon",
  "coordinates": [
    [
      [lng1, lat1],
      [lng2, lat2],
      [lng3, lat3],
      [lng1, lat1]  // Closed polygon
    ]
  ]
}
```

## User Experience Highlights

### Visual Feedback
- ✅ Green checkmarks on completed steps
- 🔵 Blue highlight on current step
- ⚪ Gray for upcoming steps
- 🟢 Real-time area display in green

### Error Handling
- Toast notifications for validation errors
- Specific error messages for each failure case
- Mutation error display from backend

### Success Flow
1. Farm created successfully toast
2. Boundaries saved automatically
3. Navigate to new farm detail page (`/farms/{id}`)

## Navigation

### Routes
- **Entry**: `/farms/new`
- **Success**: `/farms/{newFarmId}`
- **Cancel**: `/farms` (via Back button)

### Access Control
Currently public (wrapped in Layout), but can be protected:
```tsx
<Route path="/farms/new">
  <ProtectedRoute allowedRoles={['manager', 'field_officer']}>
    <Layout>
      <FarmNew />
    </Layout>
  </ProtectedRoute>
</Route>
```

## Testing Checklist

### Step 1 Testing
- [ ] All fields accept input correctly
- [ ] Municipality dropdown shows 22 options
- [ ] Coordinates accept decimal values
- [ ] Next button disabled until required fields filled
- [ ] Form state persists when navigating back

### Step 2 Testing
- [ ] Crop checkboxes toggle correctly
- [ ] Multiple crops can be selected
- [ ] Soil type dropdown works
- [ ] Irrigation type dropdown works
- [ ] Next button disabled until at least 1 crop selected

### Step 3 Testing
- [ ] Map loads at correct center coordinates
- [ ] Draw Boundary button enables drawing mode
- [ ] Polygon can be drawn by clicking points
- [ ] Area calculates automatically after drawing
- [ ] Multiple parcels can be drawn
- [ ] Boundaries are editable (drag vertices)
- [ ] Clear All removes all polygons
- [ ] Create Farm button disabled until boundary drawn

### Submission Testing
- [ ] Farm creation mutation succeeds
- [ ] Boundaries save mutation succeeds
- [ ] Success toast displays
- [ ] Navigation to new farm detail page
- [ ] New farm appears in farm list
- [ ] Boundaries display correctly on farm detail page

## Future Enhancements

### Potential Improvements
1. **Location Search**: Geocoding API for address search
2. **Satellite View**: Toggle between map and satellite imagery
3. **Import Boundaries**: Upload KML/GeoJSON files
4. **Photo Upload**: Add farm photos during registration
5. **Draft Saving**: Save incomplete forms as drafts
6. **Validation Rules**: Advanced validation (e.g., reasonable size ranges)
7. **Boundary Suggestions**: AI-assisted boundary detection from satellite
8. **Mobile Optimization**: Touch-friendly drawing on mobile devices

### Integration Opportunities
- **Weather API**: Show weather forecast for farm location
- **Soil Analysis**: Link to soil testing services
- **Crop Recommendations**: Suggest crops based on location/soil
- **Market Prices**: Display current prices for selected crops

## Troubleshooting

### Common Issues

**Issue**: Map not loading
- **Cause**: Google Maps API key not configured
- **Solution**: Verify VITE_GOOGLE_MAPS_API_KEY in environment

**Issue**: Area calculation shows 0
- **Cause**: Polygon not closed properly
- **Solution**: Ensure first and last points are the same

**Issue**: Form submission fails
- **Cause**: Database connection or validation error
- **Solution**: Check server logs and database connection

**Issue**: Boundaries not saving
- **Cause**: GeoJSON format error
- **Solution**: Verify coordinate order (lng, lat) not (lat, lng)

## Code Maintenance

### Key Files
- `client/src/pages/FarmNew.tsx` - Main component
- `client/src/App.tsx` - Route configuration
- `server/routers.ts` - tRPC mutations
- `server/db.ts` - Database operations
- `drizzle/schema.ts` - Database schema

### Dependencies
- `@googlemaps/js-api-loader` - Google Maps integration
- `wouter` - Routing
- `sonner` - Toast notifications
- `trpc` - API communication
- `shadcn/ui` - UI components

## Support

For issues or questions:
1. Check browser console for errors
2. Review server logs for backend issues
3. Verify database schema matches expectations
4. Test with sample data first
5. Contact development team for assistance
