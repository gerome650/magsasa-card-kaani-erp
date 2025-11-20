# Farm Detail View - Admin Guide

**Audience**: Non-technical administrators and users  
**Purpose**: How to use and troubleshoot the Farm Detail View feature  
**Last Updated**: Pass 6 - Ops, Training & Postmortem

---

## What is Farm Detail View?

The Farm Detail View is a comprehensive page that shows detailed information about a single farm. It helps you:

- **View complete farm information** (farmer name, location, size, crops, status)
- **Review historical yields** (harvest records, quantities, quality grades)
- **Track costs** (fertilizer, pesticides, seeds, labor, equipment, other expenses)
- **Analyze profitability** (revenue, costs, profit margin, ROI)
- **See farm boundaries** (parcels and boundaries on a map, if available)

---

## How to Access Farm Detail View

1. **Log in** to the MAGSASA-CARD Kaani ERP system
2. **Navigate** to a farm in one of these ways:
   - From the **Farmers page**: Click on a farm name or farm card
   - From the **Map View**: Click on a farm marker on the map
   - From the **Analytics/Dashboard**: Click on a farm in any farm list
   - Direct URL: Go to `/farms/{id}` where `{id}` is the farm ID number
3. **Wait for the page to load** (usually takes less than 1 second)

---

## Using Farm Detail View

### Main Sections

**1. Farm Information (Top Section)**
- **Farm Name**: The name of the farm
- **Farmer Name**: The owner of the farm (clickable link to farmer profile)
- **Location**: Barangay and Municipality
- **Size**: Total farm area in hectares
- **Status**: Active, Inactive, or Pending
- **Crops**: List of crops grown on this farm
- **Average Yield**: Average yield per hectare (if available)

**2. Farm Boundaries / Parcels (Map Section)**
- Interactive map showing farm location
- Parcel boundaries (if drawn/uploaded)
- Parcel areas and total calculated area
- **Note**: Some farms may not have boundaries yet (this is normal for newly registered farms)

**3. Yields Table**
- Historical harvest records
- Shows: Date, Parcel, Crop Type, Quantity (kg or tons), Quality Grade
- **Pagination**: Shows first 50 records, click "Show More" to see additional records
- **Total Yield**: Sum of all yields in tons
- **Average Yield per Hectare**: Calculated from total yield and farm area

**4. Costs Table**
- Expense records
- Shows: Date, Category (Fertilizer, Pesticides, Seeds, Labor, Equipment, Other), Description, Amount, Parcel
- **Pagination**: Shows first 50 records, click "Show More" to see additional records
- **Total Costs**: Sum of all costs in PHP

**5. Profitability Analysis**
- **Total Revenue**: Calculated from yields using average market prices
- **Total Costs**: Sum of all cost records
- **Gross Profit**: Revenue minus costs
- **Profit Margin**: Percentage of revenue that is profit
- **ROI (Return on Investment)**: Percentage return on costs
- **Note**: Revenue is calculated using average market prices. Actual prices may vary.

**6. Sidebar**
- **Farmer Card**: Quick link to farmer profile
- **Production Stats**: Average yield and total production (if available)
- **Quick Stats**: Farm size, status, crop count

---

## Understanding the Numbers

### Yields

- **Quantity**: Amount harvested (in kg or tons)
- **Quality Grade**: Premium, Standard, or Below Standard
- **Total Yield**: Sum of all harvests in tons
- **Average Yield per Hectare**: Total yield divided by farm area

**Example**:
- Farm has 3 harvests: 2 tons, 1.5 tons, 2.5 tons
- Total Yield = 6 tons
- Farm size = 2 hectares
- Average Yield per Hectare = 3 tons/ha

### Costs

- **Category**: Type of expense (Fertilizer, Pesticides, Seeds, Labor, Equipment, Other)
- **Amount**: Cost in PHP (₱)
- **Total Costs**: Sum of all expenses

**Example**:
- Fertilizer: ₱5,000
- Labor: ₱10,000
- Seeds: ₱3,000
- Total Costs = ₱18,000

### Profitability

- **Total Revenue**: Calculated from yields × market price
  - Rice: ₱20,000 per ton
  - Corn: ₱15,000 per ton
  - Vegetables: ₱30,000 per ton
  - Fruits: ₱40,000 per ton
- **Gross Profit**: Revenue - Costs
- **Profit Margin**: (Gross Profit / Revenue) × 100%
- **ROI**: (Gross Profit / Costs) × 100%

**Example**:
- Total Yield: 6 tons of Rice
- Revenue: 6 × ₱20,000 = ₱120,000
- Costs: ₱18,000
- Gross Profit: ₱120,000 - ₱18,000 = ₱102,000
- Profit Margin: (₱102,000 / ₱120,000) × 100% = 85%
- ROI: (₱102,000 / ₱18,000) × 100% = 566.7%

---

## Common Error Messages

### "Farm not found"

**What it means**: The farm ID in the URL doesn't exist in the system, or you don't have permission to view it.

**What to do**:
1. **Check the URL** - Make sure the farm ID is correct
2. **Go back to the Farmers page** and click on the farm again
3. **Check if the farm was deleted** - The farm may have been removed from the system
4. If the error persists, **contact Engineering**

**When to escalate**: If you're sure the farm should exist and the error persists

---

### "Farm data could not be loaded due to a temporary database issue. Please try again."

**What it means**: The system cannot connect to the database temporarily.

**What to do**:
1. **Wait 30 seconds** and refresh the page (press F5 or Ctrl+R)
2. **Check if other pages work** (Farmers page, Map View, Dashboard)
3. If other pages also fail, **contact Engineering immediately** - this is a system-wide issue
4. If only Farm Detail fails, **try again in 1-2 minutes**

**When to escalate**: If error persists for > 15 minutes

---

### "Failed to load farm details. Please try again."

**What it means**: A general error occurred while loading the farm data.

**What to do**:
1. **Refresh the page** (F5 or Ctrl+R)
2. **Try again in 1-2 minutes**
3. If it persists, **check if other farms load correctly**
4. If only this farm fails, **note the farm ID and contact Engineering**

**When to escalate**: If error persists for > 1 hour

---

### Missing Data Warnings (Development Mode Only)

If you see warnings in the browser console (only visible in development mode):

- **"Active farm has no yield records"**: The farm is marked as active but has no harvest data yet (normal for newly registered farms)
- **"Farm has invalid or missing coordinates"**: The farm doesn't have GPS coordinates (normal for farms pending GPS survey)
- **"Farm has no crops listed"**: The farm doesn't have any crops assigned yet

**What to do**: These are informational warnings. If you see them frequently (> 10% of farms), contact Engineering.

---

## Do's and Don'ts

### ✅ Do's

- **Do verify farm identity** before using data for important decisions (check farmer name, location, farm ID)
- **Do refresh the page** if you see outdated data after bulk uploads or data imports
- **Do use pagination** ("Show More") to view all yields and costs for farms with many records
- **Do check profitability numbers** if they seem unusual (may indicate missing yields or costs)
- **Do report errors** if they persist for > 15 minutes

### ❌ Don'ts

- **Don't treat missing yields as zero production** without checking if the farm is newly registered
- **Don't assume all farms have boundaries** (some farms may not have GPS coordinates yet)
- **Don't ignore persistent errors** (> 15 minutes) - contact Engineering
- **Don't take screenshots with sensitive information** if sharing externally (check your organization's policy)
- **Don't assume profitability numbers are exact** - they use average market prices, actual prices may vary

---

## When to Contact Engineering

### Contact Immediately (P1 - Critical)

- **Farm Detail completely unavailable** for > 15 minutes (all farms fail to load)
- **Database connection errors** persisting > 15 minutes
- **System-wide issues** (Farm Detail, Farmers page, Map View all failing)
- **Data corruption suspected** (e.g., negative yields, impossible profitability numbers)

### Contact Within 4 Hours (P2 - High Priority)

- **Farm Detail errors** persisting > 1 hour (but other pages work)
- **Specific farms failing** to load repeatedly (note the farm IDs)
- **Performance issues** (page loads very slowly, > 5 seconds)
- **Data quality issues** (> 20% of farms missing expected data)

### Contact Within 24 Hours (P3 - Medium Priority)

- **Intermittent errors** (works sometimes, fails other times)
- **Minor performance issues** (page loads slowly but eventually works)
- **Questions about features** or how to interpret data
- **Data quality questions** (e.g., why some farms have no yields)

---

## Troubleshooting Checklist

Before contacting Engineering, try these steps:

1. **Refresh the page** (Ctrl+R or Cmd+R or F5)
2. **Check other pages** (Farmers page, Map View, Dashboard) - do they work?
3. **Check your internet connection**
4. **Try a different browser** (Chrome, Firefox, Safari, Edge)
5. **Clear browser cache** (if other pages work but Farm Detail doesn't)
6. **Wait 5 minutes** and try again (for transient errors)
7. **Try a different farm** (to see if it's farm-specific or system-wide)

**If all steps fail**, contact Engineering with:
- Error message (exact text)
- When it started
- Whether other pages work
- Farm ID (if specific farm is failing)
- Browser and operating system

---

## Understanding Data Differences

### Why Farm Detail Might Show Different Numbers Than Other Pages

**1. Timing Differences**
- Farm Detail shows the most up-to-date data
- Other pages (Analytics, Dashboard) may show cached or aggregated data
- **Solution**: Refresh both pages to see if numbers align

**2. Missing Data**
- Farm Detail shows all yields and costs for the farm
- Analytics may only show data from certain time periods
- **Solution**: Check date ranges in Analytics filters

**3. Calculation Differences**
- Farm Detail calculates profitability from raw yields and costs
- Analytics may use different formulas or aggregations
- **Solution**: Both are correct, but may use different methods

**4. Coordinate Differences**
- Farm Detail shows exact coordinates from the database
- Map View may show coordinates from a different source or cache
- **Solution**: Farm Detail is the source of truth for coordinates

---

## Related Resources

- **Engineering Notes**: `docs/ENGINEERING-NOTES-FARMDETAIL.md` (for technical details)
- **Runbook**: `docs/RUNBOOK-FARMDETAIL.md` (for operations team)
- **Failure Scenarios**: `docs/FAILURE-SCENARIOS-FARMDETAIL.md` (for testing)
- **SLOs**: `docs/SLO-FARMDETAIL.md` (Service Level Objectives)

---

## Questions?

Contact the Engineering team via your organization's support channel.

---

**Last Updated**: Pass 6 - Ops, Training & Postmortem  
**Version**: 1.0

