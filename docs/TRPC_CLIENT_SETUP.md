# tRPC Client Setup Documentation

## Overview

The MAGSASA-CARD platform uses tRPC (TypeScript Remote Procedure Call) for type-safe API communication between the frontend and backend. This document details the complete tRPC client configuration including authentication, error handling, and retry logic.

## Architecture

```
┌─────────────────┐
│  React Client   │
│  (Browser)      │
└────────┬────────┘
         │
         │ tRPC Client
         │ (Type-safe calls)
         │
         ▼
┌─────────────────┐
│  HTTP Batch     │
│  Link           │
│  (Batching)     │
└────────┬────────┘
         │
         │ HTTP POST /api/trpc
         │ (JSON + SuperJSON)
         │
         ▼
┌─────────────────┐
│  tRPC Server    │
│  (Express)      │
└────────┬────────┘
         │
         │ Procedures
         │
         ▼
┌─────────────────┐
│  Database       │
│  (MySQL)        │
└─────────────────┘
```

## Configuration

### Location
- **Client Setup**: `client/src/main.tsx`
- **Type Definition**: `client/src/lib/trpc.ts`
- **Server Router**: `server/routers.ts`

### Core Components

#### 1. tRPC Client Instance
```typescript
// client/src/lib/trpc.ts
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../server/routers";

export const trpc = createTRPCReact<AppRouter>();
```

#### 2. Query Client Configuration
```typescript
// client/src/main.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Smart retry logic
        if (error instanceof TRPCClientError && error.message === UNAUTHED_ERR_MSG) {
          return false; // Don't retry auth errors
        }
        if (error instanceof TRPCClientError && error.data?.httpStatus >= 400 && error.data.httpStatus < 500) {
          return false; // Don't retry client errors
        }
        return failureCount < 3; // Retry up to 3 times
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: (failureCount, error) => {
        // Retry once for network errors only
        if (error instanceof TRPCClientError) {
          if (error.message === UNAUTHED_ERR_MSG) return false;
          if (error.data?.httpStatus >= 400 && error.data.httpStatus < 500) return false;
        }
        return failureCount < 1;
      },
      retryDelay: 1000,
    },
  },
});
```

#### 3. HTTP Batch Link
```typescript
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include", // Cookie-based auth
          signal: controller.signal,
        }).finally(() => {
          clearTimeout(timeoutId);
        });
      },
      maxURLLength: 2083,
    }),
  ],
});
```

## Features

### 1. Type Safety
- **Full TypeScript support** from client to server
- **Autocomplete** for all API procedures
- **Type inference** for request/response data
- **Compile-time errors** for invalid API calls

### 2. Request Batching
- Multiple queries batched into single HTTP request
- Reduces network overhead
- Configurable batch window (default: 10ms)
- Maximum URL length: 2083 characters

### 3. SuperJSON Transformer
Handles complex JavaScript types:
- `Date` objects
- `Map` and `Set`
- `undefined` values
- `BigInt` numbers
- Regular expressions
- Custom class instances

### 4. Authentication

#### Cookie-Based Sessions
```typescript
credentials: "include" // Sends cookies with every request
```

#### Automatic Redirect
```typescript
const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (error.message === UNAUTHED_ERR_MSG) {
    window.location.href = getLoginUrl();
  }
};
```

#### Error Monitoring
```typescript
// Query errors
queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    redirectToLoginIfUnauthorized(event.query.state.error);
    console.error("[API Query Error]", error);
  }
});

// Mutation errors
queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    redirectToLoginIfUnauthorized(event.mutation.state.error);
    console.error("[API Mutation Error]", error);
  }
});
```

### 5. Retry Logic

#### Query Retries
- **Attempts**: Up to 3 retries
- **Backoff**: Exponential (1s → 2s → 4s → max 30s)
- **Skip**: Auth errors (401), client errors (4xx)
- **Retry**: Network errors, server errors (5xx)

#### Mutation Retries
- **Attempts**: 1 retry only
- **Delay**: 1 second
- **Skip**: Auth errors, client errors
- **Retry**: Network errors, server errors

#### Retry Decision Logic
```typescript
retry: (failureCount, error) => {
  // Never retry authentication errors
  if (error.message === UNAUTHED_ERR_MSG) return false;
  
  // Never retry client errors (400-499)
  if (error.data?.httpStatus >= 400 && error.data.httpStatus < 500) {
    return false;
  }
  
  // Retry network/server errors
  return failureCount < maxRetries;
}
```

### 6. Request Timeout
- **Duration**: 30 seconds
- **Implementation**: AbortController
- **Behavior**: Aborts hung requests
- **Error**: Throws timeout error

### 7. Caching Strategy
- **Stale Time**: 5 minutes
- **Refetch on Focus**: Disabled
- **Refetch on Reconnect**: Enabled (default)
- **Refetch on Mount**: Enabled (default)

## Usage Examples

### Basic Query
```typescript
import { trpc } from "@/lib/trpc";

function FarmList() {
  const { data, isLoading, error } = trpc.farms.list.useQuery();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <ul>
      {data.map(farm => (
        <li key={farm.id}>{farm.name}</li>
      ))}
    </ul>
  );
}
```

### Query with Parameters
```typescript
function FarmDetail({ id }: { id: number }) {
  const { data: farm } = trpc.farms.getById.useQuery({ id });
  
  return <div>{farm?.name}</div>;
}
```

### Mutation
```typescript
function CreateFarm() {
  const createFarm = trpc.farms.create.useMutation({
    onSuccess: (data) => {
      toast.success("Farm created!");
      navigate(`/farms/${data.farmId}`);
    },
    onError: (error) => {
      toast.error(`Failed: ${error.message}`);
    },
  });
  
  const handleSubmit = (formData) => {
    createFarm.mutate(formData);
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Conditional Query
```typescript
function FarmBoundaries({ farmId }: { farmId: number | null }) {
  const { data } = trpc.boundaries.getByFarmId.useQuery(
    { farmId: farmId! },
    { enabled: !!farmId } // Only run when farmId exists
  );
  
  return <div>{data?.length} boundaries</div>;
}
```

### Manual Refetch
```typescript
function RefreshButton() {
  const { refetch } = trpc.farms.list.useQuery();
  
  return (
    <button onClick={() => refetch()}>
      Refresh
    </button>
  );
}
```

### Optimistic Updates
```typescript
function UpdateFarm() {
  const utils = trpc.useContext();
  
  const updateFarm = trpc.farms.update.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await utils.farms.getById.cancel({ id: newData.id });
      
      // Snapshot previous value
      const previous = utils.farms.getById.getData({ id: newData.id });
      
      // Optimistically update
      utils.farms.getById.setData({ id: newData.id }, newData);
      
      return { previous };
    },
    onError: (err, newData, context) => {
      // Rollback on error
      utils.farms.getById.setData({ id: newData.id }, context?.previous);
    },
    onSettled: (data, error, variables) => {
      // Refetch after mutation
      utils.farms.getById.invalidate({ id: variables.id });
    },
  });
  
  return <button onClick={() => updateFarm.mutate(data)}>Update</button>;
}
```

## Error Handling

### Error Types

#### 1. Authentication Errors (401)
```typescript
// Automatic redirect to login
if (error.message === UNAUTHED_ERR_MSG) {
  window.location.href = getLoginUrl();
}
```

#### 2. Validation Errors (400)
```typescript
// Display validation errors to user
if (error.data?.code === "BAD_REQUEST") {
  toast.error(error.message);
}
```

#### 3. Not Found Errors (404)
```typescript
if (error.data?.httpStatus === 404) {
  return <div>Resource not found</div>;
}
```

#### 4. Server Errors (500)
```typescript
// Automatic retry with backoff
// After 3 retries, show error to user
if (error.data?.httpStatus >= 500) {
  toast.error("Server error. Please try again.");
}
```

#### 5. Network Errors
```typescript
// Automatic retry with backoff
if (error.message.includes("fetch failed")) {
  toast.error("Network error. Retrying...");
}
```

#### 6. Timeout Errors
```typescript
// After 30 seconds
if (error.message.includes("aborted")) {
  toast.error("Request timeout. Please try again.");
}
```

### Global Error Handler
```typescript
// All query errors
queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    console.error("[API Query Error]", event.query.state.error);
  }
});

// All mutation errors
queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    console.error("[API Mutation Error]", event.mutation.state.error);
  }
});
```

## Testing

### Test Page
Navigate to `/trpc-client-test` to run comprehensive tests:
1. **Connection Test**: Verify API connectivity
2. **Authentication Test**: Verify session handling
3. **Retry Logic Test**: Verify retry configuration
4. **Timeout Test**: Verify timeout configuration

### Manual Testing
```typescript
// Test query
const { data, error } = trpc.farms.list.useQuery();
console.log("Farms:", data);
console.log("Error:", error);

// Test mutation
const createFarm = trpc.farms.create.useMutation();
createFarm.mutate({ name: "Test Farm" });
```

### Debug Mode
Enable React Query DevTools:
```typescript
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

## Performance Optimization

### 1. Request Batching
Multiple queries are automatically batched:
```typescript
// These 3 queries become 1 HTTP request
trpc.farms.list.useQuery();
trpc.users.list.useQuery();
trpc.costs.list.useQuery();
```

### 2. Query Caching
Data is cached for 5 minutes:
```typescript
// First call: fetches from server
trpc.farms.list.useQuery();

// Within 5 minutes: returns cached data
trpc.farms.list.useQuery();
```

### 3. Prefetching
```typescript
const utils = trpc.useContext();

// Prefetch before navigation
const handleClick = async () => {
  await utils.farms.getById.prefetch({ id: 1 });
  navigate("/farms/1");
};
```

### 4. Infinite Queries
```typescript
const { data, fetchNextPage, hasNextPage } = trpc.farms.list.useInfiniteQuery(
  { limit: 20 },
  {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  }
);
```

## Troubleshooting

### Issue: Queries not updating after mutation
**Solution**: Invalidate queries
```typescript
const utils = trpc.useContext();
const createFarm = trpc.farms.create.useMutation({
  onSuccess: () => {
    utils.farms.list.invalidate();
  },
});
```

### Issue: Authentication errors not redirecting
**Solution**: Check UNAUTHED_ERR_MSG constant
```typescript
// shared/const.ts
export const UNAUTHED_ERR_MSG = "Unauthorized";
```

### Issue: Timeout too short/long
**Solution**: Adjust timeout in fetch
```typescript
setTimeout(() => controller.abort(), 60000); // 60 seconds
```

### Issue: Too many retries
**Solution**: Reduce retry count
```typescript
retry: (failureCount) => failureCount < 1, // Only 1 retry
```

### Issue: Stale data displayed
**Solution**: Reduce stale time or force refetch
```typescript
staleTime: 1 * 60 * 1000, // 1 minute
// or
refetchOnWindowFocus: true,
```

## Best Practices

1. **Always handle loading states**
   ```typescript
   if (isLoading) return <Skeleton />;
   ```

2. **Always handle errors**
   ```typescript
   if (error) return <ErrorMessage error={error} />;
   ```

3. **Use enabled for conditional queries**
   ```typescript
   { enabled: !!userId }
   ```

4. **Invalidate after mutations**
   ```typescript
   onSuccess: () => utils.farms.list.invalidate()
   ```

5. **Use optimistic updates for better UX**
   ```typescript
   onMutate: async () => { /* optimistic update */ }
   ```

6. **Prefetch for better performance**
   ```typescript
   await utils.farms.getById.prefetch({ id })
   ```

7. **Use suspense for cleaner code** (optional)
   ```typescript
   suspense: true
   ```

## Security Considerations

1. **Credentials**: Always use `credentials: "include"` for cookies
2. **HTTPS**: Use HTTPS in production
3. **CSRF**: Server validates CSRF tokens
4. **Rate Limiting**: Server implements rate limiting
5. **Input Validation**: Server validates all inputs with Zod
6. **SQL Injection**: Use parameterized queries (Drizzle ORM)

## Monitoring

### Client-Side Logging
```typescript
console.error("[API Query Error]", error);
console.error("[API Mutation Error]", error);
```

### Server-Side Logging
```typescript
// server/routers.ts
console.log("[tRPC] Procedure called:", procedureName);
console.error("[tRPC] Error:", error);
```

### Analytics Integration
```typescript
queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    analytics.track("API Error", {
      query: event.query.queryKey,
      error: event.query.state.error,
    });
  }
});
```

## References

- [tRPC Documentation](https://trpc.io/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [SuperJSON Documentation](https://github.com/blitz-js/superjson)
- [AbortController MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
