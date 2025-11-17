# Optimistic Updates Documentation

## Overview

Optimistic updates provide instant UI feedback by updating the cache immediately when a user performs an action, before waiting for the server response. If the server request fails, the changes are automatically rolled back to the previous state.

## Benefits

1. **Instant Feedback**: Users see changes immediately without waiting for server response
2. **Better UX**: Perceived performance improvement makes the app feel faster
3. **Error Recovery**: Automatic rollback on failure maintains data consistency
4. **Reduced Latency**: No loading spinners for common operations

## Implementation Pattern

All optimistic updates follow this pattern:

```typescript
const mutation = trpc.procedure.useMutation({
  onMutate: async (newData) => {
    // 1. Cancel outgoing refetches
    await utils.query.cancel(queryKey);
    
    // 2. Snapshot previous value
    const previous = utils.query.getData(queryKey);
    
    // 3. Optimistically update cache
    utils.query.setData(queryKey, optimisticData);
    
    // 4. Show optimistic toast
    toast.success("Processing...", { duration: 1000 });
    
    // 5. Return context for rollback
    return { previous };
  },
  onSuccess: () => {
    // 6. Show success message
    toast.success("Success!");
    
    // 7. Invalidate to refetch real data
    utils.query.invalidate(queryKey);
  },
  onError: (error, newData, context) => {
    // 8. Rollback on error
    if (context?.previous) {
      utils.query.setData(queryKey, context.previous);
    }
    
    // 9. Show error message
    toast.error(`Failed: ${error.message}`);
  },
  onSettled: () => {
    // 10. Always refetch for consistency
    utils.query.invalidate(queryKey);
  },
});
```

## Implemented Optimistic Updates

### 1. Farm Creation (FarmNew.tsx)

**Mutation**: `trpc.farms.create`

**What happens:**
1. New farm is immediately added to the farm list cache
2. User sees "Creating farm..." toast
3. Farm appears in the list instantly
4. On success: Navigate to farm detail page
5. On error: Remove optimistic farm from list

**Code:**
```typescript
const createFarmMutation = trpc.farms.create.useMutation({
  onMutate: async (newFarm) => {
    await utils.farms.list.cancel();
    const previousFarms = utils.farms.list.getData();
    
    const optimisticFarm = {
      id: Date.now(), // Temporary ID
      ...newFarm,
      // ... other fields
    };
    
    utils.farms.list.setData(undefined, (old) => {
      return old ? [...old, optimisticFarm] : [optimisticFarm];
    });
    
    toast.success("Creating farm...", { duration: 1000 });
    return { previousFarms };
  },
  onSuccess: (data) => {
    toast.success("Farm created successfully!");
    utils.farms.list.invalidate();
    navigate(`/farms/${data.farmId}`);
  },
  onError: (error, newFarm, context) => {
    if (context?.previousFarms) {
      utils.farms.list.setData(undefined, context.previousFarms);
    }
    toast.error(`Failed to create farm: ${error.message}`);
  },
  onSettled: () => {
    utils.farms.list.invalidate();
  },
});
```

### 2. Boundary Saving (FarmDetail.tsx)

**Mutation**: `trpc.boundaries.save`

**What happens:**
1. Boundaries are immediately updated in cache
2. User sees "Saving boundaries..." toast
3. Map displays new boundaries instantly
4. On success: Show success message
5. On error: Restore previous boundaries

**Code:**
```typescript
const saveBoundariesMutation = trpc.boundaries.save.useMutation({
  onMutate: async (newBoundaries) => {
    await utils.boundaries.getByFarmId.cancel({ farmId });
    const previousBoundaries = utils.boundaries.getByFarmId.getData({ farmId });
    
    utils.boundaries.getByFarmId.setData({ farmId }, newBoundaries.boundaries);
    toast.success("Saving boundaries...", { duration: 1000 });
    
    return { previousBoundaries };
  },
  onSuccess: () => {
    toast.success("Boundaries saved successfully");
    utils.boundaries.getByFarmId.invalidate({ farmId });
  },
  onError: (error, newBoundaries, context) => {
    if (context?.previousBoundaries) {
      utils.boundaries.getByFarmId.setData({ farmId }, context.previousBoundaries);
    }
    toast.error(`Failed to save boundaries: ${error.message}`);
  },
  onSettled: () => {
    utils.boundaries.getByFarmId.invalidate({ farmId });
  },
});
```

### 3. Yield Creation (FarmDetail.tsx)

**Mutation**: `trpc.yields.create`

**What happens:**
1. New harvest record is immediately added to the list
2. User sees "Adding harvest record..." toast
3. Record appears in the table instantly
4. On success: Show success message
5. On error: Remove optimistic record

**Code:**
```typescript
const createYieldMutation = trpc.yields.create.useMutation({
  onMutate: async (newYield) => {
    await utils.yields.getByFarmId.cancel({ farmId });
    const previousYields = utils.yields.getByFarmId.getData({ farmId });
    
    const optimisticYield = {
      id: Date.now(),
      farmId,
      ...newYield,
      createdAt: new Date().toISOString(),
    };
    
    utils.yields.getByFarmId.setData({ farmId }, (old) => {
      return old ? [...old, optimisticYield] : [optimisticYield];
    });
    
    toast.success("Adding harvest record...", { duration: 1000 });
    return { previousYields };
  },
  onSuccess: () => {
    toast.success("Harvest record saved");
    utils.yields.getByFarmId.invalidate({ farmId });
  },
  onError: (error, newYield, context) => {
    if (context?.previousYields) {
      utils.yields.getByFarmId.setData({ farmId }, context.previousYields);
    }
    toast.error(`Failed to save harvest: ${error.message}`);
  },
  onSettled: () => {
    utils.yields.getByFarmId.invalidate({ farmId });
  },
});
```

### 4. Yield Deletion (FarmDetail.tsx)

**Mutation**: `trpc.yields.delete`

**What happens:**
1. Harvest record is immediately removed from the list
2. User sees "Deleting harvest record..." toast
3. Record disappears from the table instantly
4. On success: Show success message
5. On error: Restore deleted record

**Code:**
```typescript
const deleteYieldMutation = trpc.yields.delete.useMutation({
  onMutate: async (variables) => {
    await utils.yields.getByFarmId.cancel({ farmId });
    const previousYields = utils.yields.getByFarmId.getData({ farmId });
    
    utils.yields.getByFarmId.setData({ farmId }, (old) => {
      return old ? old.filter(y => y.id !== variables.id) : [];
    });
    
    toast.success("Deleting harvest record...", { duration: 1000 });
    return { previousYields };
  },
  onSuccess: () => {
    toast.success("Harvest record deleted");
    utils.yields.getByFarmId.invalidate({ farmId });
  },
  onError: (error, variables, context) => {
    if (context?.previousYields) {
      utils.yields.getByFarmId.setData({ farmId }, context.previousYields);
    }
    toast.error(`Failed to delete harvest: ${error.message}`);
  },
  onSettled: () => {
    utils.yields.getByFarmId.invalidate({ farmId });
  },
});
```

### 5. Cost Creation (FarmDetail.tsx)

**Mutation**: `trpc.costs.create`

**What happens:**
1. New cost record is immediately added to the list
2. User sees "Adding cost record..." toast
3. Record appears in the table instantly
4. On success: Show success message
5. On error: Remove optimistic record

**Code:**
```typescript
const createCostMutation = trpc.costs.create.useMutation({
  onMutate: async (newCost) => {
    await utils.costs.getByFarmId.cancel({ farmId });
    const previousCosts = utils.costs.getByFarmId.getData({ farmId });
    
    const optimisticCost = {
      id: Date.now(),
      farmId,
      ...newCost,
      createdAt: new Date().toISOString(),
    };
    
    utils.costs.getByFarmId.setData({ farmId }, (old) => {
      return old ? [...old, optimisticCost] : [optimisticCost];
    });
    
    toast.success("Adding cost record...", { duration: 1000 });
    return { previousCosts };
  },
  onSuccess: () => {
    toast.success("Cost record saved");
    utils.costs.getByFarmId.invalidate({ farmId });
  },
  onError: (error, newCost, context) => {
    if (context?.previousCosts) {
      utils.costs.getByFarmId.setData({ farmId }, context.previousCosts);
    }
    toast.error(`Failed to save cost: ${error.message}`);
  },
  onSettled: () => {
    utils.costs.getByFarmId.invalidate({ farmId });
  },
});
```

### 6. Cost Deletion (FarmDetail.tsx)

**Mutation**: `trpc.costs.delete`

**What happens:**
1. Cost record is immediately removed from the list
2. User sees "Deleting cost record..." toast
3. Record disappears from the table instantly
4. On success: Show success message
5. On error: Restore deleted record

**Code:**
```typescript
const deleteCostMutation = trpc.costs.delete.useMutation({
  onMutate: async (variables) => {
    await utils.costs.getByFarmId.cancel({ farmId });
    const previousCosts = utils.costs.getByFarmId.getData({ farmId });
    
    utils.costs.getByFarmId.setData({ farmId }, (old) => {
      return old ? old.filter(c => c.id !== variables.id) : [];
    });
    
    toast.success("Deleting cost record...", { duration: 1000 });
    return { previousCosts };
  },
  onSuccess: () => {
    toast.success("Cost record deleted");
    utils.costs.getByFarmId.invalidate({ farmId });
  },
  onError: (error, variables, context) => {
    if (context?.previousCosts) {
      utils.costs.getByFarmId.setData({ farmId }, context.previousCosts);
    }
    toast.error(`Failed to delete cost: ${error.message}`);
  },
  onSettled: () => {
    utils.costs.getByFarmId.invalidate({ farmId });
  },
});
```

## Key Concepts

### 1. Cancel Ongoing Refetches

```typescript
await utils.query.cancel(queryKey);
```

Prevents race conditions where an ongoing refetch might overwrite the optimistic update.

### 2. Snapshot Previous State

```typescript
const previous = utils.query.getData(queryKey);
return { previous };
```

Saves the current state so we can rollback if the mutation fails.

### 3. Optimistic Update

```typescript
utils.query.setData(queryKey, newData);
```

Immediately updates the cache with the optimistic data.

### 4. Temporary IDs

```typescript
const optimisticItem = {
  id: Date.now(), // Temporary ID
  ...newData,
};
```

Use `Date.now()` for temporary IDs. The server will return the real ID on success.

### 5. Rollback on Error

```typescript
if (context?.previous) {
  utils.query.setData(queryKey, context.previous);
}
```

Restores the previous state if the mutation fails.

### 6. Cache Invalidation

```typescript
utils.query.invalidate(queryKey);
```

Refetches the real data from the server to ensure consistency.

## Toast Notifications

### Optimistic Toast (1 second)
```typescript
toast.success("Processing...", { duration: 1000 });
```

Shows immediately when the mutation starts. Short duration (1s) so it doesn't overlap with success/error toast.

### Success Toast (Default)
```typescript
toast.success("Success!");
```

Shows after server confirms the operation succeeded.

### Error Toast (Default)
```typescript
toast.error(`Failed: ${error.message}`);
```

Shows if the server request fails. Includes error message for debugging.

## Testing Optimistic Updates

### 1. Test with Fast Network
- Create a farm → Should see instant feedback
- Add harvest record → Should appear immediately
- Delete cost record → Should disappear immediately

### 2. Test with Slow Network
- Use browser DevTools → Network → Slow 3G
- Perform operations → Should see optimistic updates
- Wait for server response → Should see final state

### 3. Test Error Scenarios
- Disconnect network → Perform operation
- Should see optimistic update
- Should see error toast
- Should rollback to previous state

### 4. Test Rollback
- Create invalid data (e.g., negative numbers)
- Should see optimistic update
- Server should reject
- Should rollback and show error

## Best Practices

### 1. Always Cancel Ongoing Refetches
```typescript
await utils.query.cancel(queryKey);
```

Prevents race conditions.

### 2. Always Snapshot Previous State
```typescript
const previous = utils.query.getData(queryKey);
return { previous };
```

Enables rollback on error.

### 3. Always Invalidate After Success
```typescript
onSuccess: () => {
  utils.query.invalidate(queryKey);
}
```

Ensures cache stays in sync with server.

### 4. Always Invalidate in onSettled
```typescript
onSettled: () => {
  utils.query.invalidate(queryKey);
}
```

Refetches even if mutation fails (for consistency).

### 5. Use Short Toast Duration for Optimistic Toasts
```typescript
toast.success("Processing...", { duration: 1000 });
```

Prevents toast overlap.

### 6. Include Error Messages in Error Toasts
```typescript
toast.error(`Failed: ${error.message}`);
```

Helps with debugging.

### 7. Use Temporary IDs for New Items
```typescript
id: Date.now()
```

Ensures unique IDs until server responds.

## Common Pitfalls

### 1. Forgetting to Cancel Ongoing Refetches
**Problem**: Race condition where refetch overwrites optimistic update

**Solution**: Always call `await utils.query.cancel(queryKey)` in `onMutate`

### 2. Not Snapshotting Previous State
**Problem**: Can't rollback on error

**Solution**: Always save previous state in `onMutate` and return it

### 3. Not Invalidating After Success
**Problem**: Cache contains temporary IDs instead of real IDs

**Solution**: Always call `utils.query.invalidate(queryKey)` in `onSuccess`

### 4. Long Toast Duration for Optimistic Toasts
**Problem**: Optimistic toast overlaps with success/error toast

**Solution**: Use short duration (1000ms) for optimistic toasts

### 5. Not Handling Rollback
**Problem**: Failed mutations leave incorrect data in cache

**Solution**: Always restore previous state in `onError`

### 6. Forgetting onSettled
**Problem**: Cache might be inconsistent after errors

**Solution**: Always invalidate in `onSettled` to refetch regardless of success/error

## Performance Considerations

### 1. Cache Size
Optimistic updates add temporary data to the cache. This is usually not a problem, but be aware of memory usage for large datasets.

### 2. Network Requests
Each mutation triggers:
- 1 mutation request
- 1 refetch after success (via invalidate)

This is acceptable for better UX.

### 3. Toast Notifications
Too many toasts can be annoying. Consider:
- Grouping multiple operations
- Using a single toast for batch operations
- Disabling optimistic toasts for very fast operations

## Debugging

### 1. React Query DevTools
```typescript
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

Shows cache state, mutations, and invalidations in real-time.

### 2. Console Logging
```typescript
onMutate: async (newData) => {
  console.log("[Optimistic] Starting mutation", newData);
  // ...
},
onSuccess: () => {
  console.log("[Optimistic] Mutation succeeded");
},
onError: (error) => {
  console.log("[Optimistic] Mutation failed", error);
},
```

### 3. Network Tab
Use browser DevTools → Network tab to see:
- Mutation requests
- Refetch requests after invalidation
- Timing and latency

## Future Improvements

1. **Batch Operations**: Optimistic updates for multiple items at once
2. **Undo/Redo**: Allow users to undo optimistic updates
3. **Offline Support**: Queue mutations when offline, apply when online
4. **Conflict Resolution**: Handle conflicts when multiple users edit the same data
5. **Optimistic Animations**: Add smooth animations for optimistic updates

## References

- [React Query Optimistic Updates](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
- [tRPC Optimistic Updates](https://trpc.io/docs/client/react/useUtils#optimistic-updates)
- [Toast Notifications with Sonner](https://sonner.emilkowal.ski/)
