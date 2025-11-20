# Map View Consistency - QA Pass 4 Report

**Date**: Pre-Production QA  
**Feature**: Map View Data Consistency with Dashboard and Analytics  
**Status**: ✅ Complete

---

## Overview

This document summarizes the consistency validation and fixes for the Map View feature, ensuring that Dashboard, Analytics, and Map View all operate on the same farm dataset (with Map View excluding farms without coordinates).

---

## STEP 1 - Backend Data Consistency

### Root Cause Analysis

**Before Fix**:
- **Dashboard**: Used `trpc.farmers.list` and `trpc.farmers.count` (farmer data, not farm data directly)
- **Analytics**: Used `trpc.farms.list` → `getFarmsByUserId()` (all farms, no coordinate filtering)
- **Map View**: Used `trpc.farms.list` → `getFarmsByUserId()` (all farms, no coordinate filtering)

**Issues Identified**:
1. ❌ No shared base query - each view could potentially use different filters
2. ❌ Map View didn't exclude farms without coordinates
3. ❌ `getFarmsByUserId` had inconsistent implementation (userId filter removed for demo)

### Solution Implemented

**1. Created Shared Base Query** (`getAllFarmsBaseQuery`):
- **Location**: `server/db.ts`
- **Returns**: `id, name, farmerName, latitude, longitude, municipality, barangay, size, crops, status, averageYield, registrationDate`
- **Features**:
  - Optional `excludeMissingCoordinates` filter (for Map View)
  - Consistent field selection across all views
  - No PII in strict sense (farm names, not personal identifiers)

**2. Updated `getFarmsByUserId`**:
- Now delegates to `getAllFarmsBaseQuery` for consistency
- Maintains backward compatibility
- Ensures all views use the same data source

**3. Added `farms.mapList` tRPC Endpoint**:
- **Location**: `server/routers.ts`
- **Purpose**: Map View-specific endpoint that excludes farms without coordinates
- **Logging**: Structured `[MapView]` prefix logs
- **Filter**: `excludeMissingCoordinates: true`

### Coordinate Filtering Logic

The `excludeMissingCoordinates` filter checks:
- `latitude IS NOT NULL`
- `longitude IS NOT NULL`
- `latitude != ''` (not empty string)
- `longitude != ''` (not empty string)
- `latitude != 0` (not zero - 0,0 is not a valid farm location in Philippines)
- `longitude != 0` (not zero)

---

## STEP 2 - Frontend Consistency

### Changes Made

**1. FarmMap.tsx**:
- ✅ Updated to use `trpc.farms.mapList.useQuery()` instead of `trpc.farms.list.useQuery()`
- ✅ Added integrity checks (non-breaking, logs warnings only)
- ✅ Fetches both `mapList` (for rendering) and `list` (for comparison)

**2. Integrity Checks Implemented**:

#### `detectMissingCoordinateFarms()`
- Compares `mapCount` vs `dashboardCount`
- Warns if missing coordinate farms > 5% of total
- Logs: `[MapIntegrity] X farms (Y%) missing coordinates`

#### `detectCropMismatch()`
- Compares crop types between Map View and Dashboard
- Warns if crop types exist in Dashboard but not in Map View
- Logs: `[MapIntegrity] Crop type mismatch: X crop types...`

#### `detectRegionMismatch()`
- Compares barangays and municipalities between views
- Warns if regions exist in Dashboard but not in Map View
- Logs: `[MapIntegrity] Barangay/Municipality mismatch...`

**3. Analytics.tsx**:
- ✅ Already uses `trpc.farms.list.useQuery()` (consistent with Dashboard)
- ✅ No changes needed

**4. ManagerDashboard.tsx**:
- ✅ Uses `trpc.farmers.list` and `trpc.farmers.count` (farmer data, not farm data)
- ✅ Calculates `activeFarms` from farmer data (sum of `farmCount`)
- ✅ No changes needed (different metric - farmers vs farms)

---

## STEP 3 - Consistency Validation

### Query Alignment Summary

| View | Endpoint | Base Query | Coordinate Filter | Status |
|------|----------|------------|-------------------|--------|
| **Dashboard** | `farmers.list` / `farmers.count` | `getFarmers()` | N/A (farmer data) | ✅ Consistent |
| **Analytics** | `farms.list` | `getAllFarmsBaseQuery()` | No (shows all farms) | ✅ Consistent |
| **Map View** | `farms.mapList` | `getAllFarmsBaseQuery()` | Yes (excludes missing coords) | ✅ Consistent |

### Expected Behavior

**Dashboard**:
- Shows farmer count (users with role='user' who own ≥1 farm)
- Shows active farms count (sum of `farmCount` from farmers)
- **Note**: This is a different metric than total farms

**Analytics**:
- Shows all farms (via `farms.list`)
- Includes farms with and without coordinates
- Total farms count = all farms in database

**Map View**:
- Shows only farms with valid coordinates (via `farms.mapList`)
- Excludes farms where `latitude` or `longitude` is null, empty, or zero
- Total farms count = farms with coordinates only

### Consistency Rules

1. **Map View count ≤ Analytics count** (expected, due to coordinate filtering)
2. **Missing coordinate farms < 5%** (normal range)
3. **Crop types in Map View ⊆ Crop types in Analytics** (expected, due to coordinate filtering)
4. **Barangays in Map View ⊆ Barangays in Analytics** (expected, due to coordinate filtering)

---

## STEP 4 - Discovered Issues and Resolutions

### Issue 1: No Coordinate Filtering in Map View

**Problem**: Map View showed all farms, including those without coordinates (would cause map errors)

**Resolution**: 
- Created `farms.mapList` endpoint with `excludeMissingCoordinates: true`
- Updated FarmMap.tsx to use `farms.mapList`

**Status**: ✅ Fixed

### Issue 2: Inconsistent Base Queries

**Problem**: `getFarmsByUserId` had different implementation than needed for consistency

**Resolution**:
- Created `getAllFarmsBaseQuery()` as shared base query
- Updated `getFarmsByUserId` to delegate to shared query
- Ensured all views use same data source

**Status**: ✅ Fixed

### Issue 3: No Integrity Validation

**Problem**: No way to detect if Map View and Dashboard/Analytics were out of sync

**Resolution**:
- Added integrity checks in FarmMap.tsx
- Logs warnings when inconsistencies detected
- Non-breaking (doesn't affect functionality)

**Status**: ✅ Fixed

---

## Known Limitations

1. **Dashboard Shows Different Metric**:
   - Dashboard shows "Total Farmers" (user count) and "Active Farms" (sum of farmCount from farmers)
   - This is intentionally different from "Total Farms" in Analytics/Map View
   - **Not a bug** - different business metrics

2. **Coordinate Filtering is Strict**:
   - Farms with `latitude=0, longitude=0` are excluded (0,0 is not in Philippines)
   - Farms with empty strings are excluded
   - Farms with null values are excluded
   - **Expected behavior** - only mappable farms should appear

3. **Integrity Checks Run Client-Side**:
   - Checks compare Map View data vs Dashboard/Analytics data
   - Requires both queries to complete
   - **Acceptable** - checks are non-blocking and for observability only

4. **No Server-Side Validation**:
   - No backend endpoint to validate consistency
   - **Future Enhancement** - could add `farms.consistencyCheck` endpoint

---

## Pass/Fail Status

### ✅ Backend Consistency: PASS
- Shared base query implemented
- `farms.mapList` endpoint created
- Coordinate filtering working correctly
- Structured logging added

### ✅ Frontend Consistency: PASS
- Map View uses `farms.mapList`
- Analytics uses `farms.list` (consistent with shared base)
- Integrity checks implemented
- No breaking changes

### ✅ Data Validation: PASS
- Integrity checks log warnings appropriately
- Missing coordinate farms detected
- Crop/region mismatches detected
- No PII in logs

### ✅ Documentation: PASS
- This document created
- Code comments added
- Known limitations documented

---

## Testing Instructions

### Manual Testing

1. **Start Dev Server**:
   ```bash
   pnpm dev
   ```

2. **Navigate to Map View**:
   - Open `http://localhost:3001/map`
   - Open browser DevTools → Console

3. **Check Integrity Logs**:
   - Look for `[MapIntegrity]` messages
   - Verify missing coordinate farms < 5%
   - Check for crop/region mismatch warnings

4. **Compare Counts**:
   - Map View: Check farm count badge
   - Analytics: Check "Total Farms" metric
   - Verify: `Map Count ≤ Analytics Count`

5. **Database Verification**:
   ```sql
   -- Total farms
   SELECT COUNT(*) FROM farms;
   
   -- Farms with coordinates
   SELECT COUNT(*) FROM farms 
   WHERE latitude IS NOT NULL 
     AND longitude IS NOT NULL
     AND CAST(latitude AS CHAR) != ''
     AND CAST(longitude AS CHAR) != ''
     AND CAST(latitude AS DECIMAL(10,6)) != 0
     AND CAST(longitude AS DECIMAL(10,6)) != 0;
   
   -- Farms without coordinates
   SELECT COUNT(*) FROM farms 
   WHERE latitude IS NULL 
      OR longitude IS NULL
      OR CAST(latitude AS CHAR) = ''
      OR CAST(longitude AS CHAR) = ''
      OR CAST(latitude AS DECIMAL(10,6)) = 0
      OR CAST(longitude AS DECIMAL(10,6)) = 0;
   ```

---

## Recommended Improvements for Pass 5 (Observability)

1. **Server-Side Consistency Endpoint**:
   - Add `farms.consistencyCheck` tRPC endpoint
   - Returns: `{ totalFarms, farmsWithCoordinates, missingCoordinateCount, missingCoordinatePercentage }`
   - Can be called by monitoring/alerting systems

2. **Metrics Emission**:
   - Add structured JSON logs for consistency metrics
   - Similar to `recordAdminCsvMetric` pattern
   - Emit: `mapview_consistency_check` events

3. **Alerting Thresholds**:
   - Alert if missing coordinate farms > 10% (P2)
   - Alert if missing coordinate farms > 20% (P1)
   - Alert if crop/region mismatches > 5% (P3)

4. **Dashboard Widget**:
   - Add "Data Quality" widget showing:
     - Total farms
     - Farms with coordinates
     - Missing coordinate percentage
     - Link to fix missing coordinates

---

## Files Modified

1. **`server/db.ts`**:
   - Added `getAllFarmsBaseQuery()` function
   - Updated `getFarmsByUserId()` to use shared query
   - Added `isNotNull` import

2. **`server/routers.ts`**:
   - Added `farms.mapList` endpoint
   - Added structured logging with `[MapView]` prefix

3. **`client/src/pages/FarmMap.tsx`**:
   - Updated to use `trpc.farms.mapList.useQuery()`
   - Added integrity checks (missing coordinates, crop mismatch, region mismatch)
   - Added comparison query (`trpc.farms.list.useQuery()`)

---

## Summary

**Root Cause of Inconsistencies**: 
- Map View was using the same endpoint as Analytics but didn't filter out farms without coordinates
- No shared base query meant potential for different filters/implementations

**Backend Changes**:
- Created `getAllFarmsBaseQuery()` shared function
- Added `farms.mapList` endpoint with coordinate filtering
- Updated `getFarmsByUserId` to use shared query

**Frontend Changes**:
- Updated FarmMap.tsx to use `farms.mapList`
- Added integrity checks for observability
- No breaking changes

**Recommended Improvements**:
- Server-side consistency check endpoint
- Metrics emission for monitoring
- Alerting thresholds
- Dashboard data quality widget

**Status**: ✅ **PASS** - All consistency requirements met

---

---

## Pass 5 — Observability & Metrics

### Overview

Pass 5 focused on adding observability, metrics, and alertability to the Map View feature without changing business logic.

### Implementation

**1. Metrics Helper** (`recordMapViewMetric`):
- **Location**: `server/routers.ts`
- **Purpose**: Emit structured JSON logs for log aggregation systems (Loki/Prometheus/Datadog)
- **Format**: `{ type: "mapview_metric", event: "consistency_check", ts: "...", ...payload }`
- **PII Safety**: Only counts and percentages, no farmer names, emails, or raw barangay names
- **Vendor-Agnostic**: Intentionally designed to be scraped by any log aggregation system

**2. Consistency Check Endpoint** (`farms.consistencyCheck`):
- **Location**: `server/routers.ts`
- **Purpose**: Validate data quality between Map View and Dashboard/Analytics
- **Returns**: 
  - `totalFarms`, `farmsWithCoordinates`, `missingCoordinateCount`, `missingCoordinatePercentage`
  - `distinctCropsTotal`, `distinctCropsWithCoordinates`
  - `distinctBarangaysTotal`, `distinctBarangaysWithCoordinates`
- **Logging**: Structured `[MapView]` prefix logs + metric emission via `recordMapViewMetric()`

**3. Frontend Diagnostics**:
- **Location**: `client/src/pages/FarmMap.tsx`
- **Feature**: Data Quality panel (development only)
- **Display**: Shows consistency metrics in a non-invasive card
- **Note**: In production, these metrics will be surfaced in a dedicated Data Quality widget

### Metric Shape

**JSON Structure**:
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

### Alert Thresholds

**P1 (Critical)**:
- `missingCoordinatePercentage > 20%` for 15+ minutes → Page on-call engineer

**P2 (High)**:
- `missingCoordinatePercentage > 10%` for 60+ minutes → Create incident ticket

**P3 (Medium)**:
- No `mapview_metric` events in last 60 minutes → Notify on-call (monitoring issue)

### Where to View Metrics

**Development**:
- Map View page (`/map`) shows Data Quality panel (dev only)
- Browser console shows `[MapIntegrity]` warnings
- Server logs show `[MapView]` structured logs

**Production** (Future):
- Dedicated Data Quality widget in Dashboard
- Metrics dashboard (Loki/Prometheus/Datadog)
- Alert notifications via PagerDuty/Slack

### Files Modified

1. **`server/routers.ts`**:
   - Added `recordMapViewMetric()` helper
   - Added `farms.consistencyCheck` endpoint

2. **`client/src/pages/FarmMap.tsx`**:
   - Added `trpc.farms.consistencyCheck.useQuery()` hook
   - Added Data Quality panel (dev only)

3. **`docs/SLO-MAPVIEW.md`** (NEW):
   - Service Level Objectives definition
   - Availability, Latency, Data Correctness SLOs
   - Error budget calculations

4. **`docs/ALERTING-MAPVIEW.md`** (NEW):
   - Alert definitions (P1/P2/P3)
   - Alert conditions and actions
   - Integration guidance

---

## Pass 6 — Failure Simulation & Resilience

### Overview

Pass 6 focused on hardening Map View against failures and ensuring graceful degradation under adverse conditions. No new features were added; only resilience improvements.

### Implementation

**1. Error Handling Hardening**:
- **Location**: `server/routers.ts`
- **Changes**:
  - Added `toSafeErrorSummary()` helper to sanitize error logs (no PII, no stack traces)
  - Wrapped `farms.mapList` and `farms.consistencyCheck` in try/catch
  - Added DB connection error detection
  - User-friendly error messages: "Map data is temporarily unavailable" or "Map data could not be loaded due to a database connection issue"
  - Structured error logging with `[MapView]` prefix

**2. Frontend Resilience**:
- **Location**: `client/src/pages/FarmMap.tsx`
- **Changes**:
  - Added `isValidCoordinate()` helper to validate coordinates
  - Skip farms with invalid coordinates during marker creation (defensive check)
  - Display user-friendly error messages in UI (red card)
  - Handle `mapListError` state gracefully

**3. Guardrails**:
- **Oversized Dataset Protection**:
  - Warning logged if result set > 50,000 farms
  - Error returned if result set > 200,000 farms
  - Prevents browser memory issues and ensures reasonable performance

- **Slow Operation Detection**:
  - Warning logged if `mapList` takes > 1s
  - Warning logged if `consistencyCheck` takes > 1.5s
  - Helps identify performance degradation

**4. Coordinate Validation**:
- **Backend**: Coordinate filtering in `getAllFarmsBaseQuery` (already implemented in Pass 4)
- **Frontend**: Additional `isValidCoordinate()` check to skip invalid farms during marker creation
- **Validation Rules**:
  - Not null
  - Not empty string
  - Not zero (0,0)
  - Within valid range (-90 to 90 for lat, -180 to 180 for lng)
  - Not NaN

### Failure Scenarios Tested

**1. DB Slowdown**:
- **Simulation**: Added 800ms artificial delay
- **Result**: ✅ UI shows loading state, no blank screen, operation completes successfully
- **Logs**: Slow operation warning logged if > 1s

**2. DB Outage**:
- **Simulation**: Broke `DATABASE_URL` (wrong port)
- **Result**: ✅ User sees friendly error message, no crash, logs show safe error summary
- **Error Message**: "Map data could not be loaded due to a database connection issue. Please try again."

**3. Corrupted Data**:
- **Simulation**: Inserted farms with null, zero, and extreme coordinates
- **Result**: ✅ Invalid farms skipped during marker creation, no runtime errors, integrity checks still work
- **Logs**: Warnings for skipped farms logged

**4. Oversized Dataset**:
- **Simulation**: Generated 50,000+ farms
- **Result**: ✅ Warning logged at 50k, error returned at 200k, viewport-based rendering keeps performance acceptable
- **Guardrails**: Prevent browser memory issues

### Known Limitations

1. **tRPC Timeout**: If tRPC timeout is configured very low (< 1s), slow operations may timeout
2. **Browser Memory**: Extremely large datasets (> 100k farms) may cause browser memory issues (mitigated by 200k limit)
3. **Viewport Rendering**: Viewport-based rendering may miss farms just outside visible area during initial load (acceptable trade-off)

### Files Modified

1. **`server/routers.ts`**:
   - Added `toSafeErrorSummary()` helper
   - Hardened `farms.mapList` error handling
   - Hardened `farms.consistencyCheck` error handling
   - Added guardrails for oversized datasets
   - Added slow operation warnings

2. **`client/src/pages/FarmMap.tsx`**:
   - Added `isValidCoordinate()` helper
   - Added error display UI
   - Added defensive coordinate validation in marker creation

3. **`docs/FAILURE-SCENARIOS-MAPVIEW.md`** (NEW):
   - Step-by-step failure simulation guide
   - Expected behavior for each scenario
   - Cleanup procedures

4. **`docs/RUNBOOK-MAPVIEW.md`** (NEW):
   - Incident response procedures
   - Troubleshooting flows
   - Escalation criteria

---

**Last Updated**: Pre-Production QA  
**Version**: 1.2 (Added Pass 6)

