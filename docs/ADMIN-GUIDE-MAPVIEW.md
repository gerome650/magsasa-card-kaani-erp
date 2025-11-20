# Map View - Admin Guide

**Audience**: Non-technical administrators and users  
**Purpose**: How to use and troubleshoot the Map View feature  
**Last Updated**: Pre-Production QA

---

## What is Map View?

The Map View is a geographic visualization tool that shows all farms in the system on an interactive map. It helps you:

- **See farm locations** across different regions (barangays, municipalities)
- **Filter farms** by crop type or region
- **Understand farm distribution** geographically
- **Identify data quality issues** (farms missing coordinates)

---

## How to Access Map View

1. **Log in** to the MAGSASA-CARD Kaani ERP system
2. **Navigate** to the Map View page:
   - Click "Map View" in the main navigation menu
   - Or go directly to `/map` in your browser
3. **Wait for the map to load** (usually takes 1-3 seconds)

---

## Using Map View

### Basic Navigation

- **Zoom**: Use mouse wheel or zoom controls
- **Pan**: Click and drag the map
- **Click markers**: Click any farm marker to see details (farm name, farmer, location, crops, yield)

### Filters

**Color by Crop Type**:
- Shows different colors for different crop types
- Helps identify crop distribution across regions

**Color by Performance**:
- Shows farms colored by yield performance (high/medium/low)
- Helps identify high-performing vs low-performing farms

**Crop Filter**:
- Select a specific crop type to show only farms with that crop
- Example: Select "Rice" to see only rice farms

**Region Filter**:
- Filter by region (Bacolod, Laguna, etc.)
- Helps focus on specific geographic areas

---

## Understanding Map Count vs Total Farm Count

**Important**: The number of farms shown on the map may be **less than** the total number of farms in the system.

### Why?

The Map View only shows farms that have **valid coordinates** (latitude and longitude). Farms without coordinates cannot be displayed on a map.

**Example**:
- **Total farms in system**: 5,000
- **Farms with coordinates**: 4,850
- **Farms on map**: 4,850
- **Missing**: 150 farms (3%)

This is **normal** - some farms may not have coordinates yet, especially if they were recently added or imported from older data.

### When to Worry

- **< 5% missing**: Normal, no action needed
- **5-10% missing**: Minor data quality issue, consider updating coordinates
- **> 10% missing**: Data quality issue, contact Engineering

---

## Common Error Messages

### "Map data could not be loaded due to a database connection issue. Please try again."

**What it means**: The system cannot connect to the database.

**What to do**:
1. **Wait 30 seconds** and refresh the page
2. If it persists, **check if other pages work** (Dashboard, Analytics)
3. If other pages also fail, **contact Engineering** - this is a system-wide issue

**When to escalate**: If error persists for > 15 minutes

---

### "Map data is temporarily unavailable. Please try again later."

**What it means**: The Map View service is experiencing a temporary issue (not a database problem).

**What to do**:
1. **Wait 1-2 minutes** and refresh the page
2. If it persists, **try again in 5 minutes**
3. If it still fails, **contact Engineering**

**When to escalate**: If error persists for > 1 hour

---

### "Map data set is too large. Please contact support."

**What it means**: The system has detected an unusually large number of farms (> 200,000), which may indicate a data issue.

**What to do**:
1. **Contact Engineering immediately**
2. **Do not try to fix this yourself**
3. Provide the error message and timestamp

**When to escalate**: Always escalate immediately (P1)

---

### Data Quality Warnings (Development Mode Only)

If you see a "Data Quality Metrics" panel (only visible in development):

- **Missing Coords**: Shows how many farms are missing coordinates
- **Distinct Crops**: Shows unique crop types in the system
- **Distinct Barangays**: Shows unique barangays in the system

**What to do**: These are informational only. If percentages are high (> 10%), contact Engineering.

---

## Do's and Don'ts

### ✅ Do's

- **Do refresh the page** if the map doesn't load initially
- **Do use filters** to focus on specific crops or regions
- **Do click markers** to see farm details
- **Do report errors** if they persist for > 15 minutes
- **Do check other pages** if Map View fails (helps diagnose system-wide vs isolated issues)

### ❌ Don'ts

- **Don't panic** if map count is slightly less than total farm count (< 5% difference is normal)
- **Don't try to fix database errors** yourself
- **Don't ignore persistent errors** (> 15 minutes)
- **Don't assume** all farms should be on the map (some may legitimately not have coordinates)

---

## When to Contact Engineering

### Contact Immediately (P1)

- **"Map data set is too large"** error
- **Database connection errors** persisting > 15 minutes
- **Map View completely unavailable** for > 15 minutes
- **> 20% of farms missing coordinates** (data quality issue)

### Contact Within 4 Hours (P2)

- **Map View errors** persisting > 1 hour
- **> 10% of farms missing coordinates** (data quality issue)
- **Performance issues** (map loads very slowly, > 10 seconds)

### Contact Within 24 Hours (P3)

- **Intermittent errors** (works sometimes, fails other times)
- **Minor performance issues** (map loads slowly but eventually works)
- **Questions about filters or features**

---

## Troubleshooting Checklist

Before contacting Engineering, try these steps:

1. **Refresh the page** (Ctrl+R or Cmd+R)
2. **Check other pages** (Dashboard, Analytics) - do they work?
3. **Check your internet connection**
4. **Try a different browser** (Chrome, Firefox, Safari)
5. **Clear browser cache** (if other pages work but Map View doesn't)
6. **Wait 5 minutes** and try again (for transient errors)

**If all steps fail**, contact Engineering with:
- Error message (exact text)
- When it started
- Whether other pages work
- Browser and operating system

---

## Related Resources

- **Engineering Notes**: `docs/ENGINEERING-NOTES-MAPVIEW.md` (for technical details)
- **Runbook**: `docs/RUNBOOK-MAPVIEW.md` (for operations team)
- **Failure Scenarios**: `docs/FAILURE-SCENARIOS-MAPVIEW.md` (for testing)

---

**Questions?** Contact the Engineering team via your organization's support channel.

---

**Last Updated**: Pre-Production QA  
**Version**: 1.0
