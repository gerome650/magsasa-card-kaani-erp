# Chart Interactivity & Demo Authentication Guide

## Overview

The MAGSASA-CARD dashboard now features **interactive analytics charts** with drill-down capabilities and a **simplified demo authentication system** for testing different user roles.

---

## Demo Authentication System

### Demo Accounts

For development and testing purposes, OAuth login has been replaced with a simple username/password system. Three demo accounts are available, each representing a different role:

| Role | Username | Password | Name | Dashboard Access |
|------|----------|----------|------|------------------|
| **Farmer** | `farmer` | `demo123` | Juan dela Cruz | Farmer Dashboard (personal farm data) |
| **Field Officer** | `officer` | `demo123` | Maria Santos | Field Officer Dashboard (task management, farmer list) |
| **Manager** | `manager` | `demo123` | Roberto Garcia | Manager Dashboard (team metrics, analytics) |

### How to Login

1. Navigate to the login page (`/login`)
2. Click on any of the demo account buttons to auto-fill credentials
3. Click "Sign In" to access the role-specific dashboard

**Note**: OAuth authentication (Google, Microsoft, Apple) can be re-enabled for production deployment.

---

## Interactive Analytics Charts

All charts in the **Analytics Dashboard** (`/analytics`) now support click-to-filter functionality, allowing users to drill down from high-level metrics to detailed farm data.

### 1. Municipality Bar Chart

**Location**: Analytics Dashboard → "Farms by Municipality" card

**Functionality**:
- Click any bar to navigate to the Farms page filtered by that municipality
- Tooltip shows: "Click to filter farms by municipality"

**Example**:
- Click the "Los Baños" bar
- Redirects to `/farms?barangay=Los%20Baños`
- Farms page displays only farms in Los Baños

**Implementation**:
```typescript
// File: client/src/components/charts/MunicipalityBarChart.tsx
onClick: (_event, elements) => {
  if (elements.length > 0) {
    const municipality = chartData.labels[elements[0].index];
    navigate(`/farms?barangay=${encodeURIComponent(municipality)}`);
  }
}
```

---

### 2. Crop Distribution Pie Chart

**Location**: Analytics Dashboard → "Crop Distribution" card

**Functionality**:
- Click any pie slice to navigate to the Farms page filtered by that crop
- Tooltip shows: "Click to filter farms by crop"

**Example**:
- Click the "Rice" slice
- Redirects to `/farms?crop=Rice`
- Farms page displays only farms growing rice

**Implementation**:
```typescript
// File: client/src/components/charts/CropDistributionPieChart.tsx
onClick: (_event, elements) => {
  if (elements.length > 0) {
    const crop = chartData.labels[elements[0].index];
    navigate(`/farms?crop=${encodeURIComponent(crop)}`);
  }
}
```

---

### 3. Yield Trends Line Chart

**Location**: Analytics Dashboard → "Average Yield Trends" card

**Functionality**:
- Click any data point to navigate to the Farms page filtered by that month's date range
- Tooltip shows: "Click to filter farms by month"

**Example**:
- Click the "Jan 2024" data point
- Redirects to `/farms?startDate=2024-01-01&endDate=2024-01-31`
- Farms page displays only farms registered in January 2024

**Implementation**:
```typescript
// File: client/src/components/charts/YieldTrendsLineChart.tsx
onClick: (_event, elements) => {
  if (elements.length > 0) {
    const monthKey = chartData.monthKeys[elements[0].index];
    const startDate = `${monthKey}-01`;
    const endDate = `${monthKey}-${lastDayOfMonth}`;
    navigate(`/farms?startDate=${startDate}&endDate=${endDate}`);
  }
}
```

---

## URL-Based Filter State Management

The Farms page now supports **URL query parameters** for filter state, enabling:

### Supported Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `search` | Search query for farm/farmer name | `?search=Juan` |
| `barangay` | Filter by municipality/barangay | `?barangay=Los%20Baños` |
| `crop` | Filter by crop type | `?crop=Rice` |
| `status` | Filter by farm status | `?status=Active` |
| `startDate` | Filter by registration start date | `?startDate=2024-01-01` |
| `endDate` | Filter by registration end date | `?endDate=2024-01-31` |

### Features

1. **Shareable URLs**: Copy and share filtered farm views
   - Example: `/farms?crop=Rice&status=Active`

2. **Browser Navigation**: Back/forward buttons preserve filter state

3. **Persistent Filters**: Filters remain active when navigating between pages

4. **Clear Filters**: Use the "Clear All Filters" button or remove URL parameters

### Implementation Details

**Reading URL Parameters**:
```typescript
// File: client/src/pages/Farms.tsx
const searchParams = new URLSearchParams(useSearch());
const [selectedCrop, setSelectedCrop] = useState(
  searchParams.get("crop") || "all"
);
```

**Updating URL on Filter Change**:
```typescript
useEffect(() => {
  const params = new URLSearchParams();
  if (selectedCrop !== "all") params.set("crop", selectedCrop);
  
  const newUrl = params.toString() ? `/farms?${params}` : "/farms";
  window.history.replaceState({}, "", newUrl);
}, [selectedCrop]);
```

---

## User Workflow Example

### Scenario: Manager analyzing rice farm performance

1. **Login** as Manager (`manager` / `demo123`)
2. Navigate to **Analytics Dashboard**
3. View **Crop Distribution** pie chart
4. **Click "Rice" slice** → Redirected to `/farms?crop=Rice`
5. See all 45 rice farms with applied filter
6. Click **"View Details"** on a specific farm
7. Analyze farm performance metrics
8. Use **browser back button** to return to filtered farm list
9. Click **"Clear Filters"** to view all farms

---

## Visual Feedback

All interactive charts include:

- **Cursor pointer**: Hover over chart elements to see clickable cursor
- **Tooltip hints**: Footer text indicates "Click to filter farms by..."
- **Smooth navigation**: Instant redirection to filtered Farms page

---

## Technical Architecture

### Chart Libraries

- **Chart.js 3.x**: Core charting library
- **react-chartjs-2**: React wrapper for Chart.js
- **wouter**: Lightweight routing library for navigation

### State Management

- **URL Parameters**: Single source of truth for filter state
- **React State**: Local state synced with URL
- **localStorage**: User session persistence

### File Structure

```
client/src/
├── components/
│   └── charts/
│       ├── MunicipalityBarChart.tsx  # Bar chart with onClick
│       ├── CropDistributionPieChart.tsx  # Pie chart with onClick
│       └── YieldTrendsLineChart.tsx  # Line chart with onClick
├── pages/
│   ├── Analytics.tsx  # Analytics dashboard
│   ├── Farms.tsx  # Farms page with URL filters
│   └── Login.tsx  # Demo login form
└── data/
    └── usersData.ts  # Demo user credentials
```

---

## Filter Breadcrumb Navigation

**Location**: Farms page, above the farm list

**Features**:
- **Visual Filter Summary**: Displays all active filters as styled badges
- **Individual Clear Buttons**: Each filter badge has an X button to remove that specific filter
- **Clear All Button**: Appears when 2+ filters are active for quick reset
- **Smart Display**: Only shows when at least one filter is active
- **URL Sync**: Clearing filters automatically updates the URL

**Filter Badge Format**:
- Search: `Search: [query]`
- Municipality: `Municipality: [name]`
- Crop: `Crop: [type]`
- Status: `Status: [status]`
- Date Range: `Date Range: MMM d, yyyy - MMM d, yyyy`

**Example**:
```
Active Filters: [Crop: Rice] [X] [Municipality: Los Baños] [X] [Status: Active] [X]  [Clear All]
3 filters applied
```

**Implementation**:
```typescript
// File: client/src/components/FilterBreadcrumb.tsx
<FilterBreadcrumb
  searchQuery={searchQuery}
  selectedCrop={selectedCrop}
  onClearCrop={() => setSelectedCrop("all")}
  onClearAll={clearAllFilters}
/>
```

---

## Back to Analytics Navigation

**Location**: Farms page breadcrumb (when navigated from Analytics)

**Functionality**:
- Appears automatically when user clicks a chart in the Analytics dashboard
- Positioned at the top of the filter breadcrumb component
- Styled as a subtle ghost button with left arrow icon
- Returns user to `/analytics` page with one click

**How It Works**:
1. User clicks any chart element in Analytics dashboard
2. Navigation URL includes `?from=analytics` parameter
3. Farms page detects the parameter and shows "Back to Analytics Dashboard" link
4. Link does NOT appear when navigating directly to `/farms`

**Example Flow**:
```
Analytics Dashboard → Click "Rice" in Crop Distribution Chart
  ↓
Farms Page (/farms?crop=Rice&from=analytics)
  ↓ Shows:
  [← Back to Analytics Dashboard]
  Active Filters: [Crop: Rice] [X]
```

**Implementation**:
```typescript
// Chart navigation includes referrer
navigate(`/farms?crop=${crop}&from=analytics`);

// Farms page detects referrer
const fromAnalytics = searchParams.get("from") === "analytics";

// FilterBreadcrumb shows link conditionally
<FilterBreadcrumb showBackToAnalytics={fromAnalytics} />
```

---

## Future Enhancements

- [ ] Add filter history/saved filter sets
- [ ] Implement advanced analytics with multi-level drill-down
- [ ] Add export filtered results directly from breadcrumb
- [ ] Add "View in Analytics" link from individual farm detail pages

---

## Testing Checklist

- [x] Municipality bar click navigates to filtered Farms page
- [x] Crop pie slice click navigates to filtered Farms page
- [x] Yield trend point click navigates to date-filtered Farms page
- [x] URL parameters correctly initialize filter state
- [x] Browser back button returns to Analytics with filters cleared
- [x] Shareable URLs preserve filter state
- [x] Clear Filters button resets all filters and URL
- [ ] All three demo accounts can access Analytics and Farms pages
- [ ] Role-based dashboards display correctly after login

---

## Troubleshooting

### Charts not clickable
- **Solution**: Ensure dev server is running (`pnpm dev`)
- **Check**: Browser console for JavaScript errors

### Filters not applying
- **Solution**: Verify URL parameters match expected format
- **Check**: `client/src/pages/Farms.tsx` filter logic

### Login fails
- **Solution**: Use exact credentials: `farmer`/`demo123`, `officer`/`demo123`, or `manager`/`demo123`
- **Check**: `client/src/data/usersData.ts` for user definitions

---

## Support

For issues or questions, refer to:
- Main README: `/README.md`
- Analytics Dashboard Documentation: `/ANALYTICS_DASHBOARD.md`
- Todo List: `/todo.md`

---

**Last Updated**: November 18, 2024  
**Version**: 1.0.0  
**Author**: MAGSASA-CARD Development Team
