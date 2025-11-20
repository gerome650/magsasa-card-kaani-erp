# Map View - Engineering Notes

**Audience**: Engineers onboarding to the codebase  
**Purpose**: Technical deep-dive into Map View architecture and implementation  
**Last Updated**: Pre-Production QA

---

## Architecture Overview

The Map View feature consists of three main components:

1. **Backend tRPC Endpoints** (`server/routers.ts`)
2. **Shared Database Query** (`server/db.ts`)
3. **Frontend React Component** (`client/src/pages/FarmMap.tsx`)

---

## Backend Architecture

### Endpoints

#### `farms.mapList`

**Purpose**: Returns farms with valid coordinates for map rendering

**Location**: `server/routers.ts` → `farms.mapList`

**Input**:
```typescript
{
  search?: string; // Optional search filter
}
```

**Output**:
```typescript
Array<{
  id: number;
  name: string;
  farmerName: string;
  latitude: string | number;
  longitude: string | number;
  municipality: string;
  barangay: string;
  size: number;
  crops: string[] | string; // JSON array or parsed array
  status: 'active' | 'inactive' | 'fallow';
  averageYield?: number;
  registrationDate: string;
}>
```

**Key Features**:
- Uses `getAllFarmsBaseQuery()` with `excludeMissingCoordinates: true`
- Filters out farms without valid coordinates
- Performance warnings if operation > 1s
- Guardrails: warns at 50k farms, errors at 200k farms
- User-friendly error messages for DB connection issues

**Logging**:
```
[MapView] mapList called: search=yes/no
[MapView] mapList completed in Xs: Y farms with coordinates returned
[MapView] mapList slow operation { durationMs: X, farmCount: Y }
[MapView] mapList result size exceeds threshold { totalFarms: X }
[MapView] mapList failed after Xs: { code: '...', message: '...' }
```

---

#### `farms.consistencyCheck`

**Purpose**: Validates data quality between Map View and Dashboard/Analytics

**Location**: `server/routers.ts` → `farms.consistencyCheck`

**Input**: None (no parameters)

**Output**:
```typescript
{
  totalFarms: number;
  farmsWithCoordinates: number;
  missingCoordinateCount: number;
  missingCoordinatePercentage: number; // 0-100
  distinctCropsTotal: number;
  distinctCropsWithCoordinates: number;
  distinctBarangaysTotal: number;
  distinctBarangaysWithCoordinates: number;
}
```

**Key Features**:
- Fetches all farms (no coordinate filter) and farms with coordinates
- Calculates distinct crops and barangays using Sets
- Emits metrics via `recordMapViewMetric("consistency_check", ...)`
- Performance warnings if operation > 1.5s
- User-friendly error messages

**Logging**:
```
[MapView] Running consistencyCheck...
[MapView] consistencyCheck completed in Xs: totalFarms=Y, farmsWithCoordinates=Z, missingCoordinatePercentage=W%
[MapView] consistencyCheck slow operation { durationMs: X }
[MapView] consistencyCheck failed after Xs: { code: '...', message: '...' }
```

**Metrics Emission**:
```json
{
  "type": "mapview_metric",
  "event": "consistency_check",
  "ts": "2024-01-15T10:30:00.000Z",
  "totalFarms": 4977,
  "farmsWithCoordinates": 4850,
  "missingCoordinateCount": 127,
  "missingCoordinatePercentage": 2.55,
  "distinctCropsTotal": 13,
  "distinctCropsWithCoordinates": 13,
  "distinctBarangaysTotal": 20,
  "distinctBarangaysWithCoordinates": 20
}
```

---

### Shared Database Query

#### `getAllFarmsBaseQuery()`

**Purpose**: Shared base query for consistency across Dashboard, Analytics, and Map View

**Location**: `server/db.ts`

**Signature**:
```typescript
export async function getAllFarmsBaseQuery(filters?: {
  search?: string;
  startDate?: string;
  endDate?: string;
  excludeMissingCoordinates?: boolean; // For Map View
}): Promise<Farm[]>
```

**Key Features**:
- Returns consistent field set: `id, name, farmerName, latitude, longitude, municipality, barangay, size, crops, status, averageYield, registrationDate`
- Coordinate filtering when `excludeMissingCoordinates: true`:
  - Checks: `IS NOT NULL`, `!= ''`, `!= 0` for both latitude and longitude
  - Excludes farms at 0,0 (not valid in Philippines)
- Used by `getFarmsByUserId()` for backward compatibility

**Coordinate Filtering Logic**:
```sql
WHERE latitude IS NOT NULL
  AND longitude IS NOT NULL
  AND CAST(latitude AS CHAR) != ''
  AND CAST(longitude AS CHAR) != ''
  AND CAST(latitude AS DECIMAL(10,6)) != 0
  AND CAST(longitude AS DECIMAL(10,6)) != 0
```

---

## Frontend Architecture

### Component: `FarmMap.tsx`

**Location**: `client/src/pages/FarmMap.tsx`

**Key Features**:
- Uses `trpc.farms.mapList.useQuery()` for map data
- Uses `trpc.farms.list.useQuery()` for integrity checks
- Viewport-based rendering for performance (> 100 markers)
- Simplified markers for large datasets (> 1000 markers)
- Coordinate validation before marker creation
- Error display in non-blocking card

**State Management**:
- `farms`: Data from `farms.mapList` (farms with coordinates)
- `allFarms`: Data from `farms.list` (all farms, for comparison)
- `filteredFarms`: Client-side filtered farms (by crop/region)
- `markers`: Google Maps marker instances
- `mapInstance`: Google Maps map instance

**Performance Optimizations**:
- Debounced filters (300ms delay)
- Memoized calculations (performance percentiles, unique crops)
- Viewport-based marker rendering (> 100 markers)
- Simplified markers for large datasets (> 1000 markers)
- Marker clustering (conceptual, not library-based)

---

## Design Decisions

### Guardrails

**Why**: Prevent oversized datasets from causing performance issues or crashes

**Implementation**:
- Warning at 50,000 farms (logged)
- Error at 200,000 farms (user-friendly message)

**Rationale**: 
- 50k farms is manageable with viewport rendering
- 200k farms likely indicates data issue (duplicate imports, etc.)

---

### Structured Metrics

**Why**: Enable monitoring and alerting via log aggregation systems

**Implementation**:
- `recordMapViewMetric()` emits structured JSON logs
- Vendor-agnostic format (can be scraped by Loki/Prometheus/Datadog)

**Rationale**:
- No dependency on specific monitoring stack
- Easy to parse and convert to metrics
- No PII in metrics (only counts and percentages)

---

### Viewport-Based Rendering

**Why**: Improve performance with large datasets

**Implementation**:
- Only show markers in current viewport when > 100 markers
- Update markers on map bounds change

**Rationale**:
- Reduces DOM manipulation
- Improves interaction smoothness
- Acceptable UX trade-off (users typically zoom/pan anyway)

---

### Coordinate Validation

**Why**: Prevent runtime errors from corrupted data

**Implementation**:
- `isValidCoordinate()` helper checks: not null, not NaN, not zero, within valid ranges (-90 to 90 for lat, -180 to 180 for lng)
- Invalid coordinates filtered before marker creation

**Rationale**:
- Graceful degradation (skip invalid farms, don't crash)
- User-friendly (map still works with some invalid data)

---

## Extension Points

### Adding New Filters

**Location**: `client/src/pages/FarmMap.tsx`

**Steps**:
1. Add filter state: `const [selectedFilter, setSelectedFilter] = useState<string>("all");`
2. Add filter UI in JSX (Select component)
3. Update `filteredFarms` useMemo to include new filter logic
4. Optionally add filter to backend `farms.mapList` input schema

**Example**:
```typescript
// Add status filter
const [selectedStatus, setSelectedStatus] = useState<string>("all");

// Update filteredFarms
const filteredFarms = useMemo(() => {
  if (!farms) return [];
  return farms.filter((farm) => {
    // ... existing filters ...
    if (selectedStatus !== "all" && farm.status !== selectedStatus) {
      return false;
    }
    return true;
  });
}, [farms, debouncedSelectedCrop, debouncedSelectedRegion, selectedStatus]);
```

---

### Adding New Metrics

**Location**: `server/routers.ts`

**Steps**:
1. Add metric field to `recordMapViewMetric()` payload type
2. Calculate metric in `farms.consistencyCheck`
3. Include in metrics object passed to `recordMapViewMetric()`

**Example**:
```typescript
// Add average farm size metric
const averageFarmSize = farmsWithCoords.reduce((sum, f) => sum + Number(f.size), 0) / farmsWithCoords.length;

const metrics = {
  // ... existing metrics ...
  averageFarmSize: parseFloat(averageFarmSize.toFixed(2)),
};
```

---

### Adjusting Guardrails

**Location**: `server/routers.ts` → `farms.mapList`

**Steps**:
1. Update threshold values:
   ```typescript
   if (result.length > NEW_THRESHOLD) {
     console.warn(`[MapView] mapList result size exceeds threshold`, { totalFarms: result.length });
   }
   ```
2. Update error threshold:
   ```typescript
   if (result.length > NEW_ERROR_THRESHOLD) {
     throw new TRPCError({ ... });
   }
   ```
3. Document changes in this file

---

### Adjusting Performance Warnings

**Location**: `server/routers.ts` → `farms.mapList` and `farms.consistencyCheck`

**Steps**:
1. Update duration thresholds:
   ```typescript
   if (duration > NEW_THRESHOLD_MS) {
     console.warn(`[MapView] mapList slow operation`, { durationMs: duration });
   }
   ```
2. Align with SLOs (see `docs/SLO-MAPVIEW.md`)

---

## Troubleshooting Guide

### Map View Not Loading

**Check Server Logs**:
```bash
tail -f server.log | grep "\[MapView\]"
```

**Expected Logs**:
```
[MapView] mapList called: search=no
[MapView] mapList completed in 0.45s: 4850 farms with coordinates returned
```

**If Error**:
```
[MapView] mapList failed after Xs: { code: '...', message: '...' }
```

**Actions**:
1. Check database connection
2. Verify `getAllFarmsBaseQuery()` is working
3. Check for oversized dataset (> 200k farms)

---

### Performance Issues

**Check Slow Operation Warnings**:
```bash
grep "slow operation" server.log
```

**Expected**: No warnings for normal operations (< 1s)

**If Warnings**:
```
[MapView] mapList slow operation { durationMs: 5000, farmCount: 10000 }
```

**Actions**:
1. Check database query performance (EXPLAIN)
2. Verify indexes exist (see `docs/INDEXES-SQL.sql`)
3. Consider pagination or filtering for large datasets

---

### Data Quality Issues

**Run Consistency Check**:
```typescript
// Via tRPC client or API
const metrics = await trpc.farms.consistencyCheck.query();
console.log(metrics);
```

**Check Metrics**:
- `missingCoordinatePercentage > 10%` → Data quality issue
- `missingCoordinatePercentage > 20%` → Critical data quality issue

**Actions**:
1. Identify farms without coordinates (SQL query)
2. Update coordinates via Admin CSV Upload
3. Investigate root cause (recent imports, data migration)

---

### Database Queries

**Total Farms**:
```sql
SELECT COUNT(*) FROM farms;
```

**Farms with Coordinates**:
```sql
SELECT COUNT(*) FROM farms 
WHERE latitude IS NOT NULL 
  AND longitude IS NOT NULL
  AND CAST(latitude AS CHAR) != ''
  AND CAST(longitude AS CHAR) != ''
  AND CAST(latitude AS DECIMAL(10,6)) != 0
  AND CAST(longitude AS DECIMAL(10,6)) != 0;
```

**Farms Without Coordinates**:
```sql
SELECT id, name, latitude, longitude 
FROM farms 
WHERE latitude IS NULL 
   OR longitude IS NULL
   OR CAST(latitude AS CHAR) = ''
   OR CAST(longitude AS CHAR) = ''
   OR CAST(latitude AS DECIMAL(10,6)) = 0
   OR CAST(longitude AS DECIMAL(10,6)) = 0;
```

---

## Expected Outputs

### Normal Operation

**Server Logs**:
```
[MapView] mapList called: search=no
[MapView] mapList completed in 0.45s: 4850 farms with coordinates returned
```

**Browser Console** (Development):
```
[MapIntegrity] 127 farms (2.55%) missing coordinates - within normal range (<5%).
```

**Metrics** (Structured JSON):
```json
{"type":"mapview_metric","event":"consistency_check","ts":"...","totalFarms":4977,"farmsWithCoordinates":4850,...}
```

---

### Error Scenarios

**Database Connection Error**:
```
[MapView] mapList failed after 0.12s: { code: 'ECONNREFUSED', message: 'Connection refused' }
```

**Oversized Dataset**:
```
[MapView] mapList result size exceeds safe limit { totalFarms: 250000 }
[MapView] mapList failed after 0.05s: { code: 'INTERNAL_SERVER_ERROR', message: 'Map data set is too large...' }
```

**Slow Operation**:
```
[MapView] mapList slow operation { durationMs: 5000, farmCount: 10000 }
[MapView] mapList completed in 5.00s: 10000 farms with coordinates returned
```

---

## Related Documents

- **SLOs**: `docs/SLO-MAPVIEW.md`
- **Alerting**: `docs/ALERTING-MAPVIEW.md`
- **Runbook**: `docs/RUNBOOK-MAPVIEW.md`
- **Failure Scenarios**: `docs/FAILURE-SCENARIOS-MAPVIEW.md`
- **Consistency QA**: `docs/QA-MAPVIEW-CONSISTENCY.md`

---

**Last Updated**: Pre-Production QA  
**Version**: 1.0
