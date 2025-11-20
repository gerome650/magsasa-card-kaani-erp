# Admin CSV Upload - Incident Runbook

**Audience**: On-call engineers, senior admins  
**Purpose**: Quick reference for troubleshooting Admin CSV Upload issues

## Quick Triage Flow

### Step 1: Identify the Issue

**Symptoms**:
- Admin reports "Import failed"
- Import shows errors in UI
- Import takes too long
- No response from import

**First Action**: Find the `sessionId` from the error message or UI

### Step 2: Check Logs

**Log Query** (filter by `sessionId`):
```bash
# Using grep
grep "\[AdminCSV\].*\[csv-1705312200000-a3f2k\]" /var/log/app.log

# Using Loki/ELK
{app="magsasa-erp"} |= "[AdminCSV]" | json | sessionId="csv-1705312200000-a3f2k"
```

**Look for**:
- `import_started` - Confirms import began
- `import_completed` - Import finished (check `errorCount`)
- `import_failed` - System-level failure
- Error messages in logs

### Step 3: Classify the Error

**Error Types**:

1. **Validation Errors** (User Error)
   - Symptoms: "CSV is missing required columns", "Invalid column name"
   - Action: Tell admin to fix CSV headers
   - Not a system issue

2. **Reference Errors** (User Error)
   - Symptoms: "Farmer not found", "Farm not found"
   - Action: Check import order (Farmers → Farms → Seasons)
   - Not a system issue

3. **Database Errors** (System Error)
   - Symptoms: "Database connection error", "Database connection not available"
   - Action: Check database health (see below)
   - System issue - investigate

4. **System Errors** (System Error)
   - Symptoms: "System error: ...", unhandled exceptions
   - Action: Check application logs, server health
   - System issue - investigate

## Common Scenarios & Actions

### Scenario 1: CSV Missing Required Columns

**Symptoms**:
- Error: "CSV is missing required columns: openId"
- Logs show: Validation error in frontend

**Action**:
1. ✅ **Not a system issue** - User error
2. Tell admin to check CSV headers
3. Point to `docs/README-admin-csv.md` for required columns
4. Verify CSV matches demo CSV format

**Resolution**: Admin fixes CSV and re-uploads

---

### Scenario 2: Many Reference Errors

**Symptoms**:
- Error: "Farmer not found: demo-farmer-123" (many rows)
- Logs show: High `errorCount` with reference errors

**Action**:
1. ✅ **Not a system issue** - User error
2. Check import order:
   - Farmers imported first? ✅
   - Farms imported second? ✅
   - Seasons imported last? ✅
3. If order is wrong: Tell admin to import in correct order
4. If order is correct: Check if `farmerOpenId` values match exactly (case-sensitive)

**Resolution**: Admin imports in correct order or fixes references

---

### Scenario 3: Database Connection Errors

**Symptoms**:
- Error: "Database connection error. Please try again later."
- Logs show: `import_failed` with "Database connection" error
- Multiple imports failing

**Action**:
1. ⚠️ **System issue** - Investigate immediately
2. Check database server:
   ```bash
   mysql -h HOST -u USER -p -e "SELECT 1;"
   ```
3. Check `DATABASE_URL` environment variable:
   ```bash
   echo $DATABASE_URL
   ```
4. Check database connection pool:
   - Review connection pool settings
   - Check for connection leaks
   - Review database server logs
5. Check network connectivity:
   - Ping database server
   - Check firewall rules
   - Check DNS resolution

**Resolution**:
- If database is down: Restart database server
- If connection string wrong: Fix `DATABASE_URL`
- If network issue: Fix network/firewall
- If connection pool exhausted: Increase pool size or restart app

---

### Scenario 4: Slow Imports

**Symptoms**:
- Import takes > 5 minutes for large CSV
- Logs show: `durationSeconds` > 300 for large imports

**Action**:
1. ⚠️ **Performance issue** - Investigate
2. Check database performance:
   ```sql
   SHOW PROCESSLIST;  -- Check for slow queries
   SHOW INDEXES FROM farms;  -- Verify indexes exist
   ```
3. Check database indexes:
   ```sql
   SHOW INDEXES FROM farms WHERE Key_name = 'idx_farms_name_farmerName';
   SHOW INDEXES FROM yields WHERE Key_name = 'idx_yields_farmId';
   ```
4. Check server resources:
   - CPU usage
   - Memory usage
   - Disk I/O
5. Review import size:
   - How many rows? (>100K may be slow)
   - Consider splitting large CSVs

**Resolution**:
- If indexes missing: Create indexes (see `docs/INDEXES-SQL.sql`)
- If database slow: Optimize queries, check for locks
- If server overloaded: Scale up resources
- If CSV too large: Recommend splitting file

---

### Scenario 5: Import Fails with System Error

**Symptoms**:
- Error: "System error: ..."
- Logs show: `import_failed` with system error
- Unhandled exception

**Action**:
1. ⚠️ **System issue** - Investigate immediately
2. Check application logs for stack trace
3. Check recent deployments (did something change?)
4. Check database schema (did migrations run?)
5. Review error message for clues:
   - "Database connection not available" → DB issue
   - "Unknown error" → Check full stack trace
   - Specific error code → Look up in MySQL docs

**Resolution**:
- If code bug: Fix and deploy
- If schema mismatch: Run migrations
- If environment issue: Fix environment variables
- If unknown: Collect logs and escalate

---

### Scenario 6: CSV Too Large

**Symptoms**:
- Error: "CSV too large (150000 rows). Maximum allowed: 100000 rows."
- Logs show: Guardrail triggered

**Action**:
1. ✅ **Expected behavior** - Guardrail working
2. Tell admin to split CSV into smaller files (<100K rows each)
3. Or contact support for assistance with very large imports

**Resolution**: Admin splits CSV or contacts support

---

## Rollback Guidance

### When to Rollback

**Rollback if**:
- Wrong CSV imported at large scale (e.g., 10K+ rows)
- Data corruption detected
- Import caused system instability

**Do NOT rollback if**:
- Single import failure (just re-upload)
- Validation errors (fix CSV and re-upload)
- Reference errors (fix references and re-upload)

### Rollback Procedure

1. **Stop new imports** (if needed, temporarily disable feature)

2. **Export current state**:
   ```bash
   mysqldump -h HOST -u USER -p DATABASE users farms yields > backup_before_rollback.sql
   ```

3. **Restore from backup**:
   ```bash
   mysql -h HOST -u USER -p DATABASE < backup_before_rollback.sql
   ```

4. **Verify data**:
   ```sql
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM farms;
   SELECT COUNT(*) FROM yields;
   ```

5. **Re-enable imports** (if disabled)

**Note**: Admin CSV Upload is **append/update only** (no destructive actions), so rollback is typically not needed unless wrong data was imported.

---

## How to Escalate

### Information to Collect

**Required**:
- `sessionId` from error message or logs
- CSV type (farmers/farms/seasons)
- Start time (from logs)
- Duration (if available)
- Error counts (insertedCount, skippedCount, errorCount)
- Error messages (first 5-10 errors)

**Logs to Attach**:
```bash
# Filter logs by sessionId
grep "\[csv-1705312200000-a3f2k\]" /var/log/app.log > incident_logs.txt

# Or filter by time range
grep "\[AdminCSV\].*\[2024-01-15T10:30" /var/log/app.log > incident_logs.txt
```

### Escalation Path

1. **P3 (Info)**: Log to dashboard, no escalation
2. **P2 (Warning)**: Notify on-call, escalate after 1 hour if unresolved
3. **P1 (Critical)**: Page on-call immediately, escalate after 15 minutes

### Who to Escalate To

- **On-call engineer**: First responder
- **Team lead**: If issue persists > 1 hour
- **Database admin**: If database issues persist
- **DevOps**: If infrastructure issues

---

## Prevention Checklist

**Before Large Imports**:
- [ ] Backup database
- [ ] Verify indexes exist
- [ ] Check database health
- [ ] Verify CSV format matches requirements
- [ ] Test with small sample first

**After Large Imports**:
- [ ] Verify row counts increased as expected
- [ ] Spot-check sample records
- [ ] Monitor for errors in next 24 hours

---

## Quick Reference

### Log Patterns

**Successful Import**:
```
[AdminCSV] [timestamp] [sessionId] Starting farmers import: 10000 rows
[AdminCSV] [farmers] [sessionId] Batch 2 progress: 1000/10000 processed
[AdminCSV] [farmers] [sessionId] Import complete in 15.23s: 10000 inserted, 0 skipped, 0 errors
```

**Failed Import**:
```
[AdminCSV] [timestamp] [sessionId] Starting farmers import: 10000 rows
[AdminCSV] [farmers] [sessionId] System error after 5.12s: Database connection error
```

**Structured Metric**:
```json
{"type":"admin_csv_metric","metric":"import_completed","csvType":"farmers","sessionId":"csv-...","insertedCount":10000,"durationSeconds":15.23}
```

### Common Error Messages

- "CSV is missing required columns" → Validation error (user)
- "Farmer not found: ..." → Reference error (user)
- "Database connection error" → System error (investigate)
- "CSV too large" → Guardrail (expected)

### Useful Commands

```bash
# Check database connectivity
mysql -h HOST -u USER -p -e "SELECT 1;"

# Check indexes
mysql -h HOST -u USER -p -e "SHOW INDEXES FROM farms;"

# Count rows
mysql -h HOST -u USER -p -e "SELECT COUNT(*) FROM users;"

# Check recent imports (via logs)
grep "\[AdminCSV\].*Import complete" /var/log/app.log | tail -10
```

---

## Related Documentation

- `docs/SLO-ADMIN-CSV.md` - Service Level Objectives
- `docs/ALERTING-ADMIN-CSV.md` - Alert definitions
- `docs/INDEXES-SQL.sql` - Required database indexes
- `docs/README-admin-csv.md` - User documentation

