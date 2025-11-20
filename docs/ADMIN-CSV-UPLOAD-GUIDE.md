# Admin CSV Upload - User Guide

**Audience**: Internal administrators using the CSV upload feature  
**Purpose**: Step-by-step guide for safely importing farmers, farms, and seasons data

---

## What This Tool Does

The Admin CSV Upload tool allows you to import large amounts of data into the MAGSASA-CARD system at once using CSV (Excel) files. You can import three types of data:

1. **Farmers** - Basic information about farmers (name, email, location)
2. **Farms** - Farm details (location, size, crops, soil type)
3. **Seasons/Yields** - Harvest records (crop type, harvest date, quantity, quality)

This is much faster than entering data one record at a time through the regular interface.

---

## When to Use This Tool

### ✅ Good Uses

- **Onboarding new batches** from CARD MRI or LandBank partner data
- **Cleaning up old Excel lists** and importing them into the system
- **Bulk updates** when you need to update many records at once
- **Initial data migration** when setting up the system for a new region

### ❌ When NOT to Use This Tool

- **One-off fixes** - If you only need to update 1-2 records, use the regular edit interface instead
- **Testing or debugging** - Never test in production! Use the staging environment first
- **Frequent small updates** - For regular day-to-day updates, use the normal UI
- **Unverified data** - Only import data you've verified is correct and complete

---

## Step-by-Step Workflow

### Step 1: Log In as Admin

1. Go to the login page
2. Log in with your admin account
3. Make sure you see the admin menu options

### Step 2: Navigate to CSV Upload

1. In the admin menu, click on **"Admin CSV Upload"** or go directly to `/admin/csv-upload`
2. You'll see three tabs: **Farmers**, **Farms**, and **Seasons**

### Step 3: Prepare Your CSV File

**⚠️ CRITICAL: Import Order**

You **MUST** import in this exact order:
1. **Farmers first** (they must exist before farms can reference them)
2. **Farms second** (they must exist before seasons can reference them)
3. **Seasons last** (they reference farms)

**CSV Format Requirements**:

- File must be saved as `.csv` format (not `.xlsx`)
- First row must contain column headers (exact names, case-sensitive)
- Use UTF-8 encoding (save as "CSV UTF-8" in Excel)
- Required columns must be present (see below)
- Optional columns can be left empty

**Required Columns**:

- **Farmers CSV**: `openId` (name, email, barangay are optional)
- **Farms CSV**: `name`, `farmerName`, `barangay`, `municipality`, `latitude`, `longitude`, `size`, `crops` (plus either `userId` or `farmerOpenId`)
- **Seasons CSV**: `cropType`, `harvestDate`, `quantity`, `unit`, `qualityGrade` (plus either `farmId` or `farmName` + `farmerName`)

**Example CSV Headers**:

```csv
openId,name,email,barangay
demo-farmer-1,"Juan dela Cruz",juan@example.com,"San Isidro"
```

### Step 4: Upload and Preview

1. Click on the appropriate tab (Farmers, Farms, or Seasons)
2. Click **"Select CSV File"** or drag and drop your CSV file
3. The system will automatically:
   - Parse your CSV
   - Validate the column headers
   - Show you a preview of the first 10 rows
4. **Review the preview carefully** - make sure the data looks correct
5. If you see validation errors, fix your CSV and try again

### Step 5: Run the Import

1. After reviewing the preview, click **"Confirm & Import"**
2. The system will process your data in batches
3. You'll see a loading spinner - **don't close the page** while it's processing
4. Large files (10,000+ rows) may take several minutes

### Step 6: Review the Results

After the import completes, you'll see an **Import Summary** with:

- **Total Rows Processed**: How many rows were in your CSV
- **Inserted**: How many rows were successfully added/updated
- **Skipped**: How many rows had errors and were not imported
- **Errors**: A list of specific errors (if any)

---

## How to Interpret the Results

### What "Inserted" Means

- **Farmers**: New farmers were added, or existing farmers (same `openId`) were updated
- **Farms**: New farms were added (duplicates are allowed)
- **Seasons**: New harvest records were added (duplicates are allowed)

### What "Skipped" Means

Rows that had errors and could not be imported. Common reasons:
- Missing required data
- Invalid data format
- Referenced farmer/farm doesn't exist (check import order!)

### Common Error Messages

**"CSV is missing required columns: openId"**
- **What it means**: Your CSV doesn't have the required column headers
- **What to do**: Check your CSV headers match exactly (case-sensitive)

**"Farmer not found: demo-farmer-123"**
- **What it means**: A farm is trying to reference a farmer that doesn't exist
- **What to do**: Make sure you imported Farmers CSV first, and that `farmerOpenId` values match exactly

**"Farm not found: Farm Name for Farmer Name"**
- **What it means**: A season is trying to reference a farm that doesn't exist
- **What to do**: Make sure you imported Farms CSV first, and that `farmName` and `farmerName` match exactly

**"CSV too large (150000 rows). Maximum allowed: 100000 rows."**
- **What it means**: Your CSV exceeds the size limit
- **What to do**: Split your CSV into smaller files (under 100,000 rows each)

**"Duplicate entry: demo-***er-1 already exists"**
- **What it means**: For farmers, this is OK - the existing record will be updated
- **What to do**: No action needed (this is expected behavior for farmers)

---

## Do's and Don'ts

### ✅ Do's

- **Test in staging first** - Always test new CSV formats in the staging environment before using in production
- **Keep backups** - Save a copy of your original CSV files before importing
- **Verify data** - Double-check your CSV data is correct before importing
- **Import in order** - Always import Farmers → Farms → Seasons
- **Check results** - Review the import summary and spot-check a few records in the system
- **Start small** - For new CSV formats, test with 10-20 rows first

### ❌ Don'ts

- **Don't re-import blindly** - Re-importing the same CSV multiple times can create duplicates (for farms/seasons) or unnecessary updates (for farmers)
- **Don't skip validation** - If you see validation errors, fix them before importing
- **Don't import in wrong order** - This will cause many "not found" errors
- **Don't use production for testing** - Always test new CSVs in staging first
- **Don't ignore errors** - If you see errors, investigate and fix them before proceeding
- **Don't upload huge files** - Files over 100,000 rows should be split

---

## When to Call Engineering

### Call Engineering If:

- **System errors** - You see "Database connection error" or "System error" messages
- **All imports failing** - Every import fails, not just one CSV
- **Unexpected behavior** - The system behaves differently than described in this guide
- **Performance issues** - Imports that used to work are now extremely slow
- **Data corruption** - You notice data in the system is incorrect after import

### Don't Call Engineering For:

- **Validation errors** - These are usually CSV format issues you can fix
- **Reference errors** - These usually mean you need to import in the correct order
- **Single import failures** - Try again or check your CSV first
- **Questions about CSV format** - Check this guide or the technical documentation first

### How to Report Issues

When calling Engineering, provide:

1. **What you were trying to do** (e.g., "Importing 5,000 farmers")
2. **What happened** (e.g., "Got 'Database connection error' message")
3. **When it happened** (date and time)
4. **Error message** (copy the exact text)
5. **CSV file** (if possible, share a small sample - remove sensitive data first)

---

## Quick Reference

### Import Order (CRITICAL)
1. Farmers → 2. Farms → 3. Seasons

### File Size Limit
- Maximum: 100,000 rows per CSV
- If larger: Split into multiple files

### Required Columns Quick Check

**Farmers**: `openId`  
**Farms**: `name`, `farmerName`, `barangay`, `municipality`, `latitude`, `longitude`, `size`, `crops`  
**Seasons**: `cropType`, `harvestDate`, `quantity`, `unit`, `qualityGrade`

### Common Mistakes to Avoid

1. ❌ Importing Farms before Farmers
2. ❌ Importing Seasons before Farms
3. ❌ Using wrong column names (case-sensitive!)
4. ❌ Missing required columns
5. ❌ CSV file too large (>100K rows)
6. ❌ Not testing in staging first

---

## Need More Help?

- **Technical Documentation**: See `docs/README-admin-csv.md` for detailed technical requirements
- **Engineering Notes**: See `docs/ENGINEERING-NOTES-ADMIN-CSV.md` for developers
- **Support**: Contact the Engineering team for system-level issues

---

**Last Updated**: Production Go-Live  
**Version**: 1.0

