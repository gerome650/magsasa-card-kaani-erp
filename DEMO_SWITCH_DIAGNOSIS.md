# Demo Account Switch Hang - Diagnosis & Fix

## Root Cause Analysis

Based on code inspection and instrumentation, the hang is most likely caused by **Bucket D: UI stuck in transition** with a secondary risk of **Bucket C: auth.me returns stale user**.

### Primary Issue (Bucket D): Transition Not Clearing

**Symptoms:**
- UI shows "Switching demo account..." loader indefinitely
- Transition state remains active even after auth.me resolves
- ProtectedRoute blocks rendering because `isDemoTransitionActive()` returns true

**Root Causes Identified:**
1. **No fail-safe timeout**: If `clearDemoTransition()` is never called (exception, early return, etc.), transition stays active forever
2. **Transition cleared before auth.me resolves**: If transition clears but auth.me is still fetching, ProtectedRoute shows loader, but if auth.me hangs, loader never clears
3. **No timeout on auth.me query**: If auth.me query hangs (network issue, server slow), it waits for TRPC's 30s timeout, causing long hang

### Secondary Issue (Bucket C): Cookie Race Condition

**Symptoms:**
- demoLogin sets cookie, but auth.me returns old user or null
- Cookie not applied before auth.me request fires

**Root Causes:**
- Browser cookie propagation delay (cookie set in demoLogin response, but not yet available for next request)
- No retry logic with delay to account for cookie propagation

## Fixes Applied

### 1. Added Fail-Safe Timeout (Bucket D Fix)
**File:** `client/src/pages/Login.tsx`
- Added 5-second fail-safe timeout that auto-clears transition if not cleared manually
- Ensures transition ALWAYS ends, preventing infinite hang
- Timeout is cleared in `finally` block if transition clears normally

### 2. Added auth.me Query Timeout (Bucket D Fix)
**File:** `client/src/pages/Login.tsx`
- Added 3-second timeout wrapper around auth.me query
- If timeout occurs, retries once without timeout (lets TRPC handle it)
- Prevents infinite hang if auth.me query stalls

### 3. Enhanced Cookie Race Handling (Bucket C Fix)
**File:** `client/src/pages/Login.tsx`
- Existing 150ms retry logic enhanced with timeout protection
- Retry also has 2-second timeout to prevent hang
- Verifies transition ID before retry to prevent stale overwrites

### 4. Comprehensive DEV-Only Instrumentation
**Files:** 
- `client/src/pages/Login.tsx` - Structured logging at each step
- `client/src/_core/hooks/useAuth.ts` - Log auth.me resolution
- `server/routers.ts` - Log cookie options and auth.me query

**Log Tags:**
- `[DEMO_SWITCH] start` - Transition started
- `[DEMO_SWITCH] demoLogin success` - demoLogin mutation succeeded
- `[DEMO_SWITCH] me refetch #1` - First auth.me refetch result
- `[DEMO_SWITCH] mismatch -> retry scheduled` - User mismatch detected
- `[DEMO_SWITCH] me refetch #2` - Retry refetch result
- `[DEMO_SWITCH] done (navigating)` - Success, navigating
- `[DEMO_SWITCH] finally (clearing transition)` - Always executed
- `[DEMO_LOGIN] cookie set` - Server cookie set with options
- `[AUTH_ME] query` - Server auth.me query with cookie status
- `[AUTH_ME] resolved` - Client auth.me resolution

### 5. Verified Cookie/Origin Invariants (Bucket B Prevention)
**Findings:**
- ✅ TRPC client uses relative URL `/api/trpc` (auto-uses current origin)
- ✅ `credentials: "include"` is set in TRPC fetch
- ✅ Cookie options are correct for DEV: `secure: false`, `sameSite: "lax"`, `path: "/"`, `domain: undefined`
- ✅ `getLoginUrl()` uses `window.location.origin` dynamically (handles port 3000 → 3001)

## Bucket Classification

**Primary Bucket: D** - UI stuck in transition
- Transition not clearing due to missing fail-safe timeout
- auth.me query hanging without timeout protection

**Secondary Bucket: C** - Cookie race condition
- Cookie propagation delay causing user mismatch
- Mitigated by retry logic with 150ms delay

## Files Changed

1. **client/src/pages/Login.tsx**
   - Added structured logging at each step
   - Added fail-safe timeout (5s) to auto-clear transition
   - Added timeout protection (3s) for auth.me query
   - Added timeout protection (2s) for retry query
   - Enhanced transition ID verification

2. **client/src/_core/hooks/useAuth.ts**
   - Enhanced auth.me resolution logging
   - Added query status logging (isFetching, isLoading, isRefetching)

3. **server/routers.ts**
   - Enhanced demoLogin cookie logging (full cookie options)
   - Enhanced auth.me query logging (cookie presence, user details)

## Verification Checklist

After fix, verify:

- [ ] `pnpm -s check` passes
- [ ] Start `pnpm run dev:full` with port 3000 busy → server uses 3001 → app loads
- [ ] Click demo Farmer → dashboard loads within 1-2s
- [ ] Click demo Manager immediately → role/menu changes, no hang
- [ ] Rapidly switch 3 times → app ends on last selected account, no stuck loader
- [ ] Network tab shows:
  - [ ] `auth.demoLogin` returns 200 with `Set-Cookie` header
  - [ ] Subsequent `auth.me` request includes `Cookie` header
  - [ ] `auth.me` response reflects new user role
- [ ] Console logs show:
  - [ ] `[DEMO_SWITCH] start` → `[DEMO_SWITCH] done` sequence
  - [ ] `[DEMO_LOGIN] cookie set` with correct cookie options
  - [ ] `[AUTH_ME] query` shows `hasCookie: true` after demoLogin
  - [ ] `[DEMO_SWITCH] finally` always executes
- [ ] No redirect loops
- [ ] No flicker during account switching
- [ ] Transition always clears (check `isDemoTransitionActive()` returns false after switch)

## Expected Console Output (DEV)

When switching demo accounts, you should see:

```
[DEMO_SWITCH] start { transitionId: 1, currentTransitionId: 1, username: "manager", ... }
[DEMO_LOGIN] cookie set { role: "manager", cookieOptions: { httpOnly: true, secure: false, sameSite: "lax", ... } }
[DEMO_SWITCH] demoLogin success { transitionId: 1, demoUser: { id: 0, role: "manager", ... } }
[AUTH_ME] query { hasCookie: true, cookiePresent: "yes", userRole: "manager", ... }
[DEMO_SWITCH] me refetch #1 { transitionId: 1, returnedUser: { id: 0, role: "manager", ... }, matches: true }
[DEMO_SWITCH] done (navigating) { transitionId: 1, redirectTo: "/", ... }
[DEMO_SWITCH] finally (clearing transition) { transitionId: 1 }
[AUTH_ME] resolved { userId: 0, userRole: "manager", isFetching: false, ... }
```

If hang occurs, logs will show where it stops, allowing precise diagnosis.
