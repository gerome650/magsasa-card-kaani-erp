# Admin CSV Upload - Engineering Notes

**Audience**: Engineers onboarding to the codebase  
**Purpose**: Technical deep dive into the Admin CSV Upload feature architecture and design decisions

---

## High-Level Architecture

### Data Flow

```
Admin User → Frontend (AdminCsvUpload.tsx)
  ↓
CSV File Upload → Client-side parsing (papaparse)
  ↓
Validation (required columns, format)
  ↓
tRPC Mutation (adminCsv.uploadFarmersCsv / uploadFarmsCsv / uploadSeasonsCsv)
  ↓
Backend Router (server/routers.ts → adminCsv router)
  ↓
Batch Processing (500 rows per batch)
  ↓
Drizzle ORM → MySQL Database
  ↓
Response (insertedCount, skippedCount, errors)
```

### Code Locations

**Frontend**:
- `client/src/pages/AdminCsvUpload.tsx` - Main UI component
  - CSV parsing (papaparse)
  - Client-side validation
  - Preview table
  - Import button and results display

**Backend**:
- `server/routers.ts` - tRPC router
  - `adminCsv` router (lines ~1019-1350)
  - Three mutations: `uploadFarmersCsv`, `uploadFarmsCsv`, `uploadSeasonsCsv`
  - Error normalization and categorization helpers
  - Metrics emission (`recordAdminCsvMetric`)

**Database**:
- `drizzle/schema.ts` - Schema definitions
  - `users` table (farmers)
  - `farms` table
  - `yields` table (seasons)

**Documentation**:
- `docs/README-admin-csv.md` - User-facing documentation
- `docs/QA-ADMIN-CSV-SUMMARY.md` - QA verification summary
- `docs/SLO-ADMIN-CSV.md` - Service Level Objectives
- `docs/ALERTING-ADMIN-CSV.md` - Alert definitions
- `docs/RUNBOOK-ADMIN-CSV.md` - Incident response playbook
- `docs/PRODUCTION-QA-ADMIN-CSV.md` - Production readiness summary

---

## Key Design Decisions

### 1. Batch Size = 500 Rows

**Why 500?**
- Balance between performance and memory usage
- MySQL handles 500-row inserts efficiently
- Prevents overwhelming the database connection pool
- Allows progress logging every 1000 rows (2 batches)

**Can it be changed?**
- Yes, modify `batchSize` constant in each mutation
- Consider database connection pool limits
- Test with larger batches if needed (e.g., 1000)

### 2. Per-Row Error Handling (Not All-or-Nothing)

**Why per-row instead of transactions?**
- **Granular error reporting**: Admins can see exactly which rows failed
- **Partial success**: Valid rows are imported even if some rows fail
- **User experience**: Better than "all or nothing" for large CSVs

**Trade-offs**:
- ✅ Pros: Better UX, granular errors, partial success
- ❌ Cons: No strict atomicity (but acceptable for admin tool)

**Alternative considered**: Wrapping batches in transactions
- Rejected because it would change error reporting model
- Would only show one error per batch instead of per-row

### 3. Farmers: Upsert, Farms/Seasons: Insert (No Deduplication)

**Farmers (Upsert)**:
- Uses `db.upsertUser()` with `onDuplicateKeyUpdate`
- Re-uploading same CSV updates existing farmers (by `openId`)
- Rationale: Farmers are unique entities, updates are expected

**Farms/Seasons (Insert Only)**:
- No unique constraints on farms/seasons
- Re-uploading creates duplicates
- Rationale: Farms can have same name (different farmers), seasons are historical records

**Future consideration**: Add composite unique keys if deduplication needed
- Farms: `(name, farmerName, municipality)` - would prevent duplicates
- Seasons: `(farmId, parcelIndex, cropType, harvestDate)` - would prevent duplicate harvests

---

## Indexes and Performance Assumptions

### Required Indexes

**Critical for Performance**:

1. **`idx_farms_name_farmerName`** (composite: `name`, `farmerName`)
   - **Purpose**: Farm lookup in `uploadSeasonsCsv` when `farmName` + `farmerName` provided
   - **Query**: `SELECT * FROM farms WHERE name = ? AND farmerName = ?`
   - **Impact**: Without this, farm lookup would be full table scan (slow for large datasets)

2. **`idx_yields_farmId`** (single column: `farmId`)
   - **Purpose**: Foreign key index for yields table
   - **Query**: `SELECT * FROM yields WHERE farmId = ?`
   - **Impact**: Improves query performance for yield lookups

3. **`users_openId_unique`** (unique index: `openId`)
   - **Purpose**: Farmer lookup in `uploadFarmsCsv` when `farmerOpenId` provided
   - **Query**: `SELECT * FROM users WHERE openId = ?`
   - **Impact**: Already exists (unique constraint), ensures fast lookups

**Verification**:
```sql
SHOW INDEXES FROM farms WHERE Key_name = 'idx_farms_name_farmerName';
SHOW INDEXES FROM yields WHERE Key_name = 'idx_yields_farmId';
SHOW INDEXES FROM users WHERE Key_name = 'users_openId_unique';
```

**See**: `docs/INDEXES-SQL.sql` for creation scripts

### Performance Assumptions

**Based on Load Testing** (see `docs/LOAD-TEST-ADMIN-CSV.md`):

- **Small imports** (<5K rows): ~15-20 seconds
- **Large imports** (≥5K rows): ~2-3 minutes for 60K rows
- **Bottleneck**: Database inserts (not parsing or validation)
- **Scaling**: Linear with row count (no exponential slowdown)

**SLO Targets**:
- 95% of small imports finish within 60 seconds
- 95% of large imports finish within 5 minutes (300 seconds)

---

## Guardrails & Limits

### File Size Guardrail

**Implementation**:
```typescript
const MAX_ROWS = 100000;
if (input.rows.length > MAX_ROWS) {
  // Emit import_failed metric
  // Throw user-friendly error
}
```

**Location**: All three mutations (before processing starts)

**Rationale**:
- Prevents memory issues
- Prevents extremely long-running imports
- Encourages splitting large datasets

**Adjustment**: Change `MAX_ROWS` constant if needed

### Error Normalization

**Function**: `normalizeError(error, entityType, identifier?)`

**Purpose**:
- Convert SQL errors to user-friendly messages
- Redact PII from identifiers (first 4 + last 2 chars)
- Sanitize internal error details

**Example**:
- SQL: `ER_DUP_ENTRY: Duplicate entry 'demo-farmer-123'`
- User sees: `Duplicate entry: demo-***er-123 already exists`

**Location**: `server/routers.ts` (lines ~64-95)

### PII Redaction

**Function**: `redactIdentifier(identifier?)`

**Purpose**: Prevent PII leaks in logs and error messages

**Format**: `demo-***er-1` (first 4 chars + `***` + last 2 chars)

**Location**: `server/routers.ts` (lines ~55-62)

---

## Extension Points

### Adding New CSV Types

**Steps**:

1. **Add mutation to `adminCsv` router**:
   ```typescript
   uploadNewTypeCsv: adminProcedure
     .input(z.object({ rows: z.array(...) }))
     .mutation(async ({ input }) => { ... })
   ```

2. **Follow existing pattern**:
   - Guardrail check (MAX_ROWS)
   - Session ID generation
   - `import_started` metric
   - Batch processing (500 rows)
   - Error handling
   - `import_completed` / `import_failed` metric

3. **Add frontend tab** in `AdminCsvUpload.tsx`

4. **Update documentation**

### Changing Batch Size

**Location**: `batchSize` constant in each mutation

**Considerations**:
- Database connection pool limits
- Memory usage
- Progress logging frequency (currently every 1000 rows)

### Adding Indexes

**Process**:

1. Create index SQL (see `docs/INDEXES-SQL.sql`)
2. Test with `EXPLAIN` queries
3. Apply via `pnpm db:push` or migration
4. Verify in production

**When to add**:
- New lookup patterns (e.g., by `municipality`)
- Performance degradation observed
- New CSV types with different lookups

### Moving to Async Processing

**Current**: Synchronous (admin waits for completion)

**Future Option**: Queue-based (e.g., Bull, BullMQ)

**Changes Needed**:
1. Add job queue (Redis-based)
2. Move batch processing to worker
3. Add job status endpoint
4. Update UI to show job status
5. Add email notifications on completion

**Benefits**:
- No timeout issues for very large imports
- Better resource utilization
- Can process multiple imports concurrently

**Trade-offs**:
- More complexity
- Need Redis infrastructure
- Status tracking required

---

## Monitoring & Observability

### Structured Logs

**Format**: `[AdminCSV] [timestamp] [sessionId] ...`

**Events**:
- `import_started` - Import begins
- `import_completed` - Import finishes (with counts)
- `import_failed` - System-level failure

**Location**: `server/routers.ts` (console.log statements)

### Structured Metrics

**Format**: JSON logs (`admin_csv_metric`)

**Fields**:
- `type`: `"admin_csv_metric"`
- `metric`: `"import_started" | "import_completed" | "import_failed"`
- `csvType`: `"farmers" | "farms" | "seasons"`
- `sessionId`: Unique identifier
- `timestamp`: ISO timestamp
- Additional fields: `rowCount`, `insertedCount`, `skippedCount`, `errorCount`, `durationSeconds`

**Purpose**: Can be ingested by Prometheus, Datadog, etc.

**Location**: `recordAdminCsvMetric()` helper function

### SLO Measurement

**See**: `docs/SLO-ADMIN-CSV.md`

**Metrics**:
- Availability: `(import_started - import_failed) / import_started >= 0.995`
- Latency: `P95(durationSeconds)` for small/large imports
- Correctness: `insertedCount / (insertedCount + skippedCount) >= 0.99`

---

## Testing

### Unit Tests (Future)

**Areas to test**:
- `normalizeError()` - Error message conversion
- `redactIdentifier()` - PII redaction
- `categorizeErrors()` - Error type breakdown
- Batch processing logic

### Integration Tests (Future)

**Scenarios**:
- Full import flow (Farmers → Farms → Seasons)
- Error handling (missing references, validation errors)
- Large CSV handling (10K+ rows)
- Guardrail enforcement (100K+ rows)

### Load Tests

**Completed**: See `docs/LOAD-TEST-ADMIN-CSV.md`

**Results**:
- 10K farmers: ~15-20s
- 20K farms: ~45-60s
- 60K seasons: ~2-3min

---

## Troubleshooting

### Common Issues

**"Database connection not available"**:
- Check `DATABASE_URL` environment variable
- Verify database server is running
- Check network connectivity

**Slow imports**:
- Verify indexes exist (see above)
- Check database performance (`SHOW PROCESSLIST`)
- Review connection pool settings

**High error rates**:
- Check import order (Farmers → Farms → Seasons)
- Verify CSV format matches requirements
- Review error messages for patterns

**See**: `docs/RUNBOOK-ADMIN-CSV.md` for detailed troubleshooting

---

## Related Documentation

- `docs/README-admin-csv.md` - User-facing guide
- `docs/ADMIN-CSV-UPLOAD-GUIDE.md` - Admin user guide
- `docs/SLO-ADMIN-CSV.md` - Service Level Objectives
- `docs/ALERTING-ADMIN-CSV.md` - Alert definitions
- `docs/RUNBOOK-ADMIN-CSV.md` - Incident response
- `docs/LOAD-TEST-ADMIN-CSV.md` - Performance testing
- `docs/INDEXES-SQL.sql` - Database indexes

---

**Last Updated**: Production Go-Live  
**Version**: 1.0

