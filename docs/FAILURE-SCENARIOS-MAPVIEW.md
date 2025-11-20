# Map View - Failure Scenarios & Testing

**Date**: Pre-Production QA  
**Feature**: Map View Resilience & Failure Handling  
**Status**: ✅ Documented

---

## Overview

This document describes how to simulate various failure scenarios for the Map View feature and what to expect in terms of user-visible behavior, logs, and recovery.

---

## Scenario 1: DB Slowdown

### How to Simulate

**Option A: Add Temporary Delay in Code** (Recommended for testing)

1. Open `server/routers.ts`
2. Locate `farms.mapList` or `farms.consistencyCheck` handler
3. Add temporary delay at the start of the handler:

```typescript
const startTime = Date.now();
// TEMP: Simulate DB slowdown
await new Promise((resolve) => setTimeout(resolve, 800));
// ... existing logic ...
```

4. Run `pnpm dev`
5. Open Map View page
6. Observe behavior

**Option B: Throttle Database Connection**

- Use MySQL connection throttling tools or network delay simulation
- Not recommended for local testing (complex setup)

### Expected User-Visible Behavior

- ✅ UI shows loading spinner/state (not blank screen)
- ✅ No client-side errors in browser console
- ✅ Map eventually loads (unless timeout configured very low)
- ✅ No tRPC timeout errors (default timeout is usually 30s+)

### Expected Logs

**Normal Operation (< 1s)**:
```
[MapView] mapList called: search=no
[MapView] mapList completed in 0.45s: 4850 farms with coordinates returned
```

**Slow Operation (> 1s)**:
```
[MapView] mapList called: search=no
[MapView] mapList slow operation { durationMs: 1200, resultCount: 4850 }
[MapView] mapList completed in 1.20s: 4850 farms with coordinates returned
```

### Cleanup Steps

1. Remove the temporary `await new Promise(...)` delay
2. Keep the duration logging if useful for monitoring
3. Restart dev server

---

## Scenario 2: DB Outage

### How to Simulate

**Option A: Break DATABASE_URL in .env** (Recommended)

1. Open `.env` file
2. Temporarily change `DATABASE_URL` to invalid connection:
   ```
   DATABASE_URL=mysql://wronguser:wrongpass@wronghost:3306/wrongdb
   ```
3. Save and restart dev server: `pnpm dev`
4. Open Map View page
5. Observe behavior

**Option B: Temporarily Throw Error in Code**

1. Open `server/db.ts`
2. Locate `getAllFarmsBaseQuery` function
3. Add at the start:
   ```typescript
   // TEMP: Simulate DB outage
   throw new Error("Simulated DB outage");
   ```
4. Run `pnpm dev`
5. Open Map View page
6. Observe behavior

### Expected User-Visible Behavior

- ✅ User sees friendly error message in UI:
  - "Map data could not be loaded due to a database connection issue. Please try again."
- ✅ No blank page / crash
- ✅ Error is displayed in a non-blocking way (card/alert, not full-page error)
- ✅ User can retry by refreshing page

### Expected Logs

**Server Logs**:
```
[MapView] mapList called: search=no
[MapView] mapList failed after 0.12s: { code: 'ECONNREFUSED', message: 'Connection refused' }
```

**Browser Console** (if enabled):
```
[FarmMap] Map data load failed: Map data could not be loaded due to a database connection issue. Please try again.
```

### Cleanup Steps

1. **If using Option A**: Restore correct `DATABASE_URL` in `.env` and restart server
2. **If using Option B**: Remove the `throw new Error(...)` line and restart server
3. Verify Map View loads normally after cleanup

---

## Scenario 3: Corrupted Data

### How to Simulate

**Option A: Insert Invalid Data via SQL**

1. Connect to MySQL database:
   ```bash
   mysql -h 127.0.0.1 -u root magsasa_demo
   ```

2. Insert or update farms with invalid coordinates:
   ```sql
   -- Insert farm with null coordinates
   INSERT INTO farms (userId, name, farmerName, latitude, longitude, size, crops, status, barangay, municipality)
   VALUES (1, 'Test Farm Null', 'Test Farmer', NULL, NULL, 1.0, '["Rice"]', 'active', 'Test', 'Test');
   
   -- Insert farm with zero coordinates
   INSERT INTO farms (userId, name, farmerName, latitude, longitude, size, crops, status, barangay, municipality)
   VALUES (1, 'Test Farm Zero', 'Test Farmer', 0, 0, 1.0, '["Rice"]', 'active', 'Test', 'Test');
   
   -- Insert farm with extreme coordinates
   INSERT INTO farms (userId, name, farmerName, latitude, longitude, size, crops, status, barangay, municipality)
   VALUES (1, 'Test Farm Extreme', 'Test Farmer', 999, 999, 1.0, '["Rice"]', 'active', 'Test', 'Test');
   ```

3. Run `pnpm dev`
4. Open Map View page
5. Observe behavior

**Option B: Update Existing Farms**

```sql
-- Update existing farms to have invalid coordinates
UPDATE farms SET latitude = NULL, longitude = NULL WHERE id = 1;
UPDATE farms SET latitude = 0, longitude = 0 WHERE id = 2;
UPDATE farms SET latitude = 999, longitude = 999 WHERE id = 3;
```

### Expected User-Visible Behavior

- ✅ No runtime errors when encountering "bad" farms
- ✅ Invalid farms are silently skipped (not rendered as markers)
- ✅ Farm count vs rendered markers makes sense (invalid farms excluded)
- ✅ Map loads successfully with valid farms only
- ✅ Browser console shows warnings for skipped farms (dev mode)

### Expected Logs

**Browser Console** (Development):
```
[FarmMap] Skipping farm 123 with invalid coordinates: lat=null, lng=null
[FarmMap] Skipping farm 124 with invalid coordinates after parse: lat=0, lng=0
[MapIntegrity] 3 farms (0.06%) missing coordinates - within normal range (<5%).
```

**Server Logs**:
```
[MapView] mapList completed in 0.45s: 4850 farms with coordinates returned
```

### Cleanup Steps

1. Remove test farms or restore valid coordinates:
   ```sql
   DELETE FROM farms WHERE name LIKE 'Test Farm%';
   -- OR
   UPDATE farms SET latitude = 14.123, longitude = 121.456 WHERE latitude IS NULL OR latitude = 0;
   ```

2. Verify Map View shows correct farm count after cleanup

---

## Scenario 4: Oversized Result Sets

### How to Simulate

**Option A: Use Stress Test Script**

1. Use existing stress test script (if available):
   ```bash
   pnpm generate:stress-test-farms
   ```

2. Or create a script to generate 50,000+ farms:
   ```typescript
   // scripts/generate-stress-test-farms.ts
   // Generate 50,000 farms with valid coordinates
   ```

3. Seed database with large dataset
4. Run `pnpm dev`
5. Open Map View page
6. Observe behavior

**Option B: Manually Insert Large Dataset**

```sql
-- Insert 50,000 farms (use a script, not manual SQL)
-- This is just an example - use a proper script
```

### Expected User-Visible Behavior

**For 10,000 - 50,000 farms**:
- ✅ Map loads successfully
- ✅ Viewport-based rendering keeps interaction smooth
- ✅ Simplified markers used for large datasets (>1000 markers)
- ✅ No performance degradation noticeable

**For 50,000 - 200,000 farms**:
- ✅ Map loads but may be slower
- ✅ Warning logged: `[MapView] mapList result size exceeds threshold`
- ✅ Viewport-based rendering still keeps interaction smooth

**For > 200,000 farms**:
- ✅ User sees error: "Map data set is too large. Please contact support."
- ✅ No crash, graceful error handling

### Expected Logs

**Normal Size (< 50,000)**:
```
[MapView] mapList completed in 0.45s: 4850 farms with coordinates returned
```

**Large Size (50,000 - 200,000)**:
```
[MapView] mapList result size exceeds threshold { totalFarms: 75000 }
[MapView] mapList completed in 2.30s: 75000 farms with coordinates returned
```

**Oversized (> 200,000)**:
```
[MapView] mapList result size exceeds safe limit { totalFarms: 250000 }
[MapView] mapList failed after 0.05s: { code: 'INTERNAL_SERVER_ERROR', message: 'Map data set is too large...' }
```

### Cleanup Steps

1. Remove stress test data:
   ```sql
   DELETE FROM farms WHERE name LIKE 'stress-test-%';
   -- OR restore from backup
   ```

2. Verify Map View returns to normal behavior

---

## General Testing Checklist

After simulating any failure scenario:

- [ ] Map View loads under normal conditions (after cleanup)
- [ ] No TypeScript/build errors
- [ ] No unexpected logs in production mode
- [ ] Error messages are user-friendly (no stack traces)
- [ ] No PII in error logs
- [ ] Performance is acceptable (< 1s for normal operations)

---

## Related Documents

- `docs/RUNBOOK-MAPVIEW.md` - Incident response procedures
- `docs/QA-MAPVIEW-CONSISTENCY.md` - Consistency validation details
- `docs/SLO-MAPVIEW.md` - Service Level Objectives

---

**Last Updated**: Pre-Production QA  
**Version**: 1.0
