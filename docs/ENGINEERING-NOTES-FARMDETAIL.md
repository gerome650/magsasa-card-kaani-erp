# Farm Detail View - Engineering Notes

**Audience**: Engineers onboarding to the codebase  
**Purpose**: Technical deep dive into the Farm Detail View architecture and design decisions

---

## High-Level Architecture

### Data Flow

```
User → Frontend (FarmDetail.tsx)
  ↓
Route: /farms/:id
  ↓
tRPC Query: farms.getById(id)
  ↓
Backend Router (server/routers.ts → farms.getById)
  ↓
Database Query (server/db.ts → getFarmById)
  ↓
Drizzle ORM → MySQL Database (farms table)
  ↓
Response: Farm data (with yields, costs, boundaries)
  ↓
Frontend Rendering:
  - Farm information
  - Yields table (paginated)
  - Costs table (paginated)
  - Profitability analysis
  - Map with boundaries
```

### Code Locations

**Frontend**:
- `client/src/pages/FarmDetail.tsx` - Main UI component
  - Route handling (`/farms/:id`)
  - Data fetching (tRPC queries)
  - Memoized calculations (yields, costs, profitability)
  - Pagination (50 records per page)
  - Map integration (Google Maps)
  - Integrity checks (dev mode only)

**Backend**:
- `server/routers.ts` - tRPC router
  - `farms.getById` procedure (lines ~558-641)
  - `recordFarmDetailMetric()` helper
  - `categorizeFarmDetailError()` helper
  - Error handling and sanitization

**Database**:
- `server/db.ts` - Database helpers
  - `getFarmById()` - Fetch farm data
  - `getYieldsByFarmId()` - Fetch yield records
  - `getCostsByFarmId()` - Fetch cost records
  - `getBoundariesByFarmId()` - Fetch boundary/parcel data

**Schema**:
- `drizzle/schema.ts` - Schema definitions
  - `farms` table
  - `yields` table
  - `costs` table
  - `boundaries` table (if exists)

**Documentation**:
- `docs/QA-FARMDETAIL-FUNCTIONAL.md` - Functional QA summary
- `docs/LOAD-TEST-FARMDETAIL.md` - Performance testing
- `docs/QA-FARMDETAIL-CONSISTENCY.md` - Data consistency checks
- `docs/SLO-FARMDETAIL.md` - Service Level Objectives
- `docs/ALERTING-FARMDETAIL.md` - Alert definitions
- `docs/RUNBOOK-FARMDETAIL.md` - Incident response playbook
- `docs/FAILURE-SCENARIOS-FARMDETAIL.md` - Failure simulation guide

---

## Key Design Decisions

### 1. Protected Procedure (Not Public)

**Why `protectedProcedure`?**
- Farm data is sensitive (farmer information, financial data)
- Only authenticated users should access farm details
- Prevents unauthorized access to farm IDs

**Code**:
```typescript
getById: protectedProcedure
  .input(z.object({ id: z.number().positive() }))
  .query(async ({ input }) => { ... })
```

**Trade-offs**:
- ✅ Pros: Security, access control, audit trail
- ❌ Cons: Requires authentication (but acceptable for ERP system)

### 2. Structured Metrics (`farmdetail_metric`)

**Why structured JSON logs?**
- Vendor-agnostic (works with Prometheus, Datadog, Loki, etc.)
- Machine-parseable for monitoring systems
- Consistent format across all features
- No vendor SDKs required

**Format**:
```json
{
  "type": "farmdetail_metric",
  "event": "view_started" | "view_completed" | "view_failed",
  "ts": "2024-01-15T10:30:00.000Z",
  "farmId": 123,
  "durationMs": 245,
  "hasYields": true,
  "hasCosts": true,
  "hasCoordinates": true,
  "errorCategory": "db_error" | "not_found" | "validation_error" | "unauthorized" | "unknown"
}
```

**Events**:
- `view_started`: When `farms.getById` is called
- `view_completed`: When farm data is successfully returned
- `view_failed`: When an error occurs

**Trade-offs**:
- ✅ Pros: Observability, SLO tracking, alerting
- ❌ Cons: Additional logging overhead (minimal)

### 3. Memoization & Pagination

**Why memoization?**
- Prevents unnecessary recalculations on every render
- Improves performance for farms with many yields/costs
- Reduces CPU usage and improves user experience

**Code**:
```typescript
const yieldRecords = useMemo(() => {
  // Transform and validate yields
}, [dbYields, farmId]);

const profitability = useMemo(() => {
  // Calculate profitability
}, [yieldRecords, costRecords]);
```

**Why pagination?**
- Prevents UI from freezing with large datasets (1000+ records)
- Improves initial page load time
- Better user experience (shows first 50, then "Show More")

**Code**:
```typescript
const [yieldRecordsLimit, setYieldRecordsLimit] = useState(50);
const displayedYieldRecords = useMemo(() => {
  return yieldRecords.slice(0, yieldRecordsLimit);
}, [yieldRecords, yieldRecordsLimit]);
```

**Trade-offs**:
- ✅ Pros: Performance, scalability, better UX
- ❌ Cons: Slightly more complex code (but worth it)

### 4. Defensive Parsing & Error Handling

**Why defensive parsing?**
- Handles corrupted data gracefully (NaN, Infinity, negative values)
- Prevents crashes from invalid data
- Logs warnings in dev mode for data quality issues

**Code**:
```typescript
let quantity = parseFloat(yield.quantity?.toString() || '0');
if (isNaN(quantity) || !isFinite(quantity) || quantity < 0) {
  if (import.meta.env.DEV) {
    console.warn(`[FarmDetail] Invalid yield quantity...`);
  }
  quantity = 0;
}
```

**Why user-friendly errors?**
- Prevents exposing internal errors (stack traces, connection strings)
- Better user experience
- Security (no sensitive information leaked)

**Code**:
```typescript
if (errorCategory === "db_error") {
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Farm data could not be loaded due to a temporary database issue. Please try again.",
  });
}
```

**Trade-offs**:
- ✅ Pros: Resilience, security, better UX
- ❌ Cons: More code complexity (but necessary)

### 5. Guardrails for Slow DB & Large Datasets

**Why slow operation warnings?**
- Detects performance degradation early
- Helps identify database issues
- Provides visibility into slow farms

**Code**:
```typescript
if (duration > 1000) {
  console.warn(`[FarmDetail] Slow operation detected: getById took ${(duration / 1000).toFixed(2)}s (farmId: ${input.id})`);
}
```

**Why oversized dataset warnings?**
- Alerts when farms have extremely large datasets (> 1000 records)
- Helps identify data quality issues
- Documents behavior for ops team

**Code**:
```typescript
if (yieldRecords.length > 1000) {
  console.warn(`[FarmDetail] Farm ${farm.id} has extremely high yield record count: ${yieldRecords.length} (may impact performance)`);
}
```

**Trade-offs**:
- ✅ Pros: Observability, early detection
- ❌ Cons: Additional logging (but minimal impact)

---

## Data Flow & Validation

### Input Validation

**Farm ID Validation**:
```typescript
.input(z.object({ id: z.number().positive() }))
```
- Ensures farm ID is a positive number
- Prevents invalid IDs (negative, zero, non-numeric)

**Route Parameter Validation**:
```typescript
const farmId = params?.id && !isNaN(parseInt(params.id)) ? parseInt(params.id) : null;
```
- Validates route parameter before using
- Handles invalid URLs gracefully

### Defensive Parsing Rules

**Yields**:
- Quantity: Must be finite, non-negative (defaults to 0 if invalid)
- Date: Must be valid date string (skips record if invalid)
- Unit: Must be 'kg' or 'tons' (defaults to 'kg')

**Costs**:
- Amount: Must be finite, non-negative (defaults to 0 if invalid)
- Date: Must be valid date string (skips record if invalid)
- Category: Must be valid category (type-safe)

**Coordinates**:
- Latitude/Longitude: Must be finite, non-zero (warns if invalid)
- Checks for NaN, Infinity, (0,0) coordinates

**Calculations**:
- All calculations check for NaN/Infinity before displaying
- Profitability clamps values to reasonable ranges (-100% to 100% for margin)
- Division by zero prevented (checks for > 0 before dividing)

### How Corrupted Data is Handled

**Invalid Yields**:
1. Parse quantity (defaults to 0 if invalid)
2. Validate date (skips record if invalid)
3. Log warning in dev mode (no PII)
4. Continue processing other records

**Invalid Costs**:
1. Parse amount (defaults to 0 if invalid)
2. Validate date (skips record if invalid)
3. Log warning in dev mode (no PII)
4. Continue processing other records

**Invalid Calculations**:
1. Skip invalid values in reduce operations
2. Check for finite results before displaying
3. Clamp values to reasonable ranges
4. Never throw errors (graceful degradation)

---

## Extension Points

### Adding New Metrics

**Location**: `server/routers.ts` → `recordFarmDetailMetric()`

**Steps**:
1. Add new field to `FarmDetailMetricPayload` type
2. Emit metric in `farms.getById` procedure
3. Update `docs/SLO-FARMDETAIL.md` if needed
4. Update `docs/ALERTING-FARMDETAIL.md` if needed

**Example**:
```typescript
recordFarmDetailMetric("view_completed", {
  farmId: input.id,
  durationMs: duration,
  hasYields,
  hasCosts,
  hasCoordinates,
  newField: value, // Add new field
});
```

### Adding New Filters/Fields

**Frontend**:
1. Add filter state in `FarmDetail.tsx`
2. Add filter UI component
3. Filter `yieldRecords` or `costRecords` in `useMemo`
4. Update pagination if needed

**Backend**:
1. Add filter parameter to `farms.getById` input
2. Add WHERE clause in database query
3. Update types and validation

### Adding Integrity Checks

**Location**: `client/src/pages/FarmDetail.tsx` → `useEffect` hooks

**Steps**:
1. Add check in existing `useEffect` or create new one
2. Log warning with `[FarmDetailIntegrity]` prefix
3. Never throw errors (non-blocking)
4. No PII in logs (only farmId)

**Example**:
```typescript
useEffect(() => {
  if (!farm || farmLoading) return;
  
  // New check
  if (farm.someField === null && farm.status === 'active') {
    console.warn(`[FarmDetailIntegrity] Farm ${farm.id} has missing someField`);
  }
}, [farm, farmLoading]);
```

### Guidelines

**Keep Logs PII-Free**:
- ✅ Use farmId (safe)
- ✅ Use counts, durations, percentages
- ❌ Don't log farmer names, emails, addresses
- ❌ Don't log full coordinates (use hasCoordinates boolean)

**Keep Metrics Vendor-Agnostic**:
- ✅ Use JSON logs (works with any system)
- ✅ Use standard fields (ts, event, durationMs)
- ❌ Don't use vendor-specific SDKs (Prometheus client, Datadog SDK)
- ❌ Don't hardcode vendor-specific formats

---

## Troubleshooting Guide

### Farm Detail is Slow

**Check**:
1. **Database performance**:
   ```sql
   SHOW PROCESSLIST;
   EXPLAIN SELECT * FROM farms WHERE id = {farmId};
   ```
2. **Heavy farms**:
   ```sql
   SELECT f.id, COUNT(DISTINCT y.id) as yield_count, COUNT(DISTINCT c.id) as cost_count
   FROM farms f
   LEFT JOIN yields y ON f.id = y.farmId
   LEFT JOIN costs c ON f.id = c.farmId
   WHERE f.id = {farmId}
   GROUP BY f.id;
   ```
3. **Logs**:
   ```bash
   grep "\[FarmDetail\] Slow operation detected" logs | tail -20
   ```

**Solutions**:
- Add indexes if missing
- Check for long-running queries
- Verify pagination is working
- Check for oversized datasets (> 1000 records)

### Error Rates Spike

**Check**:
1. **Error categories**:
   ```bash
   grep "farmdetail_metric" logs | jq 'select(.event=="view_failed") | .errorCategory' | sort | uniq -c
   ```
2. **Recent failures**:
   ```bash
   grep "\[FarmDetail\] getById failed" logs | tail -20
   ```
3. **Database connectivity**:
   ```bash
   mysql -h {DB_HOST} -u {DB_USER} -p -e "SELECT 1;"
   ```

**Solutions**:
- If `db_error`: Check database service, connection pool
- If `not_found`: Check for data deletion, migration issues
- If `validation_error`: Check for recent deployments, API contract changes

### Profitability Numbers Look Wrong

**Check**:
1. **Yields and costs**:
   ```sql
   SELECT SUM(quantity) as total_yield FROM yields WHERE farmId = {farmId};
   SELECT SUM(amount) as total_costs FROM costs WHERE farmId = {farmId};
   ```
2. **Invalid data**:
   ```bash
   grep "\[FarmDetail\] Invalid" logs | grep "farmId={farmId}"
   ```
3. **Calculation logic**:
   - Check `ProfitabilityAnalysis` component
   - Verify crop prices are correct
   - Check for NaN/Infinity in calculations

**Solutions**:
- Verify data in database
- Check for corrupted records (NaN, Infinity, negative values)
- Review calculation logic in `ProfitabilityAnalysis`

### Which Logs to Search

**Structured Metrics**:
```bash
# All farmdetail_metric events
grep "farmdetail_metric" logs | jq '.'

# Failed views
grep "farmdetail_metric" logs | jq 'select(.event=="view_failed")'

# Slow operations
grep "farmdetail_metric" logs | jq 'select(.durationMs > 1000)'
```

**Structured Logs**:
```bash
# All Farm Detail logs
grep "\[FarmDetail\]" logs

# Performance logs
grep "\[FarmDetailPerf\]" logs

# Integrity warnings
grep "\[FarmDetailIntegrity\]" logs
```

### Example Log Snippets

**Successful View**:
```
[FarmDetail] getById called: farmId=123
[FarmDetail] getById completed in 0.25s: farmId=123, hasCoordinates=true
{"type":"farmdetail_metric","event":"view_completed","ts":"2024-01-15T10:30:00.000Z","farmId":123,"durationMs":245,"hasYields":true,"hasCosts":true,"hasCoordinates":true}
```

**Failed View (DB Error)**:
```
[FarmDetail] getById called: farmId=123
[FarmDetail] getById failed after 0.50s: Database connection error
{"type":"farmdetail_metric","event":"view_failed","ts":"2024-01-15T10:30:00.000Z","farmId":123,"durationMs":500,"errorCategory":"db_error"}
```

**Slow Operation**:
```
[FarmDetail] getById called: farmId=123
[FarmDetail] Slow operation detected: getById took 1.25s (farmId: 123)
[FarmDetail] getById completed in 1.25s: farmId=123, hasCoordinates=true
```

---

## Related Documentation

- `docs/ADMIN-GUIDE-FARMDETAIL.md` - Admin user guide
- `docs/SLO-FARMDETAIL.md` - Service Level Objectives
- `docs/ALERTING-FARMDETAIL.md` - Alert definitions
- `docs/RUNBOOK-FARMDETAIL.md` - Incident response
- `docs/FAILURE-SCENARIOS-FARMDETAIL.md` - Failure simulation
- `docs/QA-FARMDETAIL-FUNCTIONAL.md` - Functional QA
- `docs/LOAD-TEST-FARMDETAIL.md` - Performance testing

---

**Last Updated**: Pass 6 - Ops, Training & Postmortem  
**Version**: 1.0

