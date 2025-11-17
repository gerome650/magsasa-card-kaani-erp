# React Query DevTools Guide

## Overview

React Query DevTools is a powerful debugging tool integrated into the MAGSASA-CARD dashboard that provides real-time visibility into your application's query and mutation states, cache data, and performance metrics.

## Features

### 🔍 Query Inspection
- View all active queries with their keys and status
- Inspect query data, error states, and metadata
- Monitor query lifecycle (fetching, success, error, stale)
- Track query dependencies and refetch behavior

### 🔄 Mutation Monitoring
- See pending and completed mutations
- Track mutation status and results
- Debug mutation errors and retry attempts
- Monitor optimistic updates

### 💾 Cache Management
- Visualize cached data structure
- Inspect cache entries and their staleness
- Manually invalidate queries
- Force refetch queries
- Remove queries from cache

### ⚡ Performance Metrics
- Track query execution times
- Monitor cache hit/miss ratios
- Identify slow or problematic queries
- Analyze refetch patterns

## How to Use

### Opening DevTools

The DevTools panel appears in the **bottom-right corner** of your browser window (development mode only). Look for the React Query logo icon.

**Toggle DevTools:**
- Click the floating React Query icon to open/close the panel
- The panel starts closed by default (`initialIsOpen={false}`)

### DevTools Interface

#### 1. **Query Explorer** (Left Panel)
Lists all queries currently in the cache:
- 🟢 **Green**: Fresh data (within staleTime)
- 🟡 **Yellow**: Stale data (needs refetch)
- 🔴 **Red**: Error state
- ⚪ **Gray**: Inactive/unused queries

**Query Information:**
- Query key (e.g., `["farms", "list"]`)
- Observers count (how many components use this query)
- Last updated timestamp
- Data size

#### 2. **Query Details** (Right Panel)
Click any query to see detailed information:

**Data Tab:**
- View the actual cached data
- JSON tree view with expandable nodes
- Copy data to clipboard

**Query Info Tab:**
- Status: `idle`, `loading`, `success`, `error`
- Fetch status: `idle`, `fetching`, `paused`
- Data updated at (timestamp)
- Error (if any)
- Stale time remaining
- Cache time remaining

**Actions Tab:**
- **Refetch**: Manually trigger a refetch
- **Invalidate**: Mark query as stale (triggers refetch if observed)
- **Reset**: Clear error state
- **Remove**: Delete query from cache

#### 3. **Mutations Tab**
View all mutations (create, update, delete operations):
- Mutation key
- Status: `idle`, `loading`, `success`, `error`
- Variables (input data)
- Result data
- Error details

## Common Use Cases

### 1. Debugging Failed Queries

**Problem:** Farm list not loading

**Steps:**
1. Open DevTools
2. Find `["farms", "list"]` query
3. Check status (should be `error`)
4. Click query → View error details
5. Check network tab for API response
6. Fix backend issue or query parameters

### 2. Inspecting Cached Data

**Problem:** Stale data showing after update

**Steps:**
1. Open DevTools
2. Find the relevant query (e.g., `["farms", "detail", "1"]`)
3. Check "Data" tab to see cached values
4. Check "Last Updated" timestamp
5. Click "Invalidate" to force refetch
6. Verify new data appears

### 3. Testing Optimistic Updates

**Problem:** Optimistic update not working correctly

**Steps:**
1. Open DevTools before performing action
2. Watch "Mutations" tab
3. Perform action (e.g., add farm)
4. See mutation appear as `loading`
5. Check query cache updates immediately (optimistic)
6. Watch for mutation to complete (`success` or `error`)
7. Verify cache rollback on error

### 4. Monitoring Query Performance

**Problem:** Slow page load times

**Steps:**
1. Open DevTools
2. Navigate to slow page
3. Watch queries appear in real-time
4. Check "Fetch Status" for each query
5. Identify queries that stay in `fetching` state too long
6. Optimize slow queries or add loading skeletons

### 5. Cache Invalidation Testing

**Problem:** Data not refreshing after mutation

**Steps:**
1. Perform mutation (e.g., create farm)
2. Open DevTools
3. Check if related queries were invalidated
4. Look for queries with recent "Last Updated" timestamp
5. If not invalidated, check mutation's `onSuccess` callback
6. Add missing `queryClient.invalidateQueries()` call

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Click logo | Toggle DevTools panel |
| ESC | Close DevTools panel |
| Click query | View query details |
| Click mutation | View mutation details |

## Configuration

### Current Settings

```typescript
<ReactQueryDevtools 
  initialIsOpen={false}      // Starts closed
  position="bottom-right"    // Bottom-right corner
/>
```

### Available Options

**initialIsOpen**: `boolean`
- `true`: DevTools panel opens automatically on page load
- `false`: DevTools panel starts closed (default)

**position**: `"top-left" | "top-right" | "bottom-left" | "bottom-right"`
- Controls where the DevTools panel appears
- Default: `"bottom-right"`

**buttonPosition**: Same as position
- Controls where the toggle button appears
- Defaults to same as `position`

**panelPosition**: `"left" | "right" | "top" | "bottom"`
- Controls which side the panel slides out from

## Query Keys Reference

### Farms Module
- `["farms", "list"]` - All farms
- `["farms", "detail", farmId]` - Single farm details
- `["boundaries", farmId]` - Farm boundaries
- `["yields", farmId]` - Harvest records
- `["costs", farmId]` - Cost records

### Authentication
- `["auth", "me"]` - Current user

## Tips & Best Practices

### 1. **Use During Development**
- Keep DevTools open while building features
- Monitor query behavior in real-time
- Catch caching issues early

### 2. **Debug Optimistic Updates**
- Watch cache changes during mutations
- Verify rollback on errors
- Check temporary IDs are replaced

### 3. **Monitor Refetch Behavior**
- Identify unnecessary refetches
- Adjust `staleTime` if queries refetch too often
- Use `refetchOnWindowFocus: false` for stable data

### 4. **Inspect Error States**
- Check error messages and stack traces
- Verify retry logic is working
- Test error recovery flows

### 5. **Performance Optimization**
- Find slow queries
- Check if data is being cached properly
- Identify queries that could be batched

## Production Behavior

**Important:** React Query DevTools is automatically excluded from production builds. The component is tree-shaken out during the build process, so it adds **zero bytes** to your production bundle.

**Development Only:**
- DevTools only appear when `NODE_ENV === 'development'`
- No performance impact in production
- No security concerns (data not exposed)

## Troubleshooting

### DevTools Not Appearing

**Check:**
1. Running in development mode? (`pnpm run dev`)
2. DevTools imported correctly in `main.tsx`?
3. Inside `<QueryClientProvider>`?
4. Browser console for errors?

**Solution:**
```typescript
// Verify this structure in main.tsx
<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
</QueryClientProvider>
```

### Queries Not Showing

**Possible causes:**
- No queries have been executed yet
- Queries were garbage collected (no active observers)
- Query cache was cleared

**Solution:**
- Navigate to a page that uses queries
- Check component is using `trpc.*.useQuery()`
- Verify query is not disabled

### Data Not Updating

**Check:**
1. Query invalidation in mutation's `onSuccess`
2. Stale time configuration
3. Refetch on window focus setting

**Solution:**
```typescript
// In mutation
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["farms", "list"] });
}
```

## Advanced Features

### 1. **Query Filters**
Click the filter icon to filter queries by:
- Status (all, fresh, stale, fetching, error)
- Query key (search/filter)

### 2. **Sort Options**
Sort queries by:
- Query key (alphabetical)
- Last updated (most recent first)
- Observers count (most used first)

### 3. **Cache Size**
View total cache size and number of queries cached

### 4. **Export Cache**
Copy entire cache state to clipboard for debugging

## Integration with tRPC

The DevTools work seamlessly with tRPC queries and mutations:

**tRPC Query Keys:**
```typescript
// trpc.farms.list.useQuery() creates:
["farms", "list"]

// trpc.farms.detail.useQuery({ id: "1" }) creates:
["farms", "detail", { id: "1" }]
```

**Viewing tRPC Data:**
1. Open DevTools
2. Find query with tRPC key
3. Inspect data returned from tRPC procedure
4. Verify SuperJSON deserialization (Dates, Maps, Sets)

## Resources

- [React Query DevTools Docs](https://tanstack.com/query/latest/docs/react/devtools)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [tRPC with React Query](https://trpc.io/docs/client/react)

## Summary

React Query DevTools is an essential tool for debugging and optimizing your MAGSASA-CARD dashboard. Use it to:

✅ Inspect query and mutation states  
✅ Debug caching issues  
✅ Monitor performance  
✅ Test optimistic updates  
✅ Validate cache invalidation  
✅ Identify slow queries  

Keep DevTools open during development for the best debugging experience!
