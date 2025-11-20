# Map View - Runbook / Incident Response

**Date**: Pre-Production QA  
**Feature**: Map View Operations & Troubleshooting  
**Status**: ✅ Documented

---

## Overview

This runbook provides step-by-step procedures for troubleshooting and resolving Map View incidents.

---

## Quick Triage Flow

```
1. Is Map View blank or showing error?
   ├─ Yes → Go to "Map is Blank or Erroring" section
   └─ No → Continue to step 2

2. Are markers not appearing?
   ├─ Yes → Go to "Markers Not Appearing" section
   └─ No → Continue to step 3

3. Is Map View slow?
   ├─ Yes → Go to "Performance Issues" section
   └─ No → Map View is functioning normally
```

---

## Scenario 1: Map is Blank or Erroring

### Symptoms

- Map View page shows error message
- Map View page is completely blank
- User reports "Map not loading"

### Troubleshooting Steps

**Step 1: Check Server Logs**

Look for `[MapView]` prefixed logs:
```bash
# Tail server logs
tail -f server.log | grep "\[MapView\]"

# Expected: Look for errors like:
# [MapView] mapList failed after Xs: { code: '...', message: '...' }
```

**Step 2: Check Database Availability**

```bash
# Test database connection
mysql -h 127.0.0.1 -u root -e "SELECT 1;"

# If connection fails, check:
# - Database service is running
# - DATABASE_URL in .env is correct
# - Network connectivity to database
```

**Step 3: Run Consistency Check**

Call `farms.consistencyCheck` endpoint (via tRPC or API):
- If it fails → Database connection issue
- If it succeeds → Check `missingCoordinatePercentage`

**Step 4: Check for Recent Deployments**

- Review recent code changes
- Check for configuration changes
- Verify environment variables

### Common Causes & Actions

| Cause | Action |
|-------|--------|
| **Database Connection Error** | Check database service, verify `DATABASE_URL`, restart database if needed |
| **Database Timeout** | Check database load, optimize queries, increase connection pool |
| **Oversized Result Set** | Check farm count, verify guardrails are working, consider pagination |
| **Invalid Data** | Run consistency check, identify corrupted records, fix or exclude |

### Escalation

- **P1**: If database is completely down → Escalate to infrastructure team
- **P2**: If error persists > 15 minutes → Escalate to engineering lead
- **P3**: If intermittent errors → Create ticket for investigation

---

## Scenario 2: Markers Not Appearing

### Symptoms

- Map loads but no markers visible
- Farm count shows > 0 but map is empty
- User reports "No farms on map"

### Troubleshooting Steps

**Step 1: Check Farm Count**

- Verify `farms.mapList` returns data:
  - Check browser Network tab for tRPC response
  - Check server logs: `[MapView] mapList completed in Xs: Y farms with coordinates returned`

**Step 2: Check Coordinate Validity**

- Run consistency check:
  - `missingCoordinateCount` should be low (< 5% of total)
  - If high → Many farms missing coordinates

**Step 3: Check Browser Console**

Look for warnings:
```
[FarmMap] Skipping farm X with invalid coordinates: lat=..., lng=...
```

**Step 4: Check Map Viewport**

- Verify map is centered on correct region
- Try zooming out to see if markers are outside viewport
- Check if viewport-based rendering is hiding markers

### Common Causes & Actions

| Cause | Action |
|-------|--------|
| **All Farms Missing Coordinates** | Run data quality check, identify farms without coordinates, update coordinates |
| **Invalid Coordinate Format** | Check coordinate parsing logic, verify database schema |
| **Viewport Filtering** | Check if viewport-based rendering is too aggressive, adjust bounds |
| **Map Not Initialized** | Check Google Maps API key, verify map instance is created |

### Escalation

- **P2**: If > 10% of farms missing coordinates → Create data quality ticket
- **P3**: If isolated to specific farms → Document and fix in next release

---

## Scenario 3: Performance Issues

### Symptoms

- Map View loads very slowly (> 5 seconds)
- Map interaction is laggy
- Browser becomes unresponsive

### Troubleshooting Steps

**Step 1: Check Server Logs for Slow Operations**

Look for warnings:
```
[MapView] mapList slow operation { durationMs: 5000, resultCount: 10000 }
```

**Step 2: Check Farm Count**

- If `totalFarms > 50,000` → Consider pagination or filtering
- If `totalFarms > 200,000` → Guardrail should trigger error

**Step 3: Check Database Query Performance**

```sql
-- Check query execution time
EXPLAIN SELECT ... FROM farms WHERE ...;

-- Check for missing indexes
SHOW INDEXES FROM farms;
```

**Step 4: Check Browser Performance**

- Open Chrome DevTools → Performance tab
- Record while loading Map View
- Look for:
  - Long-running JavaScript
  - Memory leaks
  - Too many DOM updates

### Common Causes & Actions

| Cause | Action |
|-------|--------|
| **Large Dataset** | Implement pagination, add filters, use viewport-based rendering |
| **Slow Database Query** | Add indexes, optimize query, check database load |
| **Too Many Markers** | Use marker clustering, implement viewport filtering, simplify markers |
| **Memory Leak** | Check for event listener leaks, verify cleanup in useEffect |

### Escalation

- **P2**: If performance degrades > 50% → Create performance ticket
- **P3**: If isolated to specific scenarios → Document and optimize in next release

---

## Interpreting Consistency Metrics

### `missingCoordinatePercentage`

**Normal**: < 5%
- Expected: Some farms may legitimately not have coordinates
- Action: None required

**Warning**: 5% - 10%
- Expected: Data quality issue, but manageable
- Action: Investigate, plan coordinate updates

**Alert**: > 10%
- Expected: Significant data quality issue
- Action: P2 ticket, investigate root cause

**Critical**: > 20%
- Expected: Major data quality issue
- Action: P1 alert, immediate investigation

### `totalFarms vs farmsWithCoordinates`

**Expected Behavior**:
- `farmsWithCoordinates <= totalFarms` (always)
- Difference = `missingCoordinateCount`

**If Difference is Large**:
- Check if coordinate validation is too strict
- Verify farms are being excluded correctly
- Check for data import issues

---

## What to Do For...

### Database Down

1. **Verify Database Status**:
   ```bash
   mysql -h 127.0.0.1 -u root -e "SELECT 1;"
   ```

2. **Check Database Service**:
   ```bash
   # If using Docker
   docker ps | grep mysql
   docker logs <mysql-container>
   
   # If using systemd
   systemctl status mysql
   ```

3. **Restart Database** (if needed):
   ```bash
   # Docker
   docker restart <mysql-container>
   
   # Systemd
   systemctl restart mysql
   ```

4. **Verify Connection**:
   - Check `DATABASE_URL` in `.env`
   - Test connection from application server

5. **Monitor Recovery**:
   - Watch server logs for successful connections
   - Verify Map View loads after database recovery

### Too Many Missing Coordinates

1. **Run Consistency Check**:
   - Call `farms.consistencyCheck` endpoint
   - Note `missingCoordinatePercentage`

2. **Identify Affected Farms**:
   ```sql
   SELECT id, name, latitude, longitude 
   FROM farms 
   WHERE latitude IS NULL 
      OR longitude IS NULL
      OR CAST(latitude AS DECIMAL(10,6)) = 0
      OR CAST(longitude AS DECIMAL(10,6)) = 0;
   ```

3. **Investigate Root Cause**:
   - Check recent data imports
   - Verify coordinate validation in CSV upload
   - Check for data migration issues

4. **Fix Coordinates**:
   - Update coordinates via Admin CSV Upload
   - Or manually update via SQL (if small number)

5. **Verify Fix**:
   - Run consistency check again
   - Verify `missingCoordinatePercentage` decreased

### Oversized Datasets

1. **Check Farm Count**:
   - Run consistency check
   - Note `totalFarms` value

2. **If > 200,000**:
   - Guardrail should trigger error
   - User sees: "Map data set is too large. Please contact support."
   - Action: Investigate why dataset is so large

3. **If 50,000 - 200,000**:
   - Warning logged: `[MapView] mapList result size exceeds threshold`
   - Map should still load, but may be slow
   - Action: Consider pagination or filtering

4. **Optimize if Needed**:
   - Implement pagination
   - Add region/crop filters
   - Use viewport-based rendering
   - Consider marker clustering

---

## When to Escalate

### P1 (Critical) - Immediate Escalation

- Database completely down
- Map View completely unavailable for > 15 minutes
- `missingCoordinatePercentage > 20%` for > 15 minutes
- Data corruption affecting > 10% of farms

**Action**: Page on-call engineer, notify #maps-data-quality channel

### P2 (High) - Escalate Within 4 Hours

- Map View errors persisting > 1 hour
- `missingCoordinatePercentage > 10%` for > 60 minutes
- Performance degradation > 50%
- Oversized dataset (> 200,000 farms)

**Action**: Create incident ticket, notify #maps-data-quality channel

### P3 (Medium) - Escalate Within 24 Hours

- Intermittent errors
- Minor performance issues
- Isolated data quality issues (< 5% of farms)

**Action**: Create ticket for investigation, document in runbook

---

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Availability**: `farms.mapList` success rate
2. **Latency**: p95 response time for `farms.mapList`
3. **Data Quality**: `missingCoordinatePercentage` from consistency check
4. **Error Rate**: Failed requests to Map View endpoints

### Alert Thresholds

See `docs/ALERTING-MAPVIEW.md` for detailed alert definitions.

---

## Related Documents

- `docs/FAILURE-SCENARIOS-MAPVIEW.md` - How to simulate failures
- `docs/ALERTING-MAPVIEW.md` - Alert definitions
- `docs/SLO-MAPVIEW.md` - Service Level Objectives

---

**Last Updated**: Pre-Production QA  
**Version**: 1.0
