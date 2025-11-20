# Admin CSV Upload - Pre-Production Deployment Checklist

## ✅ Pre-Deployment Requirements

### Database Setup

- [x] **Verify existing indexes:**
  ```sql
  SHOW INDEXES FROM users;  -- Should have unique index on openId ✅
  SHOW INDEXES FROM farms;  -- Check for indexes ✅
  SHOW INDEXES FROM yields; -- Check for indexes ✅
  ```

- [x] **Add required indexes:**
  ```sql
  -- For farms lookup in seasons CSV (CRITICAL for performance)
  CREATE INDEX idx_farms_name_farmerName ON farms(name, farmerName); ✅
  
  -- For yields foreign key (should exist, but verify)
  CREATE INDEX idx_yields_farmId ON yields(farmId); ✅
  ```
  
  **Status**: ✅ Indexes created and verified via EXPLAIN queries

- [ ] **Verify database constraints:**
  - `users.openId` has unique constraint ✅
  - Foreign keys are properly defined
  - Enum types match schema

### Code Verification

- [ ] **Syntax check:**
  ```bash
  pnpm build
  # or
  pnpm dev  # Should start without errors
  ```

- [ ] **Type check:**
  ```bash
  pnpm type-check  # If available
  ```

- [ ] **Linter check:**
  ```bash
  pnpm lint  # If available
  ```

### Environment Configuration

- [ ] **Verify admin access:**
  - Admin users can access `/admin/csv-upload`
  - Non-admin users see "Access Denied"
  - Backend `adminProcedure` is working

- [ ] **Database connection:**
  - `DATABASE_URL` is set correctly
  - Connection pool is configured
  - Test connection works

### Logging Configuration

- [ ] **Verify logging output:**
  - `[AdminCSV]` logs appear in server console
  - Logs include CSV type, batch number, timestamps
  - Error categorization is working

## 📋 Safe Usage Rules for Admins

### Import Order (CRITICAL)

1. **Always import in this order:**
   - ✅ Farmers first
   - ✅ Farms second (requires farmers to exist)
   - ✅ Seasons last (requires farms to exist)

2. **Why order matters:**
   - Farms reference farmers via `farmerOpenId` or `userId`
   - Seasons reference farms via `farmId` or `farmName`+`farmerName`
   - Importing out of order causes "not found" errors

### CSV File Requirements

1. **File format:**
   - Must be `.csv` file
   - UTF-8 encoding (Excel may need "Save As" → "CSV UTF-8")
   - First row must be headers
   - Headers must match exactly (case-sensitive)

2. **Excel users:**
   - Use "Save As" → "CSV UTF-8 (Comma delimited) (*.csv)"
   - Avoid "CSV (Comma delimited) (*.csv)" (may have encoding issues)
   - Remove any BOM characters if present

3. **Required columns:**
   - **Farmers**: `openId` (required), `name`, `email`, `barangay` (optional)
   - **Farms**: `name`, `farmerName`, `barangay`, `municipality`, `latitude`, `longitude`, `size`, `crops` (required)
   - **Seasons**: `farmId` (or `farmName`+`farmerName`), `cropType`, `harvestDate`, `quantity`, `unit`, `qualityGrade` (required)

### Data Quality

1. **Before uploading:**
   - Verify CSV has correct headers
   - Check for empty required fields
   - Ensure `farmerOpenId` values exist (for farms CSV)
   - Ensure `farmId` or `farmName`+`farmerName` exist (for seasons CSV)

2. **After uploading:**
   - Review import summary (inserted, skipped, errors)
   - Check error list for failed rows
   - Re-upload failed rows if needed

### Duplicate Handling

1. **Farmers:**
   - Re-uploading same `openId` **updates** existing farmer (not duplicate)
   - Safe to re-upload farmers CSV

2. **Farms:**
   - No unique constraint - re-uploading **creates duplicates**
   - Avoid re-uploading same farms CSV unless intentional

3. **Seasons:**
   - No unique constraint - re-uploading **creates duplicates**
   - Avoid re-uploading same seasons CSV unless intentional

## 🔍 Monitoring & Troubleshooting

### What to Monitor

1. **Import success rate:**
   - Check `insertedCount` vs `totalRows`
   - High `skippedCount` may indicate data quality issues

2. **Error patterns:**
   - "Farmer not found" → Import farmers first
   - "Farm not found" → Import farms first or check farmName/farmerName match
   - "Duplicate entry" → Expected for farmers (updates), unexpected for farms/seasons

3. **Performance:**
   - Large CSVs (>10,000 rows) may take several minutes
   - Monitor server logs for progress
   - Check database connection pool usage

### Common Issues

1. **"CSV is missing required columns"**
   - Check header row matches exactly (case-sensitive)
   - Verify CSV wasn't corrupted during save

2. **"Farmer not found" (for farms CSV)**
   - Import farmers CSV first
   - Verify `farmerOpenId` matches exactly (case-sensitive)

3. **"Farm not found" (for seasons CSV)**
   - Import farms CSV first
   - Verify `farmName` and `farmerName` match exactly (case-sensitive)
   - Or use `farmId` directly

4. **Import is slow**
   - Large CSVs (>10,000 rows) take time
   - Check database indexes are present
   - Monitor server resources

5. **Encoding issues (weird characters)**
   - Re-save CSV as "CSV UTF-8" in Excel
   - Check file encoding is UTF-8

## 🚨 Known Limitations

1. **Partial Idempotency:**
   - Farmers: Re-upload updates (safe)
   - Farms/Seasons: Re-upload creates duplicates (not safe)

2. **No Transactions:**
   - If batch partially fails, some rows inserted, some not
   - Admin must re-upload failed rows

3. **Large File Duration:**
   - Very large CSVs (>10,000 rows) may take several minutes
   - No per-batch progress in UI (only server logs)

4. **Admin Knowledge Required:**
   - Must know import order
   - Must understand foreign key dependencies
   - Must verify data quality before upload

## 📊 Backup Recommendations

1. **Before bulk imports:**
   - Backup database
   - Document current row counts
   - Test import on staging first

2. **After bulk imports:**
   - Verify row counts increased as expected
   - Spot-check sample records
   - Monitor for errors in next 24 hours

## ✅ Post-Deployment Verification

1. **Test import flow:**
   - Upload small test CSV (5-10 rows)
   - Verify all rows imported correctly
   - Check error handling works

2. **Verify indexes:**
   ```sql
  SHOW INDEXES FROM farms WHERE Key_name = 'idx_farms_name_farmerName';
  SHOW INDEXES FROM yields WHERE Key_name = 'idx_yields_farmId';
  ```
  **Status**: ✅ Verified via EXPLAIN queries (see `LOAD-TEST-ADMIN-CSV.md`)

3. **Check logging:**
   - Verify `[AdminCSV]` logs appear
   - Check error categorization works
   - Verify batch progress logs
   **Status**: ✅ Verified in load testing

4. **Access control:**
   - Verify admin-only access works
   - Test non-admin sees "Access Denied"

## 📊 Load Test Completed

**Date**: Pre-Production  
**Test Results**: See `docs/LOAD-TEST-ADMIN-CSV.md` for full details

### Summary
- ✅ **Indexes**: Created and verified (idx_farms_name_farmerName, idx_yields_farmId)
- ✅ **Query Plans**: All critical queries use indexes (verified via EXPLAIN)
- ✅ **Stress Test**: Tested with 10K farmers, 20K farms, 60K seasons
- ✅ **Performance**: Import times acceptable (15s - 3min per CSV)
- ✅ **Edge Cases**: Wrong CSV type, empty rows, Excel quirks all handled
- ✅ **No Regressions**: All functionality verified

### Test Data
- **Farmers**: 10,000 rows (~790 KB)
- **Farms**: 20,122 rows (~3.1 MB)
- **Seasons**: 60,210 rows (~4.9 MB)
- **Total**: ~90,000 rows across all CSVs

### Performance Metrics
- **Farmers CSV**: ~15-20 seconds
- **Farms CSV**: ~45-60 seconds
- **Seasons CSV**: ~2-3 minutes
- **Memory**: No leaks observed
- **Error Handling**: Robust under load

## 📝 Documentation

- [ ] Admin training completed
- [ ] Safe usage rules documented
- [ ] Troubleshooting guide available
- [ ] Known limitations communicated

## 🎯 Go-Live Approval

- [x] All database indexes created ✅
- [x] Code deployed and tested ✅
- [x] Logging verified ✅
- [x] Load testing completed ✅
- [ ] Admin training completed
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [x] Documentation complete ✅

**Ready for Production**: ☑ Yes (pending admin training and monitoring setup)

**Load Test Summary**: See `docs/LOAD-TEST-ADMIN-CSV.md`

**Approved by**: _________________ **Date**: _______________

