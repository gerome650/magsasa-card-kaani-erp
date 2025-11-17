# Analytics Dashboard Documentation

## Overview

The Analytics Dashboard provides interactive data visualizations for farm management insights. Built with Chart.js and React, it displays key metrics and trends across farms, municipalities, crops, and yields.

---

## Features

### 1. Summary Statistics

**Location**: Top of Analytics page

**Metrics**:
- **Total Farms**: Count of all farms with active percentage
- **Total Area**: Sum of farm sizes in hectares with average per farm
- **Average Yield**: Mean yield across all farms in t/ha
- **Activity Rate**: Percentage of active farms

**Implementation**:
```typescript
const totalFarms = farms.length;
const totalArea = farms.reduce((sum, farm) => sum + farm.size, 0);
const activeFarms = farms.filter(f => f.status === "active").length;
const avgYield = farms.length > 0 
  ? farms.reduce((sum, farm) => sum + farm.averageYield, 0) / farms.length 
  : 0;
```

---

### 2. Farms by Municipality Chart

**Type**: Horizontal Bar Chart

**Purpose**: Show distribution of farms across municipalities

**Component**: `MunicipalityBarChart.tsx`

**Data Aggregation**:
```typescript
const municipalityCounts: Record<string, number> = {};

farms.forEach(farm => {
  const municipality = farm.municipality || 'Unknown';
  municipalityCounts[municipality] = (municipalityCounts[municipality] || 0) + 1;
});

// Sort by count descending
const sorted = Object.entries(municipalityCounts)
  .sort(([, a], [, b]) => b - a);
```

**Chart Configuration**:
- **Orientation**: Horizontal (indexAxis: 'y')
- **Color**: Blue-500 (rgba(59, 130, 246, 0.8))
- **Height**: 300px (fixed)
- **Responsive**: Yes (maintainAspectRatio: false)
- **Tooltips**: Custom callback showing "X farm(s)"
- **Grid**: X-axis only

**Usage**:
```tsx
<MunicipalityBarChart farms={farms} />
```

---

### 3. Crop Distribution Chart

**Type**: Pie Chart

**Purpose**: Visualize crop diversity across all farms

**Component**: `CropDistributionPieChart.tsx`

**Data Aggregation**:
```typescript
const cropCounts: Record<string, number> = {};

farms.forEach(farm => {
  farm.crops.forEach(crop => {
    cropCounts[crop] = (cropCounts[crop] || 0) + 1;
  });
});

// Sort by count descending
const sorted = Object.entries(cropCounts)
  .sort(([, a], [, b]) => b - a);
```

**Chart Configuration**:
- **Colors**: 8 distinct colors (blue, green, orange, purple, pink, amber, teal, red)
- **Legend**: Right side with 15px padding
- **Height**: 300px (fixed)
- **Responsive**: Yes (maintainAspectRatio: false)
- **Tooltips**: Custom callback showing "X farm(s) (Y%)"
- **Percentage Calculation**: `(value / total) * 100`

**Color Palette**:
```typescript
const colors = [
  'rgba(59, 130, 246, 0.8)',   // blue
  'rgba(16, 185, 129, 0.8)',   // green
  'rgba(251, 146, 60, 0.8)',   // orange
  'rgba(139, 92, 246, 0.8)',   // purple
  'rgba(236, 72, 153, 0.8)',   // pink
  'rgba(245, 158, 11, 0.8)',   // amber
  'rgba(20, 184, 166, 0.8)',   // teal
  'rgba(239, 68, 68, 0.8)',    // red
];
```

**Usage**:
```tsx
<CropDistributionPieChart farms={farms} />
```

---

### 4. Yield Trends Chart

**Type**: Line Chart with Filled Area

**Purpose**: Track average yield trends over time

**Component**: `YieldTrendsLineChart.tsx`

**Data Aggregation**:
```typescript
const yieldByMonth: Record<string, { total: number; count: number }> = {};

farms.forEach(farm => {
  if (farm.averageYield > 0) {
    const monthKey = format(startOfMonth(farm.registrationDate), 'yyyy-MM');
    if (!yieldByMonth[monthKey]) {
      yieldByMonth[monthKey] = { total: 0, count: 0 };
    }
    yieldByMonth[monthKey].total += farm.averageYield;
    yieldByMonth[monthKey].count += 1;
  }
});

// Calculate average for each month
const data = sorted.map(([, { total, count }]) => (total / count).toFixed(2));
```

**Chart Configuration**:
- **Line Color**: Green-500 (rgba(16, 185, 129, 1))
- **Fill**: Yes with 10% opacity background
- **Tension**: 0.4 (smooth curves)
- **Point Radius**: 4px (6px on hover)
- **Height**: 300px (fixed)
- **Responsive**: Yes (maintainAspectRatio: false)
- **Tooltips**: Custom callback showing "X t/ha"
- **Y-Axis**: Begins at zero with "Yield (t/ha)" label
- **X-Axis**: Formatted as "MMM yyyy" (e.g., "Jan 2024")

**Date Formatting**:
```typescript
import { format, startOfMonth, parseISO } from 'date-fns';

const labels = sorted.map(([month]) => 
  format(parseISO(month + '-01'), 'MMM yyyy')
);
```

**Usage**:
```tsx
<YieldTrendsLineChart farms={farms} />
```

---

## Page Structure

### Analytics.tsx

**Route**: `/analytics`

**Layout**:
1. **Header**: Title and description
2. **Summary Statistics**: 4-column grid (1 col mobile, 4 cols desktop)
3. **Charts Grid**: 2-column grid (1 col mobile, 2 cols desktop)
   - Farms by Municipality (left)
   - Crop Distribution (right)
4. **Yield Trends**: Full-width chart

**Loading State**:
```tsx
if (isLoading) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-2"></div>
              <div className="h-3 bg-muted rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

**Empty State**:
```tsx
if (farms.length === 0) {
  return (
    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
      No data available
    </div>
  );
}
```

---

## Navigation

**Location**: Sidebar (Layout.tsx)

**Icon**: BarChart3 (lucide-react)

**Roles**: Manager, Field Officer

**Link**:
```tsx
{ 
  name: 'Analytics', 
  href: '/analytics', 
  icon: BarChart3, 
  roles: ['manager', 'field_officer'] 
}
```

---

## Chart.js Configuration

### Registered Components

**MunicipalityBarChart**:
```typescript
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);
```

**CropDistributionPieChart**:
```typescript
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);
```

**YieldTrendsLineChart**:
```typescript
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);
```

---

## Dependencies

**Installed Packages**:
- `chart.js@4.5.1`: Core charting library
- `react-chartjs-2@5.3.1`: React wrapper for Chart.js
- `date-fns@3.x`: Date formatting and manipulation

**Installation**:
```bash
pnpm add chart.js react-chartjs-2
```

---

## Responsive Design

### Breakpoints

**Summary Statistics**:
- Mobile: 1 column (`grid-cols-1`)
- Desktop: 4 columns (`md:grid-cols-4`)

**Charts Grid**:
- Mobile: 1 column (`grid-cols-1`)
- Desktop: 2 columns (`lg:grid-cols-2`)

**Chart Height**:
- Fixed: 300px (`h-[300px]`)
- Maintains aspect ratio: Disabled (`maintainAspectRatio: false`)

---

## Future Enhancements

### 1. Click Interactions
- Click municipality bar to filter farms by that municipality
- Click crop slice to filter farms growing that crop
- Click yield data point to view farms from that month

### 2. Date Range Selector
- Add date range picker above charts
- Filter all charts by selected date range
- Preset ranges: Last 7 days, Last 30 days, This month, This year

### 3. Export Functionality
- Export charts as PNG images
- Export data as CSV
- Print-friendly view

### 4. Multi-Crop Yield Trends
- Add multiple lines to yield chart (one per crop)
- Toggle crop visibility in legend
- Compare yields across different crops

### 5. Advanced Filters
- Filter by municipality
- Filter by crop type
- Filter by farm status (active/inactive/fallow)
- Filter by yield range

### 6. Drill-Down Views
- Click chart elements to navigate to detailed views
- Show farm list filtered by chart selection
- Breadcrumb navigation back to dashboard

### 7. Comparison Mode
- Compare current period vs previous period
- Show percentage changes
- Trend indicators (up/down arrows)

### 8. Real-Time Updates
- Auto-refresh charts when data changes
- WebSocket integration for live updates
- Animation transitions for data changes

---

## Troubleshooting

### Charts Not Rendering

**Symptom**: Blank space where charts should appear

**Possible Causes**:
1. Chart.js components not registered
2. Data format mismatch
3. Missing dependencies

**Solution**:
- Verify `ChartJS.register()` calls in each component
- Check console for errors
- Ensure `chart.js` and `react-chartjs-2` are installed

### Empty State Showing with Data

**Symptom**: "No data available" message despite having farms

**Possible Causes**:
1. Data transformation error
2. Filter excluding all farms
3. Invalid data format

**Solution**:
- Check `farms` array in console
- Verify data transformation logic
- Ensure `crops` is an array, not a string

### Tooltips Not Showing

**Symptom**: Hovering over chart elements doesn't show tooltips

**Possible Causes**:
1. Tooltip plugin not registered
2. Custom callback error
3. Z-index issue

**Solution**:
- Verify `Tooltip` is in `ChartJS.register()` call
- Check console for callback errors
- Inspect element z-index in DevTools

### Chart Overflowing Container

**Symptom**: Chart extends beyond card boundaries

**Possible Causes**:
1. `maintainAspectRatio` set to true
2. Missing height constraint
3. Responsive settings incorrect

**Solution**:
- Set `maintainAspectRatio: false` in options
- Add `h-[300px]` to container div
- Verify `responsive: true` in options

---

## Best Practices

### 1. Data Aggregation
- Always sort aggregated data (descending by count)
- Handle missing values gracefully (use "Unknown" or filter out)
- Validate data types before aggregation

### 2. Chart Configuration
- Use consistent colors across charts
- Disable aspect ratio for fixed heights
- Enable responsive mode for mobile
- Add meaningful tooltips with units

### 3. Performance
- Memoize chart data with `useMemo`
- Avoid re-rendering charts on every state change
- Limit data points for large datasets (aggregate by week/month)

### 4. Accessibility
- Add ARIA labels to charts
- Provide text alternatives for screen readers
- Use sufficient color contrast
- Support keyboard navigation

### 5. User Experience
- Show loading states during data fetch
- Display empty states with helpful messages
- Add legends for clarity
- Use intuitive color schemes

---

## API Reference

### MunicipalityBarChart

**Props**:
```typescript
interface MunicipalityBarChartProps {
  farms: Farm[];
}

interface Farm {
  municipality: string;
}
```

**Example**:
```tsx
<MunicipalityBarChart 
  farms={[
    { municipality: "San Jose" },
    { municipality: "San Pablo" },
    { municipality: "San Jose" },
  ]} 
/>
```

### CropDistributionPieChart

**Props**:
```typescript
interface CropDistributionPieChartProps {
  farms: Farm[];
}

interface Farm {
  crops: string[];
}
```

**Example**:
```tsx
<CropDistributionPieChart 
  farms={[
    { crops: ["Rice", "Corn"] },
    { crops: ["Rice"] },
    { crops: ["Vegetables"] },
  ]} 
/>
```

### YieldTrendsLineChart

**Props**:
```typescript
interface YieldTrendsLineChartProps {
  farms: Farm[];
}

interface Farm {
  averageYield: number;
  registrationDate: Date;
}
```

**Example**:
```tsx
<YieldTrendsLineChart 
  farms={[
    { averageYield: 5.2, registrationDate: new Date('2024-01-15') },
    { averageYield: 4.8, registrationDate: new Date('2024-02-20') },
  ]} 
/>
```

---

## Conclusion

The Analytics Dashboard provides powerful data visualization capabilities for farm management. With Chart.js integration, responsive design, and interactive charts, users can quickly understand trends and make data-driven decisions. Future enhancements will add filtering, drill-down views, and real-time updates for even more insights.
