# 🗄️ Day 1: Database Integration - Detailed Implementation Guide

**Total Time:** 6-7 hours  
**Goal:** Connect frontend to backend API and enable full data persistence  
**Critical Path:** This is a BLOCKER - nothing can be published without this

---

## **Pre-Day 1: Fix Syntax Error** (5 minutes)

### **Issue:** Missing semicolon in FarmList.tsx line 365

**Location:** `client/src/pages/FarmList.tsx`

**Quick Fix:**
```bash
# Find the error location
grep -n "365" client/src/pages/FarmList.tsx
```

**Common causes:**
- Missing semicolon after statement
- Unclosed JSX tag
- Missing closing brace in map function

**Action:** Fix the syntax error before proceeding with Day 1 tasks.

---

## **Morning Session (3-4 hours): Setup & Farm Data Loading**

### **Task 1.1: Setup tRPC Client Integration** (1 hour)

#### **Step 1.1.1: Verify tRPC Client Configuration**

**File:** `client/src/lib/trpc.ts`

**Expected content:**
```typescript
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../server/routers';

export const trpc = createTRPCReact<AppRouter>();

export function getTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: '/api/trpc',
        // Add authentication headers
        headers() {
          return {
            authorization: localStorage.getItem('auth_token') || '',
          };
        },
      }),
    ],
  });
}
```

**Checklist:**
- [ ] File exists at correct location
- [ ] AppRouter type imported correctly
- [ ] httpBatchLink configured with `/api/trpc` endpoint
- [ ] Headers function includes authorization token

---

#### **Step 1.1.2: Verify tRPC Provider Setup**

**File:** `client/src/main.tsx`

**Expected content:**
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, getTRPCClient } from './lib/trpc';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const trpcClient = getTRPCClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>
  </React.StrictMode>
);
```

**Checklist:**
- [ ] QueryClient created with proper defaults
- [ ] tRPC Provider wraps QueryClientProvider
- [ ] trpcClient passed to Provider
- [ ] No console errors on app load

---

#### **Step 1.1.3: Test API Connection**

**Create test file:** `client/src/test-trpc.tsx` (temporary)

```typescript
import { trpc } from './lib/trpc';

export function TestTRPC() {
  const { data, isLoading, error } = trpc.farms.list.useQuery();

  if (isLoading) return <div>Loading farms...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h2>tRPC Connection Test</h2>
      <p>Farms loaded: {data?.length || 0}</p>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
```

**Add to App.tsx temporarily:**
```typescript
import { TestTRPC } from './test-trpc';

// Add inside Router component
<Route path="/test-trpc" component={TestTRPC} />
```

**Test steps:**
1. [ ] Navigate to `/test-trpc`
2. [ ] Verify "Loading farms..." appears briefly
3. [ ] Verify farms data displays (even if empty array)
4. [ ] Check browser console for errors
5. [ ] Check Network tab for `/api/trpc` requests

**Expected result:** Should see farms array (may be empty if no data in DB yet)

**If error occurs:**
- Check server is running: `pnpm dev`
- Check `/api/trpc` endpoint responds: `curl http://localhost:3000/api/trpc`
- Check server logs for errors

**Cleanup:**
- [ ] Remove test-trpc.tsx file
- [ ] Remove test route from App.tsx

---

### **Task 1.2: Farm Data Loading** (2-3 hours)

#### **Step 1.2.1: Update FarmDetail to Use tRPC Query**

**File:** `client/src/pages/FarmDetail.tsx`

**Current code (around line 38):**
```typescript
// OLD - Remove this
const farm = getFarmById(parseInt(id));
if (!farm) {
  return <div>Farm not found</div>;
}
```

**New code:**
```typescript
// NEW - Replace with this
const farmId = parseInt(id);
const { 
  data: farm, 
  isLoading: isFarmLoading, 
  error: farmError,
  refetch: refetchFarm 
} = trpc.farms.getById.useQuery({ id: farmId });

// Loading state
if (isFarmLoading) {
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-lg">Loading farm data...</span>
      </div>
    </div>
  );
}

// Error state
if (farmError || !farm) {
  return (
    <div className="container mx-auto py-8">
      <Card className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            {farmError ? 'Error Loading Farm' : 'Farm Not Found'}
          </h2>
          <p className="text-gray-600 mb-4">
            {farmError?.message || 'The requested farm could not be found.'}
          </p>
          <Button onClick={() => refetchFarm()}>
            Try Again
          </Button>
        </div>
      </Card>
    </div>
  );
}
```

**Checklist:**
- [ ] Import `trpc` from `@/lib/trpc`
- [ ] Replace `getFarmById` with `trpc.farms.getById.useQuery`
- [ ] Add loading state with spinner
- [ ] Add error state with retry button
- [ ] Test loading state (throttle network in DevTools)
- [ ] Test error state (disconnect network)
- [ ] Verify farm data displays correctly

---

#### **Step 1.2.2: Update FarmList to Use tRPC Query**

**File:** `client/src/pages/FarmList.tsx`

**Current code (around line 20):**
```typescript
// OLD - Remove this
const [farms] = useState(farmsData);
```

**New code:**
```typescript
// NEW - Replace with this
const { 
  data: farmsData, 
  isLoading: isFarmsLoading, 
  error: farmsError 
} = trpc.farms.list.useQuery();

const farms = farmsData || [];
```

**Update the main return to handle loading:**
```typescript
// Add before the main content
if (isFarmsLoading) {
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-lg">Loading farms...</span>
      </div>
    </div>
  );
}

if (farmsError) {
  return (
    <div className="container mx-auto py-8">
      <Card className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Farms</h2>
          <p className="text-gray-600">{farmsError.message}</p>
        </div>
      </Card>
    </div>
  );
}
```

**Checklist:**
- [ ] Import `trpc` from `@/lib/trpc`
- [ ] Replace useState with `trpc.farms.list.useQuery`
- [ ] Add loading state
- [ ] Add error state
- [ ] Verify farm list displays correctly
- [ ] Test with empty database (should show "No farms found")

---

## **Afternoon Session (3 hours): Boundary, Yield, and Cost Data**

### **Task 1.3: Boundary Data Integration** (1.5 hours)

#### **Step 1.3.1: Load Boundaries from Database**

**File:** `client/src/pages/FarmDetail.tsx`

**Find the boundary state (around line 60):**
```typescript
// OLD - Keep this state for now, we'll sync it with DB
const [drawnBoundaries, setDrawnBoundaries] = useState<google.maps.Polygon[]>([]);
```

**Add tRPC query for boundaries:**
```typescript
// NEW - Add this after farm query
const { 
  data: savedBoundaries, 
  isLoading: isBoundariesLoading,
  refetch: refetchBoundaries 
} = trpc.boundaries.getByFarmId.useQuery(
  { farmId: farmId },
  { enabled: !!farm } // Only fetch if farm exists
);
```

**Add useEffect to load boundaries onto map:**
```typescript
useEffect(() => {
  if (!mapInstance || !savedBoundaries || savedBoundaries.length === 0) return;

  // Clear existing polygons
  drawnBoundaries.forEach(polygon => polygon.setMap(null));

  // Load saved boundaries from database
  const loadedPolygons: google.maps.Polygon[] = [];
  const loadedAreas: number[] = [];

  savedBoundaries.forEach((boundary, index) => {
    try {
      const geojson = JSON.parse(boundary.geojson);
      const coordinates = geojson.coordinates[0]; // Assuming Polygon type

      const paths = coordinates.map((coord: [number, number]) => ({
        lat: coord[1],
        lng: coord[0]
      }));

      const polygon = new google.maps.Polygon({
        paths: paths,
        strokeColor: PARCEL_COLORS[index % PARCEL_COLORS.length],
        strokeOpacity: 1,
        strokeWeight: 2,
        fillColor: PARCEL_COLORS[index % PARCEL_COLORS.length],
        fillOpacity: 0.35,
        editable: false, // Make editable if needed
        draggable: false,
        map: mapInstance
      });

      loadedPolygons.push(polygon);

      // Calculate area
      const area = google.maps.geometry.spherical.computeArea(polygon.getPath());
      const hectares = area / 10000;
      loadedAreas.push(hectares);

    } catch (error) {
      console.error('Error loading boundary:', error);
    }
  });

  setDrawnBoundaries(loadedPolygons);
  setParcelAreas(loadedAreas);

  const totalArea = loadedAreas.reduce((sum, area) => sum + area, 0);
  setCalculatedArea(totalArea);

}, [mapInstance, savedBoundaries]);
```

**Checklist:**
- [ ] tRPC query added for boundaries
- [ ] useEffect loads boundaries onto map
- [ ] GeoJSON parsed correctly
- [ ] Polygons display with correct colors
- [ ] Areas calculated and displayed
- [ ] Test with farm that has boundaries
- [ ] Test with farm that has no boundaries

---

#### **Step 1.3.2: Save Boundaries to Database**

**File:** `client/src/pages/FarmDetail.tsx`

**Add tRPC mutation:**
```typescript
const saveBoundariesMutation = trpc.boundaries.save.useMutation({
  onSuccess: () => {
    toast.success('Boundaries saved successfully!');
    refetchBoundaries();
  },
  onError: (error) => {
    toast.error(`Failed to save boundaries: ${error.message}`);
  }
});
```

**Update the "Save Boundary" button handler:**
```typescript
const handleSaveBoundary = () => {
  if (drawnBoundaries.length === 0) {
    toast.error('No boundaries to save');
    return;
  }

  // Convert polygons to GeoJSON
  const boundariesData = drawnBoundaries.map((polygon, index) => {
    const path = polygon.getPath();
    const coordinates: [number, number][] = [];
    
    for (let i = 0; i < path.getLength(); i++) {
      const point = path.getAt(i);
      coordinates.push([point.lng(), point.lat()]);
    }
    
    // Close the polygon
    coordinates.push(coordinates[0]);

    const geojson = {
      type: "Polygon",
      coordinates: [coordinates]
    };

    return {
      parcelNumber: index + 1,
      geojson: JSON.stringify(geojson),
      area: parcelAreas[index] || 0
    };
  });

  // Save to database
  saveBoundariesMutation.mutate({
    farmId: farmId,
    boundaries: boundariesData
  });
};
```

**Update the Save Boundary button:**
```typescript
<Button 
  onClick={handleSaveBoundary}
  disabled={drawnBoundaries.length === 0 || saveBoundariesMutation.isLoading}
>
  {saveBoundariesMutation.isLoading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Saving...
    </>
  ) : (
    <>
      <Save className="mr-2 h-4 w-4" />
      Save Boundary
    </>
  )}
</Button>
```

**Checklist:**
- [ ] saveBoundariesMutation added
- [ ] handleSaveBoundary converts polygons to GeoJSON
- [ ] Button shows loading state during save
- [ ] Success toast appears after save
- [ ] Error toast appears on failure
- [ ] Test saving single parcel
- [ ] Test saving multiple parcels
- [ ] Verify data persists after page refresh

---

### **Task 1.4: Yield & Cost Data Integration** (1.5 hours)

#### **Step 1.4.1: Load Yields from Database**

**File:** `client/src/pages/FarmDetail.tsx`

**Add tRPC queries:**
```typescript
const { 
  data: savedYields, 
  isLoading: isYieldsLoading,
  refetch: refetchYields 
} = trpc.yields.getByFarmId.useQuery(
  { farmId: farmId },
  { enabled: !!farm }
);

const { 
  data: savedCosts, 
  isLoading: isCostsLoading,
  refetch: refetchCosts 
} = trpc.costs.getByFarmId.useQuery(
  { farmId: farmId },
  { enabled: !!farm }
);
```

**Replace local state with database data:**
```typescript
// OLD - Remove these
const [yieldRecords, setYieldRecords] = useState<YieldRecord[]>([]);
const [costRecords, setCostRecords] = useState<CostRecord[]>([]);

// NEW - Use database data directly
const yieldRecords = savedYields || [];
const costRecords = savedCosts || [];
```

**Checklist:**
- [ ] tRPC queries added for yields and costs
- [ ] Local state replaced with database data
- [ ] Yield table displays database records
- [ ] Cost table displays database records
- [ ] Profitability calculations use database data
- [ ] Test with farm that has yield/cost data
- [ ] Test with farm that has no data

---

#### **Step 1.4.2: Save Yields to Database**

**Add tRPC mutation:**
```typescript
const createYieldMutation = trpc.yields.create.useMutation({
  onSuccess: () => {
    toast.success('Harvest recorded successfully!');
    refetchYields();
    setIsYieldDialogOpen(false);
  },
  onError: (error) => {
    toast.error(`Failed to record harvest: ${error.message}`);
  }
});
```

**Update the yield form submission:**
```typescript
const handleYieldSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  // Validation
  if (!yieldFormData.parcelNumber || !yieldFormData.cropType || 
      !yieldFormData.harvestDate || !yieldFormData.quantity) {
    toast.error('Please fill in all required fields');
    return;
  }

  const quantity = parseFloat(yieldFormData.quantity);
  if (isNaN(quantity) || quantity <= 0) {
    toast.error('Please enter a valid quantity');
    return;
  }

  // Submit to database
  createYieldMutation.mutate({
    farmId: farmId,
    parcelNumber: parseInt(yieldFormData.parcelNumber),
    cropType: yieldFormData.cropType,
    harvestDate: yieldFormData.harvestDate,
    quantity: quantity,
    unit: yieldFormData.unit,
    qualityGrade: yieldFormData.qualityGrade
  });
};
```

**Checklist:**
- [ ] createYieldMutation added
- [ ] Form submission calls mutation
- [ ] Loading state during submission
- [ ] Success toast and dialog close
- [ ] Yield table updates after submission
- [ ] Test recording harvest with valid data
- [ ] Test validation errors
- [ ] Verify data persists after refresh

---

#### **Step 1.4.3: Save Costs to Database**

**Add tRPC mutation:**
```typescript
const createCostMutation = trpc.costs.create.useMutation({
  onSuccess: () => {
    toast.success('Cost recorded successfully!');
    refetchCosts();
    setIsCostDialogOpen(false);
  },
  onError: (error) => {
    toast.error(`Failed to record cost: ${error.message}`);
  }
});
```

**Update the cost form submission:**
```typescript
const handleCostSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  // Validation
  if (!costFormData.date || !costFormData.category || !costFormData.amount) {
    toast.error('Please fill in all required fields');
    return;
  }

  const amount = parseFloat(costFormData.amount);
  if (isNaN(amount) || amount <= 0) {
    toast.error('Please enter a valid amount');
    return;
  }

  // Submit to database
  createCostMutation.mutate({
    farmId: farmId,
    date: costFormData.date,
    category: costFormData.category,
    description: costFormData.description,
    amount: amount,
    parcelNumber: costFormData.parcelNumber === "all" ? null : parseInt(costFormData.parcelNumber)
  });
};
```

**Checklist:**
- [ ] createCostMutation added
- [ ] Form submission calls mutation
- [ ] Loading state during submission
- [ ] Success toast and dialog close
- [ ] Cost table updates after submission
- [ ] Test recording cost with valid data
- [ ] Test validation errors
- [ ] Verify data persists after refresh

---

#### **Step 1.4.4: Delete Yields and Costs**

**Add delete mutations:**
```typescript
const deleteYieldMutation = trpc.yields.delete.useMutation({
  onSuccess: () => {
    toast.success('Harvest record deleted');
    refetchYields();
  },
  onError: (error) => {
    toast.error(`Failed to delete: ${error.message}`);
  }
});

const deleteCostMutation = trpc.costs.delete.useMutation({
  onSuccess: () => {
    toast.success('Cost record deleted');
    refetchCosts();
  },
  onError: (error) => {
    toast.error(`Failed to delete: ${error.message}`);
  }
});
```

**Update delete handlers:**
```typescript
const handleDeleteYield = (yieldId: number) => {
  if (confirm('Are you sure you want to delete this harvest record?')) {
    deleteYieldMutation.mutate({ id: yieldId });
  }
};

const handleDeleteCost = (costId: number) => {
  if (confirm('Are you sure you want to delete this cost record?')) {
    deleteCostMutation.mutate({ id: costId });
  }
};
```

**Checklist:**
- [ ] Delete mutations added
- [ ] Confirmation dialog before delete
- [ ] Success toast after delete
- [ ] Table updates after delete
- [ ] Test deleting yield record
- [ ] Test deleting cost record
- [ ] Verify deletion persists after refresh

---

## **End of Day 1: Comprehensive Testing** (30 minutes)

### **Test 1: Data Persistence Across Page Refreshes**

1. [ ] Navigate to a farm detail page
2. [ ] Draw a boundary polygon
3. [ ] Click "Save Boundary"
4. [ ] Refresh the page (F5)
5. [ ] Verify boundary still displays
6. [ ] Record a harvest
7. [ ] Refresh the page
8. [ ] Verify harvest appears in table
9. [ ] Record a cost
10. [ ] Refresh the page
11. [ ] Verify cost appears in table

**Expected:** All data persists after refresh

---

### **Test 2: Data Persistence Across Browser Sessions**

1. [ ] Complete Test 1 above
2. [ ] Close the browser completely
3. [ ] Open browser again
4. [ ] Navigate to the same farm
5. [ ] Verify boundary displays
6. [ ] Verify yields display
7. [ ] Verify costs display

**Expected:** All data persists across sessions

---

### **Test 3: Multiple Farms Data Isolation**

1. [ ] Create/navigate to Farm A
2. [ ] Draw boundary and save
3. [ ] Record yield and cost
4. [ ] Navigate to Farm B
5. [ ] Verify Farm B has no boundaries from Farm A
6. [ ] Draw different boundary for Farm B
7. [ ] Navigate back to Farm A
8. [ ] Verify Farm A still has its original boundary

**Expected:** Data is properly isolated per farm

---

### **Test 4: Error Handling**

1. [ ] Disconnect network (DevTools → Network → Offline)
2. [ ] Try to save boundary → Error toast
3. [ ] Try to record yield → Error toast
4. [ ] Try to record cost → Error toast
5. [ ] Reconnect network
6. [ ] Retry save boundary → Success
7. [ ] Verify data saved correctly

**Expected:** Graceful error handling with retry capability

---

### **Test 5: Loading States**

1. [ ] Throttle network (DevTools → Network → Slow 3G)
2. [ ] Navigate to farm detail page
3. [ ] Verify loading spinner appears
4. [ ] Wait for data to load
5. [ ] Verify spinner disappears
6. [ ] Click "Save Boundary"
7. [ ] Verify button shows "Saving..." state
8. [ ] Wait for save to complete
9. [ ] Verify button returns to normal

**Expected:** Loading states provide clear feedback

---

## **Day 1 Checkpoint Criteria**

Before creating checkpoint "Day 1 - Database Integration Complete", verify:

### **Critical Requirements:**
- [ ] Farm data loads from database
- [ ] Boundaries save and load correctly
- [ ] Yields save and load correctly
- [ ] Costs save and load correctly
- [ ] All data persists across page refreshes
- [ ] All data persists across browser sessions
- [ ] Data is isolated per farm (no cross-contamination)

### **User Experience:**
- [ ] Loading states display during API calls
- [ ] Error states display with retry options
- [ ] Success toasts appear after saves
- [ ] Error toasts appear on failures
- [ ] No console errors in browser
- [ ] No server errors in terminal

### **Testing:**
- [ ] All 5 test scenarios pass
- [ ] Tested on Chrome/Firefox/Safari
- [ ] Tested with slow network
- [ ] Tested with network disconnection
- [ ] Tested with multiple farms

---

## **Common Issues & Solutions**

### **Issue 1: "Cannot read property 'useQuery' of undefined"**
**Cause:** tRPC client not properly initialized  
**Solution:** Verify tRPC Provider wraps App in main.tsx

### **Issue 2: "Network request failed" on all queries**
**Cause:** Server not running or wrong API endpoint  
**Solution:** 
- Check server is running: `pnpm dev`
- Verify API endpoint in trpc.ts: `/api/trpc`
- Check server logs for errors

### **Issue 3: Boundaries don't display after loading**
**Cause:** GeoJSON parsing error or wrong coordinate order  
**Solution:**
- Check GeoJSON format: `{"type":"Polygon","coordinates":[[[lng,lat],...]]}`
- Verify coordinate order: [longitude, latitude] in GeoJSON, {lat, lng} in Google Maps
- Check browser console for parsing errors

### **Issue 4: Data doesn't persist after refresh**
**Cause:** Mutation not actually saving to database  
**Solution:**
- Check server logs for database errors
- Verify mutation is called: add console.log in mutation
- Check database directly: Use Management UI → Database panel

### **Issue 5: "Optimistic update" causes flickering**
**Cause:** Query refetches immediately after mutation  
**Solution:**
- Use `onMutate` to update cache optimistically
- Use `onSuccess` to invalidate queries
- Set proper `staleTime` in QueryClient config

---

## **Files Modified on Day 1**

### **Modified Files:**
1. `client/src/pages/FarmDetail.tsx` (~300 lines changed)
   - Replace getFarmById with tRPC query
   - Add boundary load/save logic
   - Add yield create/delete logic
   - Add cost create/delete logic
   - Add loading/error states

2. `client/src/pages/FarmList.tsx` (~50 lines changed)
   - Replace useState with tRPC query
   - Add loading/error states

3. `client/src/lib/trpc.ts` (verify exists)
   - tRPC client configuration
   - Authentication headers

4. `client/src/main.tsx` (verify exists)
   - tRPC Provider setup
   - QueryClient configuration

### **No New Files Created on Day 1**
All work is integration of existing components with existing API endpoints.

---

## **Next Steps After Day 1**

Once Day 1 is complete, you'll have:
✅ Full data persistence across sessions  
✅ All farm, boundary, yield, and cost data in database  
✅ Loading states and error handling  
✅ Foundation for Day 2 (Add/Edit farms)  

**Ready for Day 2:** Farm CRUD Operations

---

## **Estimated Time Breakdown**

| Task | Estimated Time | Actual Time |
|------|----------------|-------------|
| 1.1 Setup tRPC | 1 hour | _____ |
| 1.2 Farm Data | 2-3 hours | _____ |
| 1.3 Boundaries | 1.5 hours | _____ |
| 1.4 Yields & Costs | 1.5 hours | _____ |
| Testing | 30 min | _____ |
| **Total** | **6-7 hours** | **_____** |

---

**Ready to start Day 1?** Let me know and I'll begin with fixing the syntax error in FarmList.tsx, then proceed to Task 1.1: Setup tRPC Client Integration.
