# Admin CSV Upload Feature

## Overview

The Admin CSV Upload feature allows trusted admin users to bulk import farmers, farms, and seasons/yields data into the MAGSASA-CARD Kaani ERP system via CSV files.

## Access

- **Route**: `/admin/csv-upload`
- **Access Level**: Admin only (requires `admin` role)
- **Location**: Navigate to `/admin/csv-upload` in the application

## CSV File Requirements

### 1. Farmers CSV (`demo_farmers.csv`)

**Required Columns:**
- `openId` (string, required) - Unique identifier for the farmer
- `name` (string, optional) - Farmer's full name
- `email` (string, optional) - Email address (must be valid email format if provided)
- `barangay` (string, optional) - Barangay location

**Example:**
```csv
openId,name,email,barangay
demo-farmer-1,"Juan dela Cruz",juan@example.com,"San Isidro"
demo-farmer-2,"Maria Santos",maria@example.com,"Dayap"
```

**Notes:**
- The `openId` must be unique. If a farmer with the same `openId` already exists, the existing record will be **updated** (not skipped).
- Re-uploading the same CSV will update existing farmers rather than create duplicates.
- Default values: `loginMethod` = "demo", `role` = "user"

### 2. Farms CSV (`demo_farms.csv`)

**Required Columns:**
- `name` (string, required) - Farm name
- `farmerName` (string, required) - Name of the farmer who owns the farm
- `barangay` (string, required) - Barangay location
- `municipality` (string, required) - Municipality (e.g., "Calauan")
- `latitude` (string, required) - Latitude coordinate
- `longitude` (string, required) - Longitude coordinate
- `size` (string, required) - Farm size (in hectares)
- `crops` (string, required) - JSON array of crop types (e.g., `["Palay (Rice)"]` or `["Tomato", "Pepper"]`)

**Optional Columns:**
- `userId` (number) - Direct reference to user ID (alternative to `farmerOpenId`)
- `farmerOpenId` (string) - Reference to farmer's `openId` (alternative to `userId`)
- `soilType` (string) - Soil type (e.g., "Clay Loam", "Sandy Loam")
- `irrigationType` (string) - One of: "Irrigated", "Rainfed", "Upland"
- `averageYield` (string) - Average yield per hectare
- `status` (string) - One of: "active", "inactive", "fallow" (default: "active")
- `registrationDate` (string) - Registration date in YYYY-MM-DD format

**Example:**
```csv
name,farmerName,barangay,municipality,latitude,longitude,size,crops,soilType,irrigationType,averageYield,status,registrationDate
"Santos Rice Farm","Maria Santos","San Isidro","Calauan",14.147500,121.318900,2.5,"[""Palay (Rice)""]","Clay Loam","Irrigated",5.8,active,2024-01-10
```

**Notes:**
- Either `userId` or `farmerOpenId` must be provided to link the farm to a farmer.
- If `farmerOpenId` is provided, the system will look up the farmer by `openId`.
- The `crops` column should be a JSON array string. Single crop names will be automatically wrapped in an array.
- If `registrationDate` is not provided, the current date will be used.

### 3. Seasons/Yields CSV (`demo_seasons.csv`)

**Required Columns:**
- `cropType` (string, required) - Type of crop (e.g., "Palay (Rice)", "Corn", "Tomato")
- `harvestDate` (string, required) - Harvest date in YYYY-MM-DD format
- `quantity` (string, required) - Harvest quantity
- `unit` (string, required) - Unit of measurement: "kg" or "tons"
- `qualityGrade` (string, required) - Quality grade: "Premium", "Standard", or "Below Standard"

**Optional Columns:**
- `farmId` (number) - Direct reference to farm ID (preferred)
- `farmName` (string) - Farm name for lookup (requires `farmerName`)
- `farmerName` (string) - Farmer name for lookup (used with `farmName`)
- `parcelIndex` (number) - Parcel index (default: 0)

**Example:**
```csv
farmId,parcelIndex,cropType,harvestDate,quantity,unit,qualityGrade
1,0,"Pepper",2023-11-26,20.75,kg,Premium
2,0,"Palay (Rice)",2024-03-03,5.2,tons,Standard
```

**Notes:**
- Either `farmId` or both `farmName` and `farmerName` must be provided.
- If `farmName` and `farmerName` are provided, the system will look up the farm by name and farmer name.
- If `parcelIndex` is not provided, it defaults to 0.

## Usage Instructions

### First-Time Import Checklist

**⚠️ IMPORTANT: Import data in this exact order:**

1. **Farmers First** → Import all farmers before farms
2. **Farms Second** → Import all farms before seasons (requires farmers to exist)
3. **Seasons Last** → Import seasons/yields (requires farms to exist)

**Why this order matters:**
- Farms reference farmers via `farmerOpenId` or `userId`
- Seasons reference farms via `farmId` or `farmName`+`farmerName`
- Importing out of order will cause "not found" errors

### Step-by-Step Guide

1. **Start the development server:**
   ```bash
   pnpm dev
   ```

2. **Navigate to the Admin CSV Upload page:**
   - Go to `/admin/csv-upload` in your browser
   - Ensure you are logged in as an admin user

3. **Select CSV Type:**
   - Click on the tab for the type of data you want to upload:
     - "Upload Farmers CSV"
     - "Upload Farms CSV"
     - "Upload Seasons CSV"

4. **Upload and Parse:**
   - Click "Select CSV File" or drag and drop a CSV file
   - The system will automatically parse and validate the CSV
   - Review any validation errors if they occur

5. **Preview Data:**
   - After successful parsing, a preview table will show the first 10 rows
   - Verify that the data looks correct

6. **Import Data:**
   - Click "Confirm & Import" to start the import process
   - The system will process the data in batches (500 rows per batch)
   - A progress indicator will show during import

7. **Review Results:**
   - After import completes, a summary will show:
     - Total rows processed
     - Number of rows successfully inserted
     - Number of rows skipped (duplicates or errors)
     - Number of errors (if any)
   - Click "Show Errors" to see detailed error messages for failed rows

## Error Handling

### Duplicate Entries
- **Farmers**: If a farmer with the same `openId` already exists, the row will be skipped and counted as "skipped"
- **Farms**: Duplicate farms are allowed (no unique constraint), but validation errors may occur
- **Seasons**: Duplicate seasons are allowed

### Validation Errors
- Missing required columns will prevent parsing
- Invalid data types (e.g., non-numeric where number expected) will cause row-level errors
- Foreign key references (e.g., `farmerOpenId` not found) will cause the row to be skipped

### Error Messages
- Row-level errors include the row index (1-based) and a descriptive error message
- Errors are displayed in a collapsible section after import
- Only the first 50 errors are shown in the UI (to prevent overwhelming the interface)

## Technical Details

### Backend Implementation
- **Router**: `server/routers.ts` → `adminCsv` router
- **Mutations**:
  - `adminCsv.uploadFarmersCsv`
  - `adminCsv.uploadFarmsCsv`
  - `adminCsv.uploadSeasonsCsv`
- **Batch Processing**: Data is processed in batches of 500 rows to avoid memory issues
- **Database**: Uses Drizzle ORM with MySQL

### Frontend Implementation
- **Component**: `client/src/pages/AdminCsvUpload.tsx`
- **CSV Parser**: Uses `papaparse` library for client-side CSV parsing
- **Validation**: Client-side validation of required columns before sending to backend

### Security
- **Admin-Only**: The feature is protected by role-based access control (admin role required)
- **Server-Side Validation**: All data is validated on the server before insertion
- **Error Handling**: Errors are caught and reported without exposing sensitive system details

## Reference Files

The canonical CSV structure is defined by these reference files:
- `docs/demo_farmers.csv` - Example farmers CSV
- `docs/demo_farms.csv` - Example farms CSV
- `docs/demo_seasons.csv` - Example seasons/yields CSV

These files can be used as templates for creating your own CSV files.

## Troubleshooting

### "Unauthorized: Admin access required"
- Ensure you are logged in as a user with `admin` role
- Check that the route protection is working correctly

### "CSV is missing required columns"
- Verify that your CSV file has all required columns (see above)
- Check that column names match exactly (case-sensitive)
- Ensure the first row contains headers

### "Farmer not found" (for farms CSV)
- Verify that the `farmerOpenId` exists in the database
- Ensure farmers are imported before farms
- Check that the `farmerOpenId` matches exactly (case-sensitive)

### "Farm not found" (for seasons CSV)
- Verify that the `farmId` exists in the database
- If using `farmName` and `farmerName`, ensure they match exactly
- Ensure farms are imported before seasons

### Import is slow
- Large CSV files (1000+ rows) may take several seconds to process
- The system processes data in batches to avoid overwhelming the database
- Progress indicators will show during import

## Best Practices

1. **Import Order** (CRITICAL):
   - ✅ **Farmers first** - Import all farmers before farms
   - ✅ **Farms second** - Import all farms before seasons (requires farmers to exist)
   - ✅ **Seasons last** - Import seasons/yields (requires farms to exist)
   
   **Failure to follow this order will result in "not found" errors for dependent records.**

2. **Data Validation**: Validate your CSV files before uploading:
   - Check for duplicate `openId` values in farmers CSV
   - Ensure all foreign key references (farmerOpenId, farmId) exist
   - Verify date formats (YYYY-MM-DD)

3. **Backup**: Before bulk imports, consider backing up your database

4. **Testing**: Test with a small CSV file (10-20 rows) before importing large datasets

5. **Error Review**: Always review the error summary after import to identify and fix data issues

