# Farm Detail View - Failure Scenarios & Simulation Guide

**Date**: Pass 5 - Failure & Resilience QA  
**Feature**: Farm Detail View  
**Status**: ✅ Complete

---

## Overview

This document describes how to simulate various failure scenarios for the Farm Detail View to verify graceful degradation and error handling. These scenarios are used for testing resilience and ensuring the system fails gracefully without exposing sensitive information or crashing.

---

## 1. DB Slowdown Simulation

### Purpose

Test Farm Detail behavior when the database responds slowly (e.g., due to high load, network latency, or resource constraints).

### How to Simulate

1. **Edit `server/routers.ts`**:
   - Locate the `farms.getById` procedure (around line 560).
   - Uncomment the artificial delay line:
     ```typescript
     // Uncomment the line below to test slow DB behavior:
     if (process.env.NODE_ENV === "development") await new Promise(res => setTimeout(res, 800));
     ```
   - Adjust the delay (500-1000ms) as needed.

2. **Restart the dev server**:
   ```bash
   pnpm dev
   ```

3. **Navigate to a farm detail page**:
   - Go to `/farms/{id}` in the browser.
   - Observe the loading state.

### Expected Behavior

**Frontend**:
- ✅ Loading spinner/indicator is displayed.
- ✅ No blank screen or crash.
- ✅ Page eventually loads successfully.
- ✅ No React warnings in console.

**Backend Logs**:
- `[FarmDetail] getById called: farmId={id}`
- `[FarmDetail] Slow operation detected: getById took {duration}s (farmId: {id})` (if > 1s)
- `[FarmDetail] getById completed in {duration}s: farmId={id}, hasCoordinates={bool}`

**Metrics**:
- `farmdetail_metric` with `event: "view_started"` and `event: "view_completed"`.
- `durationMs` reflects the artificial delay (e.g., ~800ms + actual query time).

### Cleanup

1. **Comment out the delay line** in `server/routers.ts`:
   ```typescript
   // if (process.env.NODE_ENV === "development") await new Promise(res => setTimeout(res, 800));
   ```

2. **Restart the dev server**.

---

## 2. DB Outage / Connection Failure Simulation

### Purpose

Test Farm Detail behavior when the database is unavailable (e.g., connection refused, timeout, or authentication failure).

### How to Simulate

**Option A: Break DATABASE_URL (Recommended for Testing)**

1. **Edit `.env`**:
   - Temporarily change `DATABASE_URL` to an invalid value:
     ```env
     DATABASE_URL=mysql://invalid:password@localhost:3306/nonexistent
     ```
   - Or use a wrong password:
     ```env
     DATABASE_URL=mysql://root:wrongpassword@localhost:3306/magsasa_demo
     ```

2. **Restart the dev server**:
   ```bash
   pnpm dev
   ```

3. **Navigate to a farm detail page**:
   - Go to `/farms/{id}` in the browser.

**Option B: Stop MySQL Service (More Realistic)**

1. **Stop MySQL**:
   ```bash
   # macOS (Homebrew)
   brew services stop mysql
   
   # Linux (systemd)
   sudo systemctl stop mysql
   ```

2. **Restart the dev server** (if needed).

3. **Navigate to a farm detail page**.

### Expected Behavior

**Frontend**:
- ✅ Error message displayed in a card/banner (not a blank screen).
- ✅ Message is user-friendly: "Farm data could not be loaded due to a temporary database issue. Please try again."
- ✅ No stack traces or connection strings visible to the user.
- ✅ User can navigate back to `/farms` or retry.

**Backend Logs**:
- `[FarmDetail] getById called: farmId={id}`
- `[FarmDetail] getById failed after {duration}s: {safeErrorSummary}`
- Error summary does NOT contain:
  - Raw connection strings
  - Stack traces
  - Database passwords
  - Full error messages with sensitive info

**Metrics**:
- `farmdetail_metric` with `event: "view_failed"`.
- `errorCategory: "db_error"`.
- `durationMs` reflects time until failure.

### Cleanup

1. **Restore `.env`**:
   ```env
   DATABASE_URL=mysql://root:@localhost:3306/magsasa_demo
   ```

2. **Or restart MySQL service**:
   ```bash
   brew services start mysql
   # or
   sudo systemctl start mysql
   ```

3. **Restart the dev server**.

---

## 3. Corrupted / Weird Data Simulation

### Purpose

Test Farm Detail resilience when data contains invalid, missing, or extreme values (e.g., `null`, `NaN`, `Infinity`, negative values, invalid dates).

### How to Simulate

**Option A: Direct Database Manipulation (Recommended)**

1. **Connect to MySQL**:
   ```bash
   mysql -h 127.0.0.1 -u root magsasa_demo
   ```

2. **Insert corrupted yield record**:
   ```sql
   INSERT INTO yields (farmId, parcelIndex, cropType, harvestDate, quantity, unit, qualityGrade)
   VALUES (1, 0, 'Rice', 'invalid-date', NULL, 'kg', 'Standard');
   ```

3. **Insert corrupted cost record**:
   ```sql
   INSERT INTO costs (farmId, date, category, description, amount, parcelIndex)
   VALUES (1, '2024-13-45', 'Fertilizer', 'Test corrupted cost', -1000, NULL);
   ```

4. **Insert extreme values**:
   ```sql
   INSERT INTO yields (farmId, parcelIndex, cropType, harvestDate, quantity, unit, qualityGrade)
   VALUES (1, 0, 'Rice', '2024-01-01', 999999999, 'kg', 'Standard');
   ```

5. **Navigate to the farm detail page**:
   - Go to `/farms/1` in the browser.

**Option B: Modify Demo Data Script**

1. **Edit `scripts/generate-demo-data.ts`** or `scripts/generate-heavy-farm.ts`.
2. **Add intentionally corrupted records**:
   ```typescript
   yieldRecords.push({
     farmId,
     parcelIndex: 0,
     cropType: 'Rice',
     harvestDate: 'invalid-date',
     quantity: 'NaN',
     unit: 'kg',
     qualityGrade: 'Standard',
   });
   ```
3. **Run the script** and navigate to the farm.

### Expected Behavior

**Frontend**:
- ✅ Page loads without crashing.
- ✅ Invalid records are skipped (not displayed in tables).
- ✅ Summary stats calculate correctly (invalid values treated as 0 or skipped).
- ✅ Profitability calculations don't throw errors.
- ✅ No `NaN` or `Infinity` displayed in UI.

**Backend Logs** (Dev Mode Only):
- `[FarmDetail] Invalid yield quantity at index {index} for farm {farmId}: {value}, defaulting to 0`
- `[FarmDetail] Invalid harvest date at index {index} for farm {farmId}: {value}, skipping record`
- `[FarmDetail] Failed to parse yield record at index {index} for farm {farmId}: {error}`
- Similar warnings for cost records.

**No PII in Logs**:
- Only farmId and index numbers.
- No farmer names, emails, or sensitive data.

### Cleanup

1. **Remove corrupted records from database**:
   ```sql
   DELETE FROM yields WHERE harvestDate = 'invalid-date' OR quantity IS NULL;
   DELETE FROM costs WHERE date = '2024-13-45' OR amount < 0;
   DELETE FROM yields WHERE quantity > 1000000;
   ```

2. **Or regenerate demo data**:
   ```bash
   pnpm generate:demo
   ```

---

## 4. Oversized Dataset Simulation

### Purpose

Test Farm Detail performance and behavior with extremely large datasets (e.g., 1000+ yields, 1000+ costs).

### How to Simulate

1. **Use the heavy farm generator with custom counts**:
   ```bash
   YIELDS_COUNT=500 COSTS_COUNT=300 pnpm generate:heavy-farm
   ```

2. **Or edit `scripts/generate-heavy-farm.ts`** directly:
   ```typescript
   const yieldsCount = 500;
   const costsCount = 300;
   ```

3. **Run the script**:
   ```bash
   pnpm generate:heavy-farm
   ```

4. **Note the farm ID** from the console output.

5. **Navigate to the farm detail page**:
   - Go to `/farms/{farmId}` in the browser.

### Expected Behavior

**Frontend**:
- ✅ Page loads within acceptable time (< 2s for initial load).
- ✅ Pagination works correctly (shows first 50, then "Show More").
- ✅ Summary stats calculate from all records (not just displayed).
- ✅ Scrolling and interactions remain smooth.
- ✅ No memory leaks or browser crashes.

**Backend Logs**:
- `[FarmDetail] Farm {farmId} has extremely high yield record count: {count} (may impact performance)` (if > 1000)
- `[FarmDetail] Farm {farmId} has extremely high cost record count: {count} (may impact performance)` (if > 1000)

**Metrics**:
- `farmdetail_metric` with realistic `durationMs` (may be higher for heavy farms).
- `view_completed` event emitted successfully.

### Cleanup

1. **Delete the heavy farm** (optional):
   ```sql
   DELETE FROM yields WHERE farmId = {farmId};
   DELETE FROM costs WHERE farmId = {farmId};
   DELETE FROM farms WHERE id = {farmId};
   ```

2. **Or keep it for future testing**.

---

## 5. Missing Data Simulation

### Purpose

Test Farm Detail behavior when farms have missing or incomplete data (e.g., no yields, no costs, missing coordinates).

### How to Simulate

1. **Create a farm with minimal data**:
   ```sql
   INSERT INTO farms (userId, name, farmerName, size, crops, status, barangay, municipality)
   VALUES (1, 'Minimal Farm', 'Test Farmer', '2.5', '["Rice"]', 'active', 'Calauan', 'Calauan');
   -- Note: No latitude/longitude, no yields, no costs
   ```

2. **Navigate to the farm detail page**.

### Expected Behavior

**Frontend**:
- ✅ Page loads successfully.
- ✅ Empty state messages for yields/costs (if applicable).
- ✅ Map may not show marker (if coordinates missing).
- ✅ Integrity warnings logged (dev mode only).

**Backend Logs** (Dev Mode Only):
- `[FarmDetailIntegrity] Active farm {farmId} has no yield records - may indicate incomplete data`
- `[FarmDetailIntegrity] Farm {farmId} has invalid or missing coordinates`
- `[FarmDetailIntegrity] Farm {farmId} has no crops listed`

**Metrics**:
- `farmdetail_metric` with `hasYields: false`, `hasCosts: false`, `hasCoordinates: false`.

### Cleanup

1. **Delete the test farm**:
   ```sql
   DELETE FROM farms WHERE name = 'Minimal Farm';
   ```

---

## General Notes

- **All simulations should be done in development mode** to avoid impacting production.
- **Always clean up test data** after simulations.
- **Monitor browser console and server logs** during simulations.
- **Verify metrics are emitted correctly** for all scenarios.
- **Ensure no PII is logged** in any scenario.

---

**Last Updated**: Pass 5 - Failure & Resilience QA  
**Version**: 1.0

