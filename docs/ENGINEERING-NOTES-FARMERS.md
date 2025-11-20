# Farmers Feature - Engineering Notes

**Audience**: Engineers onboarding to the codebase  
**Purpose**: Technical deep dive into the Farmers feature implementation

---

## Overview

The Farmers feature provides a consistent, database-driven view of farmers across the MAGSASA-CARD Kaani ERP system. It replaces static mock data with real-time queries from the MySQL database.

---

## Farmer Definition

**A farmer is defined as**:
- A user with `role='user'` (not `'admin'`)
- Who owns at least one farm (via `farms.userId` foreign key)

This definition ensures:
- Admin users are never counted as farmers
- Users without farms are not counted as farmers
- Consistency across all views (Dashboard, Analytics, Farmers page)

**Important**: The demo data generator (`scripts/generate-demo-data.ts`) must create users with `role='user'` and then create farms for them to match this definition.

---

## Architecture

### Database Layer (`server/db.ts`)

#### `getFarmers(filters?)`

**Purpose**: Query all farmers with aggregated farm statistics.

**Implementation**:
1. **Main Query**: Joins `users` and `farms` tables
   - Filters: `users.role = 'user'`
   - Join: `INNER JOIN farms ON users.id = farms.userId` (ensures ≥1 farm)
   - Aggregates: `COUNT(DISTINCT farms.id)`, `SUM(farms.size)`, `GROUP_CONCAT(farms.barangay)`
   - Groups by: `users.id`

2. **Additional Queries**:
   - Fetches crops from all farms per user (aggregates JSON `crops` field)
   - Fetches harvest totals from `yields` table (sums quantities, converts tons→kg→MT)

3. **Filtering**:
   - Search: Filters by `users.name` or `users.email` (LIKE pattern)
   - Barangay: Applied in JavaScript after GROUP_CONCAT (checks if barangay string includes filter)

**Returns**: Array of farmer objects with:
- User fields (id, openId, name, email, etc.)
- Aggregated stats (farmCount, totalArea, totalHarvest)
- Crops array (deduplicated across all farms)
- Location info (barangays, municipality)

#### `getFarmerCount()`

**Purpose**: Get total count of farmers (for Dashboard/Analytics).

**Implementation**:
- Same logic as `getFarmers()` but returns only `COUNT(DISTINCT users.id)`
- Uses same `role='user'` filter and `INNER JOIN` with farms

**Performance**: Efficient single-query count (no aggregation of crops/harvest).

---

### API Layer (`server/routers.ts`)

#### `farmers.list`

**tRPC Procedure**: `protectedProcedure`
- **Input**: Optional `{ search?: string, barangay?: string }`
- **Output**: Array of farmer objects (from `getFarmers()`)
- **Logging**: Emits `[Farmers] list called` and `[Farmers] list completed` with duration and result count
- **Error Handling**: Catches and logs errors, re-throws for tRPC error handling

#### `farmers.count`

**tRPC Procedure**: `protectedProcedure`
- **Input**: None
- **Output**: Number (total farmer count)
- **Logging**: Emits `[Farmers] count completed` with duration and count
- **Error Handling**: Catches and logs errors, re-throws for tRPC error handling

**Security**: Both procedures use `protectedProcedure`, requiring authenticated user session.

---

### Frontend Layer

#### `client/src/pages/Farmers.tsx`

**Data Flow**:
1. Component mounts → `useEffect` triggers `trpcClient.farmers.list.query()`
2. Maps DB response to `Farmer` interface (adds computed fields like `location`, `province`)
3. Applies client-side filters (landArea, cropType, etc.) via `applyFarmerFilters()`
4. Paginates results (25 per page)
5. Renders farmer cards with stats

**Key Features**:
- Loading state with spinner
- Error handling (shows empty state on error)
- Pagination with boundary checks
- Search and barangay filtering (server-side)
- Advanced filters (client-side)

**Defensive Coding**:
- Null checks for all farmer fields
- Safe date parsing with fallbacks
- Number validation for totals
- Empty array defaults for crops

#### `client/src/components/ManagerDashboard.tsx`

**Data Flow**:
1. Uses `trpc.farmers.count.useQuery()` for total farmer count
2. Uses `trpc.farmers.list.useQuery()` for aggregated stats (total farms, harvest)
3. Calculates stats from API data (not static data)

**Consistency**: Now matches Farmers page count exactly.

---

## Performance Considerations

### Query Performance

**Indexes Required**:
- `users.role` - Should be indexed (enum field, but index helps)
- `farms.userId` - Foreign key, should be auto-indexed
- `users.id` - Primary key, auto-indexed
- `farms.id` - Primary key, auto-indexed

**Query Complexity**:
- Main query: O(n) where n = number of farmers with farms
- Crops/harvest queries: O(m) where m = number of farms for those farmers
- Overall: Acceptable for ~2,500 farmers, but may need pagination at DB level for 10k+

**Optimization Opportunities** (Future):
- Add pagination at DB level (LIMIT/OFFSET)
- Cache farmer count (refresh every 5 minutes)
- Consider materialized view for aggregated stats

---

## Design Decisions

### Why INNER JOIN instead of EXISTS?

**Decision**: Use `INNER JOIN` with `GROUP BY` to get aggregated stats in one query.

**Alternative Considered**: `EXISTS` subquery would be simpler but requires separate queries for stats.

**Rationale**: Single query is more efficient for the common case (showing farmer list with stats).

### Why Client-Side Pagination?

**Decision**: Paginate in React after fetching all farmers.

**Alternative Considered**: Server-side pagination (LIMIT/OFFSET).

**Rationale**: 
- Simpler implementation
- Works well for ~2,500 farmers
- Client-side filters (landArea, cropType) require all data anyway

**Future**: If farmer count grows >10k, implement server-side pagination.

### Why GROUP_CONCAT for Barangays?

**Decision**: Aggregate all barangays per farmer into comma-separated string.

**Alternative Considered**: Separate query or JSON array.

**Rationale**: Single query, simple filtering in JavaScript.

**Limitation**: Barangay filter applied in JS (not SQL), but acceptable for current scale.

---

## Extension Points

### Adding New Farmer Fields

1. **Database**: Add column to `users` or `farms` table
2. **DB Function**: Update `getFarmers()` to select new field
3. **tRPC Router**: Return type automatically includes new field (TypeScript inference)
4. **Frontend**: Update `Farmer` interface and mapping logic

### Adding New Filters

1. **DB Function**: Add filter condition to `getFarmers()` filters parameter
2. **tRPC Router**: Add to Zod input schema
3. **Frontend**: Add filter UI and pass to tRPC query

### Future: Farmer Types / Cooperative Accounts

**Current**: All farmers are individual users with farms.

**Future Extension**: 
- Add `farmerType` enum to `users` table ('individual', 'cooperative', 'organization')
- Update `getFarmers()` to filter by type if needed
- Update definition: "A farmer is a user with role='user' who owns ≥1 farm, optionally filtered by type"

---

## Known Limitations

1. **No Server-Side Pagination**: All farmers loaded into memory (acceptable for ~2,500, may need change at 10k+)
2. **Barangay Filter in JS**: Not optimized at SQL level (acceptable for current scale)
3. **No Caching**: Farmer count recalculated on every request (acceptable for current scale)
4. **Static Province/Municipality**: Hardcoded as "Laguna" / "Calauan" (matches demo data)

---

## Troubleshooting

### "Farmer count is 0"

**Check**:
1. Are there users with `role='user'` in the database?
2. Do those users have farms? (`SELECT COUNT(*) FROM farms WHERE userId IN (SELECT id FROM users WHERE role='user')`)
3. Check server logs for `[Farmers]` errors

### "Farmer count doesn't match Dashboard"

**Check**:
1. Both should use `trpc.farmers.count.useQuery()` (verify ManagerDashboard.tsx)
2. Check if Dashboard is using stale cache (refresh page)
3. Check server logs for query timing

### "Performance is slow with many farmers"

**Solutions**:
1. Add indexes (see Performance Considerations)
2. Implement server-side pagination
3. Add caching for `getFarmerCount()`

---

## Related Files

- `server/db.ts` - Database functions
- `server/routers.ts` - tRPC API endpoints
- `client/src/pages/Farmers.tsx` - Farmers page component
- `client/src/components/ManagerDashboard.tsx` - Dashboard component
- `drizzle/schema.ts` - Database schema definitions
- `scripts/generate-demo-data.ts` - Demo data generator

---

## Testing

**Manual Testing**:
1. Run `pnpm generate:demo` to seed data
2. Start dev server: `pnpm dev`
3. Navigate to `/farmers` - should show ~2,500 farmers
4. Navigate to `/` (Dashboard) - should show same count
5. Test search and barangay filters
6. Test pagination

**Database Verification**:
```sql
-- Should match Farmers page count
SELECT COUNT(DISTINCT farms.userId) 
FROM farms 
JOIN users ON users.id = farms.userId 
WHERE users.role='user';
```

---

**Last Updated**: Pre-Production QA  
**Version**: 1.0

