# Search and Filters Documentation

## Overview

The MAGSASA-CARD dashboard includes comprehensive search and filtering capabilities for farm management. Users can search for farms by name or farmer, filter by date range, and combine multiple filters for precise results.

---

## Features

### 1. Full-Text Search

**Location**: Farms page header

**Functionality**:
- Search across farm names and farmer names simultaneously
- Case-insensitive matching
- Debounced input (300ms delay) to reduce API calls
- Real-time search result highlighting
- Clear button to reset search

**Implementation**:
```typescript
// Debounced search state
const [searchQuery, setSearchQuery] = useState("");
const debouncedSearch = useDebounce(searchQuery, 300);

// tRPC query with search parameter
const { data: dbFarms } = trpc.farms.list.useQuery({
  search: debouncedSearch || undefined,
});
```

**Backend Query**:
```typescript
// SQL LIKE search with OR condition
if (filters?.search && filters.search.trim() !== '') {
  const searchTerm = `%${filters.search}%`;
  conditions.push(
    or(
      like(farms.name, searchTerm),
      like(farms.farmerName, searchTerm)
    )!
  );
}
```

---

### 2. Date Range Picker

**Location**: Farms page filters section

**Functionality**:
- Select start and end dates for registration date filtering
- Preset ranges: Today, Last 7 days, Last 30 days, This month
- Dual calendar view for easy range selection
- Clear button to reset date filter
- Formatted date display (MMM DD, YYYY)

**Component**: `DateRangePicker`

**Props**:
```typescript
interface DateRangePickerProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  className?: string;
}
```

**Usage**:
```typescript
const [dateRange, setDateRange] = useState<DateRange | undefined>();

<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
/>
```

**Backend Query**:
```typescript
// Date range filtering with BETWEEN
if (filters?.startDate) {
  conditions.push(gte(farms.registrationDate, filters.startDate));
}
if (filters?.endDate) {
  conditions.push(lte(farms.registrationDate, filters.endDate));
}
```

---

### 3. Filter Chips

**Location**: Below filters section, above farm grid

**Functionality**:
- Display all active filters as removable chips
- Individual remove buttons for each filter
- "Clear All" button to reset all filters
- Formatted display for dates and search queries

**Component**: `FilterChips`

**Props**:
```typescript
interface FilterChipsProps {
  searchQuery?: string;
  dateRange?: DateRange;
  selectedBarangay?: string;
  selectedCrop?: string;
  selectedStatus?: string;
  onClearSearch?: () => void;
  onClearDateRange?: () => void;
  onClearBarangay?: () => void;
  onClearCrop?: () => void;
  onClearStatus?: () => void;
  onClearAll?: () => void;
}
```

**Example**:
```
Active filters: Search: "rice" | Date: Jan 01, 2024 - Jan 31, 2024 | Status: active | [Clear All]
```

---

### 4. Search Result Highlighting

**Location**: Farm cards (farm name and farmer name)

**Functionality**:
- Highlight matching text in yellow background
- Bold font weight for emphasis
- Case-insensitive matching
- Multiple matches in same text
- Graceful handling of special regex characters

**Component**: `HighlightText`

**Props**:
```typescript
interface HighlightTextProps {
  text: string;
  highlight?: string;
  className?: string;
}
```

**Implementation**:
```typescript
// Escape special regex characters
const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Create case-insensitive regex
const regex = new RegExp(`(${escapeRegex(highlight)})`, "gi");

// Split and highlight
const parts = text.split(regex);
parts.map((part, index) => {
  const isHighlight = part.toLowerCase() === highlight.toLowerCase();
  return isHighlight ? (
    <mark className="bg-yellow-200 text-yellow-900 font-semibold px-0.5 rounded">
      {part}
    </mark>
  ) : (
    <span>{part}</span>
  );
});
```

---

### 5. Debounced Search

**Location**: `client/src/hooks/useDebounce.ts`

**Functionality**:
- Delays API calls until user stops typing
- Reduces server load and improves performance
- Configurable delay (default: 300ms)
- Automatic cleanup on unmount

**Hook**: `useDebounce`

**Usage**:
```typescript
const [searchQuery, setSearchQuery] = useState("");
const debouncedSearch = useDebounce(searchQuery, 300);

// debouncedSearch updates 300ms after user stops typing
```

**Implementation**:
```typescript
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

---

## Combined Filtering

All filters work together using AND logic:

```typescript
const { data: dbFarms } = trpc.farms.list.useQuery({
  search: debouncedSearch || undefined,
  startDate: dateRange?.from ? dateRange.from.toISOString().split('T')[0] : undefined,
  endDate: dateRange?.to ? dateRange.to.toISOString().split('T')[0] : undefined,
});

// Client-side filters (barangay, crop, status) applied after database query
filteredFarms = farms.filter((farm) => {
  const matchesSearch = /* handled by backend */;
  const matchesBarangay = selectedBarangay === "all" || farm.location.barangay === selectedBarangay;
  const matchesCrop = selectedCrop === "all" || farm.crops.includes(selectedCrop);
  const matchesStatus = selectedStatus === "all" || farm.status === selectedStatus;
  
  return matchesSearch && matchesBarangay && matchesCrop && matchesStatus;
});
```

---

## User Workflow

### Basic Search

1. User types in search input: "Dela Cruz"
2. After 300ms delay, debounced value updates
3. tRPC query executes with search parameter
4. Backend searches farm names and farmer names
5. Results return with matching farms
6. Farm cards display with "Dela Cruz" highlighted in yellow

### Date Range Filtering

1. User clicks date range picker button
2. Preset sidebar shows quick options
3. User clicks "Last 30 days" or selects custom range
4. Date range updates in state
5. tRPC query executes with startDate and endDate
6. Backend filters farms by registration date
7. Filter chip displays: "Date: Jan 01, 2024 - Jan 31, 2024"

### Combined Filtering

1. User searches for "rice"
2. User selects date range "Last 30 days"
3. User selects status "active"
4. User selects barangay "San Jose"
5. All filters combine with AND logic
6. Filter chips show all active filters
7. User can remove individual filters or click "Clear All"

---

## Empty States

### No Farms

```
🚜 No farms registered yet
Get started by adding your first farm to the system
[Add Farm]
```

### No Search Results

```
🔍 No farms found
Try adjusting your search or filters
[Clear Filters]
```

---

## Performance Optimizations

### 1. Debounced Search
- Reduces API calls from every keystroke to once per 300ms pause
- Example: Typing "Dela Cruz" = 1 API call instead of 9

### 2. Server-Side Search
- Database LIKE queries more efficient than client-side filtering
- Indexed columns (future) will further improve performance

### 3. Optimistic Updates
- Search results update immediately on input change
- Loading skeleton shows during API call
- Smooth user experience without blocking

---

## Future Enhancements

### 1. URL Query Parameters
- Persist filters in URL for shareable links
- Example: `/farms?search=rice&status=active&from=2024-01-01`

### 2. Saved Filters
- Allow users to save common filter combinations
- Quick access to frequently used filters
- Example: "Active Rice Farms in San Jose"

### 3. Advanced Search
- Search by multiple fields simultaneously
- Operators: AND, OR, NOT
- Example: "rice OR corn AND active"

### 4. Search History
- Show recent searches in dropdown
- Quick re-apply of previous searches
- Clear history option

### 5. Database Indexes
- Add indexes to `name` and `farmerName` columns
- Improve LIKE query performance
- Faster search results for large datasets

### 6. Fuzzy Search
- Tolerate typos and misspellings
- Example: "Dela Crus" matches "Dela Cruz"
- Levenshtein distance algorithm

### 7. Search Suggestions
- Auto-complete farm names and farmer names
- Dropdown with matching suggestions
- Keyboard navigation (arrow keys)

### 8. Export Filtered Results
- Export only filtered farms to CSV
- Include search query in filename
- Example: `farms_search_rice_2024-01-15.csv`

---

## Troubleshooting

### Search Not Working

**Symptom**: Typing in search input doesn't filter farms

**Possible Causes**:
1. Debounce delay - wait 300ms after typing
2. Network error - check browser console
3. tRPC query error - check server logs

**Solution**:
- Wait for debounce delay
- Check network tab for failed requests
- Verify database connection

### Highlighting Not Showing

**Symptom**: Search results don't highlight matching text

**Possible Causes**:
1. `searchQuery` not passed to `HighlightText`
2. Special regex characters breaking regex
3. Case sensitivity mismatch

**Solution**:
- Verify `highlight={searchQuery}` prop
- Check `escapeRegex` function
- Ensure case-insensitive matching (`gi` flags)

### Date Range Not Filtering

**Symptom**: Selecting date range doesn't filter farms

**Possible Causes**:
1. Date format mismatch (ISO 8601 required)
2. Timezone issues
3. Backend query error

**Solution**:
- Verify date format: `YYYY-MM-DD`
- Use `.toISOString().split('T')[0]` for formatting
- Check backend logs for SQL errors

### Filter Chips Not Clearing

**Symptom**: Clicking X on filter chip doesn't remove filter

**Possible Causes**:
1. `onClear` callback not wired up
2. State not updating
3. React re-render issue

**Solution**:
- Verify `onClearSearch={() => setSearchQuery("")}` callback
- Check state updates in React DevTools
- Force re-render with key prop

---

## API Reference

### tRPC Query: `farms.list`

**Input**:
```typescript
{
  search?: string;        // Search term for farm name or farmer name
  startDate?: string;     // ISO 8601 date (YYYY-MM-DD)
  endDate?: string;       // ISO 8601 date (YYYY-MM-DD)
}
```

**Output**:
```typescript
Array<{
  id: number;
  name: string;
  farmerName: string;
  barangay: string;
  municipality: string;
  registrationDate: string;
  // ... other farm fields
}>
```

**Example**:
```typescript
const { data: farms } = trpc.farms.list.useQuery({
  search: "rice",
  startDate: "2024-01-01",
  endDate: "2024-01-31",
});
```

---

## Best Practices

### 1. Always Debounce Search
- Never query on every keystroke
- Use `useDebounce` hook with 300ms delay
- Improves performance and user experience

### 2. Validate Date Ranges
- Ensure `from` <= `to`
- Handle missing dates gracefully
- Use ISO 8601 format for consistency

### 3. Escape Regex Characters
- Always escape user input before regex
- Prevents regex injection attacks
- Use `escapeRegex` helper function

### 4. Provide Clear Feedback
- Show loading states during search
- Display empty states with helpful messages
- Highlight matching text for clarity

### 5. Allow Easy Filter Removal
- Individual remove buttons on each chip
- "Clear All" button for bulk removal
- Clear search button in input field

---

## Conclusion

The search and filter system provides powerful, user-friendly farm discovery capabilities. With debounced search, date range filtering, and real-time highlighting, users can quickly find the farms they need. Future enhancements will add saved filters, URL persistence, and advanced search operators for even more flexibility.
