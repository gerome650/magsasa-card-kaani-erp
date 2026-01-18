# Demo Runthrough Checklist - MAGSASA-CARD KaAni ERP

**Date:** Demo Day  
**Branch:** `chore/pepoystudio-scaffold` (or merged into main)

---

## Pre-Demo Setup

### Mode Selection

**Note:** Use `pnpm run dev:lite` (not `pnpm dev:lite`) because pnpm shorthand can fail with colon-separated script names.

**Env Var Fallbacks:** 
- `VITE_APP_TITLE` and `VITE_APP_LOGO` have safe defaults (`MAGSASA-CARD` and `/sunray-logo.png`) if not set
- `OAUTH_SERVER_URL` and `DATABASE_URL` are optional in dev mode - demo auth works without them
- No `.env` file required for demo (all env vars have safe fallbacks)

**Demo Cookie Behavior (DEV only):**
- When `demoLogin` succeeds, server sets session cookie (`app_session_id`)
- Client auth checks for this cookie in DEV mode before redirecting
- If cookie exists but `auth.me` query fails/slow, app stays authenticated (prevents flicker)
- To debug auth issues: Check browser console for `[Auth] DEV:` logs showing cookie presence and `auth.me` status

**Lite Mode (AO Demo):**
```bash
pnpm run dev:lite
```
- Sets `VITE_APP_MODE=lite`
- Reduced navigation (4 items)
- Root `/` redirects to `/kaani`

**Full Mode (Manager/Farmer Demo):**
```bash
pnpm run dev:full
```
- Does not set `VITE_APP_MODE` (Full Mode is default)
- Full navigation menu
- Full dashboard access

**Verify Mode:**
- Check sidebar footer (DEV only): Should show "App Mode: Lite" or "App Mode: Full"
- Console (DEV only): `[App] Lite Mode: ACTIVE/INACTIVE`

---

## 1. AO Demo (Lite Mode)

### Setup
- [ ] Start server: `pnpm run dev:lite`
- [ ] Navigate to: `http://localhost:5173` (or configured port)
- [ ] Verify: Redirects to `/kaani`
- [ ] Verify sidebar: Shows only 4 items (Ask KaAni, Inputs Marketplace, Price Comparison, Map View)

### Happy Path Flow
- [ ] **Step 1: Open KaAni**
  - Navigate to `/kaani` (or root `/` if Lite Mode)
  - **Expected:** KaAni chat interface loads
  - **Verify:** No "Loan Officer / Farmer" toggle visible (AO mode)

- [ ] **Step 2: Click Starter Prompt**
  - Click any starter prompt (e.g., "Analyze farmer risk profile")
  - **Expected:** Message sent, KaAni response appears
  - **Verify Console:** No Zod errors

- [ ] **Step 3: Verify Underwriting Summary**
  - Scroll down after KaAni response
  - **Expected:** "Underwriting Summary (AO Copy/Paste)" panel visible
  - **Expected:** AO metadata inputs (Branch, Center, Member Name)
  - Click "Copy Summary"
  - **Expected:** Success toast "Underwriting summary copied"
  - **Verify:** Clipboard contains formatted summary text

- [ ] **Step 4: Approve & Proceed**
  - Click "Approve & Proceed to Inputs" button (below assistant message)
  - **Expected:** Redirects to `/order-calculator`
  - **Expected:** "Approved: ₱[amount]" badge in header (if amount extracted)

- [ ] **Step 5: Optional - Price Comparison**
  - Click "Price Comparison" in sidebar
  - **Expected:** Price comparison page loads

- [ ] **Step 6: Optional - Map View**
  - Click "Map View" in sidebar
  - **If API key missing:** Clean fallback card "Map temporarily unavailable"
  - **If API key present:** Map loads with farm markers

### Demo Safety Check
- [ ] No Batch Orders nav item visible
- [ ] No console errors (check Network + Console tabs)
- [ ] No Zod "invalid option" errors
- [ ] All routes accessible (no 404s)

---

## 2. Manager Demo (Full Mode)

### Setup
- [ ] Start server: `pnpm run dev:full`
- [ ] Navigate to: `http://localhost:5173`
- [ ] Login: Select "Manager - Roberto Garcia" demo account
- [ ] **Verify:** `localStorage.demo_role_override === "manager"` (DevTools)

### Happy Path Flow
- [ ] **Step 1: Dashboard**
  - Navigate to `/` (root)
  - **Expected:** "Farm Management Dashboard" with global metrics
  - **Expected:** Cross-farm charts, 4977 farms metric, etc.
  - **Verify:** NOT "My Farm Dashboard"

- [ ] **Step 2: Navigate to KaAni**
  - Click "Ask KaAni" in sidebar (or `/erp/kaani`)
  - **Expected:** KaAni chat interface loads
  - **Expected:** "Loan Officer / Farmer" audience toggle visible
  - **Expected:** "Back to Dashboard" button visible

- [ ] **Step 3: Test Audience Toggle**
  - Toggle between "Loan Officer" and "Farmer"
  - **Expected:** Toggle works, starter prompts update
  - **Verify:** No Zod errors when switching

- [ ] **Step 4: Send Starter Prompt**
  - Click starter prompt (e.g., "Analyze farmer risk profile")
  - **Expected:** Message sent, response appears
  - **Verify Console:** No errors

- [ ] **Step 5: Copy Underwriting Summary**
  - After response, scroll to "Underwriting Summary" panel
  - Fill in AO metadata (Branch, Center, Member Name)
  - Click "Copy Summary"
  - **Expected:** Success toast, clipboard populated

- [ ] **Step 6: Approve & Proceed**
  - Click "Approve & Proceed to Inputs"
  - **Expected:** Redirects to `/order-calculator`
  - **Expected:** Approved budget badge in header

- [ ] **Step 7: Test Free-text Chat**
  - Type message: "What crops grow in Laguna?"
  - Click Send
  - **Expected:** Message sent, response appears
  - **Verify:** No Zod errors

### Demo Safety Check
- [ ] Dashboard shows global metrics (not scoped)
- [ ] Audience toggle visible and functional
- [ ] All routes accessible
- [ ] No console errors

---

## 3. Farmer Demo (Full Mode)

### Setup
- [ ] Start server: `pnpm run dev:full`
- [ ] **Logout** if logged in as Manager
- [ ] Login: Select "Farmer - Juan dela Cruz" demo account
- [ ] **Verify:** `localStorage.demo_role_override === "farmer"` (DevTools)

### Happy Path Flow
- [ ] **Step 1: Farmer Dashboard**
  - Navigate to `/` (root)
  - **Expected:** "My Farm Dashboard" title
  - **Expected:** Four cards: "My Farm", "Crop", "Area", "Status"
  - **Expected:** "My Activity" section with empty states
  - **Verify:** NO global metrics (no "4977 farms", no cross-farm charts)
  - **Verify Console:** `[auth] demo_role_override=farmer normalized=farmer`

- [ ] **Step 2: Navigate to KaAni**
  - Click "Ask KaAni" in sidebar (or `/kaani` or `/erp/kaani`)
  - **Expected:** KaAni chat interface loads
  - **Expected:** NO "Loan Officer / Farmer" toggle visible
  - **Expected:** Only Dialect toggle visible
  - **Expected:** "Back" or "Home" button visible

- [ ] **Step 3: Test Starter Prompt**
  - Click any starter prompt
  - **Expected:** Message sent, response appears
  - **Verify Console:** No Zod errors, no "invalid option" errors
  - **Verify Network:** Request payload has `audience: "farmer"` (if visible)

- [ ] **Step 4: Test Free-text Chat**
  - Type message
  - Click Send
  - **Expected:** Message sent, response appears
  - **Verify:** No Zod errors
  - **Verify:** All messages sent with `audience: "farmer"`

- [ ] **Step 5: Verify No Audience Toggle**
  - **Expected:** Cannot switch to "Loan Officer" mode
  - **Expected:** All interactions use farmer mode only

### Demo Safety Check
- [ ] Dashboard is scoped (no global metrics)
- [ ] KaAni has NO audience toggle
- [ ] All messages use `audience: "farmer"`
- [ ] No Zod errors
- [ ] No console errors

---

## Demo Safety Checklist (P0/P1)

### P0 - Demo Blockers (Must Work)

- [ ] **No dead nav links**
  - Batch Orders hidden (unless `VITE_BATCH_ORDERS_ENABLED=true`)
  - All visible nav items lead to working pages

- [ ] **No Zod errors**
  - Starter prompts work without errors
  - Free-text chat works without errors
  - Audience normalization works (snake_case values only)

- [ ] **Role override works**
  - `localStorage.demo_role_override` persists after login
  - Farmer sees scoped dashboard
  - Manager sees global dashboard
  - Farmer sees NO audience toggle in KaAni

- [ ] **Map view graceful**
  - If API key missing: Clean fallback card (no DEV warnings)
  - If API key present: Map loads

### P1 - Demo Polish (Should Work)

- [ ] **Lite Mode routes correctly**
  - Root `/` redirects to `/kaani` in Lite Mode
  - Only 4 nav items visible in Lite Mode
  - Unknown routes redirect to `/kaani`

- [ ] **Back/Home buttons visible**
  - KaAni page shows Back/Home button
  - Button routes correctly (Lite: `/kaani`, Full: `/`)

- [ ] **Underwriting Summary functional**
  - Panel appears after KaAni response
  - Copy button works (clipboard populated)
  - Success toast appears

---

## Troubleshooting Quick Fixes

### Issue: "Invalid option" Zod error

**Cause:** Audience value not normalized to snake_case.

**Fix:**
- Check console for actual value sent
- Verify `normalizeAudience()` is called on all audience values
- Ensure `effectiveAudience` is used for all mutations

### Issue: Farmer sees global dashboard

**Cause:** `normalizeRole()` not detecting farmer.

**Fix:**
```bash
# Check localStorage
localStorage.getItem("demo_role_override")  # Should be "farmer"

# Check console logs
# Should see: [auth] demo_role_override=farmer normalized=farmer
```

### Issue: KaAni shows audience toggle for farmer

**Cause:** `isFarmer` check not working.

**Fix:**
- Verify `normalizeRole(user) === "farmer"` is true
- Check `effectiveAudience` is forced to "farmer" for farmers
- Ensure toggle is hidden: `{!isFarmer && <KaAniAudienceToggle .../>}`

### Issue: Map shows DEV warning box

**Cause:** Error state not using clean fallback.

**Fix:**
- Verify `Map.tsx` error state renders clean card
- Check no `import.meta.env.DEV` conditional for error UI
- Console diagnostics OK in DEV, but UI should be clean

### Issue: Batch Orders visible in nav

**Cause:** Feature flag not set correctly.

**Fix:**
```bash
# Check environment
echo $VITE_BATCH_ORDERS_ENABLED  # Should be unset or not "true"

# In code: item only shows if VITE_BATCH_ORDERS_ENABLED === 'true'
```

### Issue: Lite Mode not activating

**Cause:** Environment variable not set.

**Fix:**
```bash
# Verify script
pnpm run dev:lite  # Should set VITE_APP_MODE=lite

# Check console
# Should see: [App] Lite Mode: ACTIVE

# Check sidebar
# Should show: App Mode: Lite (DEV only)
```

### Issue: Cannot access /farmers in Lite Mode

**Cause:** Route correctly gated.

**Fix:**
- This is expected behavior in Lite Mode
- Non-lite routes should redirect to `/kaani`
- If needed for demo, temporarily set `VITE_APP_MODE=full`

---

## Quick Command Reference

```bash
# Start servers (use 'pnpm run' for colon-separated script names)
pnpm run dev:lite    # Lite Mode (AO demo)
pnpm run dev:full    # Full Mode (Manager/Farmer demo)

# Verification
pnpm check       # TypeScript compilation
git status       # Check uncommitted changes

# Clear demo state (if needed)
localStorage.clear()  # In browser DevTools Console
```

---

## Demo Flow Summary

### AO (Lite Mode)
1. `/kaani` → Starter prompt → Underwriting Summary → Copy → Approve → `/order-calculator`
2. Optional: Price Comparison, Map View

### Manager (Full Mode)
1. `/` (Dashboard) → `/erp/kaani` → Toggle audience → Starter prompt → Copy → Approve → `/order-calculator`

### Farmer (Full Mode)
1. `/` (My Farm Dashboard) → `/kaani` (NO toggle) → Starter prompt → Response (farmer mode only)
