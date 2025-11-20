# Farm Detail View - Data Consistency & Integrity QA

**Date**: Pass 3 - Data Consistency & Integrity QA  
**Feature**: Farm Detail View  
**Status**: ✅ Complete

---

## Overview

This document summarizes the data consistency and integrity checks for the Farm Detail View, ensuring it aligns with other views (Farmers page, Map View, Analytics) and maintains data integrity for individual farms.

---

## Consistency Checks Implemented

### 1. Cross-Feature Consistency

**Goal**: Ensure Farm Detail data matches data shown in other views.

**Implementation**:
- Added `trpc.farms.list.useQuery()` to fetch the same farm from the list endpoint
- Compare farm data from `farms.getById` (Farm Detail) with `farms.list` (used by Farms page, Analytics, Map View)
- Log warnings with `[FarmDetailIntegrity]` prefix if inconsistencies are detected

**Checks Performed**:
1. **Coordinates Consistency**: Compare lat/lng between detail and list views
   - Tolerance: 0.0001 degrees (~11 meters)
   - Warning if mismatch detected

2. **Status Consistency**: Compare farm status
   - Should match exactly

3. **Crop Types Consistency**: Compare crops array
   - Checks both size and contents (set comparison)

4. **Location Consistency**: Compare barangay and municipality
   - Should match exactly

5. **Size Consistency**: Compare farm size
   - Tolerance: 0.01 hectares (allows for floating point differences)

**Files Modified**: `client/src/pages/FarmDetail.tsx`

**Impact**: Non-breaking warnings help detect data inconsistencies early without crashing the UI.

---

### 2. Data Completeness Checks

**Goal**: Detect incomplete or suspicious data for individual farms.

**Implementation**:
- Added `useEffect` hooks that run after farm data loads
- Log warnings for data quality issues

**Checks Performed**:
1. **Active Farm with No Yields**:
   - Warning if `status === 'active'` and `yieldRecords.length === 0`
   - Indicates potentially incomplete data

2. **Missing/Invalid Coordinates**:
   - Checks for `(0, 0)` or `NaN` coordinates
   - Warning logged if coordinates are invalid

3. **Size vs Parcel Areas Mismatch**:
   - Compares registered farm size with calculated boundary area
   - Warning if difference > 20% (indicates potential data entry error)

4. **Empty Crops Array**:
   - Warning if farm has no crops listed
   - Indicates incomplete farm profile

**Files Modified**: `client/src/pages/FarmDetail.tsx`

**Impact**: Helps identify data quality issues that may need manual review.

---

## Query Consistency

### Current Implementation

**`farms.getById`**:
- Uses direct `db.select().from(farms).where(eq(farms.id, id))`
- Returns full farm record (including `userId`, `createdAt`, etc.)
- Used by Farm Detail View

**`farms.list`** (via `getFarmsByUserId` → `getAllFarmsBaseQuery`):
- Uses shared base query pattern
- Returns subset of fields (non-PII, for consistency across views)
- Used by Farms page, Analytics, Map View

**Analysis**:
- ✅ **Acceptable**: `getFarmById` needs full record (including `userId` for farmer link)
- ✅ **Consistent**: Both queries read from the same `farms` table
- ✅ **Verified**: Integrity checks compare data from both endpoints

**No changes needed** - the current implementation is correct. `getFarmById` intentionally returns more fields than the shared base query.

---

## Heavy Farm Generator

**Purpose**: Create test data for load testing and consistency verification.

**Script**: `scripts/generate-heavy-farm.ts`

**Features**:
- Creates 1 farm with:
  - 200 yield records (spread over 2 years, 3 crops, 3 parcels)
  - 150 cost records (6 categories, some apply to all parcels)
- Uses existing demo user or creates one
- Batch inserts (50 records at a time) for performance

**Usage**:
```bash
pnpm tsx scripts/generate-heavy-farm.ts
```

**Output**:
- Farm ID for viewing in Farm Detail
- Console logs showing progress
- Summary of created records

**Files Created**: `scripts/generate-heavy-farm.ts`

---

## Testing Performed

### Test Scenarios

1. **Normal Farm** (5 yields, 3 costs):
   - ✅ No integrity warnings
   - ✅ Data matches between detail and list views

2. **Heavy Farm** (200 yields, 150 costs):
   - ✅ Integrity checks run without performance impact
   - ✅ Warnings logged appropriately (if any inconsistencies)
   - ✅ Pagination works correctly

3. **Farm with Missing Data**:
   - ✅ Warnings logged for:
     - Missing coordinates
     - Active farm with no yields
     - Empty crops array

4. **Farm with Size Mismatch**:
   - ✅ Warning logged when calculated boundary area differs >20% from registered size

---

## Known Limitations

1. **Integrity Checks are Dev-Only**:
   - Currently run in all environments
   - Consider gating behind `import.meta.env.DEV` if console noise becomes an issue

2. **No Automatic Fixes**:
   - Checks only log warnings
   - Data inconsistencies must be fixed manually or via data migration

3. **List Query Dependency**:
   - Integrity checks require `farms.list` to be fetched
   - Adds one extra query (acceptable for consistency verification)

4. **Coordinate Tolerance**:
   - 0.0001 degree tolerance may be too strict for some use cases
   - Can be adjusted if needed

---

## Recommendations

1. **For Production**:
   - Monitor `[FarmDetailIntegrity]` logs in production
   - Set up alerts if integrity warnings exceed threshold (e.g., >5% of farms)
   - Investigate and fix root causes of inconsistencies

2. **Future Enhancements**:
   - Add integrity check endpoint (`farms.integrityCheck`) for programmatic access
   - Create admin dashboard showing farms with integrity issues
   - Add data repair utilities for common inconsistencies

---

## Files Modified

1. `client/src/pages/FarmDetail.tsx`:
   - Added `trpc.farms.list.useQuery()` for consistency comparison
   - Added integrity check `useEffect` hooks
   - Added data completeness check `useEffect` hooks

2. `scripts/generate-heavy-farm.ts` (NEW):
   - Heavy farm generator script
   - Creates 200 yields and 150 costs for testing

---

## Testing Checklist

- [x] Normal farm shows no integrity warnings
- [x] Heavy farm (200 yields, 150 costs) loads correctly
- [x] Integrity checks compare detail vs list data
- [x] Warnings logged for missing coordinates
- [x] Warnings logged for active farm with no yields
- [x] Warnings logged for size mismatches
- [x] Warnings logged for empty crops
- [x] No PII in integrity logs (only farm IDs)
- [x] Heavy farm generator script works
- [x] Integrity checks don't impact performance

---

---

## Pass 5 — Failure & Resilience QA Summary

### ✅ DB Slowdown Handling

1. **Performance Warnings**:
   - Added slow operation detection in `farms.getById` (warns if > 1s)
   - Logs use `[FarmDetail]` prefix with `farmId` and `durationMs` (no PII)
   - Artificial delay available for testing (commented out, dev-only)

2. **Frontend Loading States**:
   - Verified loading spinner/indicator works correctly
   - No blank screens or crashes during slow operations
   - Metrics emit correctly even with slow DB

### ✅ DB Outage Handling

1. **Enhanced Error Categorization**:
   - `categorizeFarmDetailError()` now detects:
     - `ECONNREFUSED`, `ETIMEDOUT`, `ENOTFOUND`
     - `PROTOCOL_CONNECTION_LOST`, `ER_ACCESS_DENIED_ERROR`
     - Connection-related error messages
   - Maps all DB connection errors to `errorCategory: "db_error"`

2. **User-Friendly Error Messages**:
   - DB errors return: "Farm data could not be loaded due to a temporary database issue. Please try again."
   - Errors sanitized via `toSafeErrorSummary()` (no connection strings, no stack traces)
   - Frontend displays friendly error messages in cards/banners

3. **Metrics**:
   - `view_failed` metric emitted with `errorCategory: "db_error"`
   - Duration tracked even for failed requests

### ✅ Corrupted Data Handling

1. **Enhanced Defensive Parsing**:
   - Yield records: Skip invalid quantities (NaN, Infinity, negative), invalid dates
   - Cost records: Skip invalid amounts (NaN, Infinity, negative), invalid dates
   - Log warnings in dev mode only (no PII, only farmId and index)

2. **Calculation Safety**:
   - `YieldSummaryStats`: Skips invalid quantities/areas, prevents division by zero
   - `CostSummaryStats`: Skips invalid amounts
   - `ProfitabilityAnalysis`: Handles NaN/Infinity, clamps values to reasonable ranges
   - All calculations ensure finite, valid results

3. **Integrity Checks**:
   - Enhanced checks for invalid coordinates (NaN, Infinity, 0,0)
   - Checks for active farms with 0 yields AND 0 costs
   - Size mismatch checks prevent division by zero

### ✅ Oversized Dataset Handling

1. **Heavy Farm Generator Extended**:
   - Configurable via environment variables: `YIELDS_COUNT`, `COSTS_COUNT`
   - Default: 200 yields, 150 costs
   - Can generate 500+ yields, 300+ costs for stress testing

2. **Guardrails**:
   - Warning logs if yields > 1000 or costs > 1000
   - Logs use `[FarmDetail]` prefix with `farmId` (no PII)
   - Does not fail requests, just documents behavior

3. **Performance Validation**:
   - Pagination works correctly for large lists
   - Summary stats calculate from all records (not just displayed)
   - No memory leaks or browser crashes observed

### 📝 Documentation Created

1. **`docs/FAILURE-SCENARIOS-FARMDETAIL.md`**:
   - DB slowdown simulation steps
   - DB outage simulation steps
   - Corrupted data simulation steps
   - Oversized dataset simulation steps
   - Expected behavior and cleanup for each scenario

2. **`docs/RUNBOOK-FARMDETAIL.md`**:
   - Quick reference and triage flow
   - Common scenarios with symptoms, triage steps, remediation
   - Escalation procedures
   - Prevention guidelines

### Files Modified

1. `server/routers.ts`:
   - Added slow operation warning (if > 1s)
   - Enhanced `categorizeFarmDetailError()` for DB errors
   - Added user-friendly error messages for DB errors
   - Added artificial delay (commented, for testing)

2. `client/src/pages/FarmDetail.tsx`:
   - Enhanced defensive parsing for yields and costs
   - Enhanced calculation safety (NaN/Infinity protection)
   - Enhanced integrity checks
   - Added oversized dataset guardrails

3. `scripts/generate-heavy-farm.ts`:
   - Added configurable record counts via env vars
   - Updated documentation

---

**Last Updated**: Pass 5 - Failure & Resilience QA  
**Version**: 2.0

