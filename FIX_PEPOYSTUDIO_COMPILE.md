# Fix Pepoy Studio Compilation Issues

## Overview
Fix TypeScript compilation errors in imported Pepoy AI Studio export.

## Files to Fix

### 1. Fix Set iteration in riskCalculator.ts

**File:** `server/src/features/kaani/pepoystudio/studio_app/services/riskCalculator.ts`

**Find:**
```typescript
const allSystems = [...new Set(CROP_BENCHMARKS.map(b => b.farmingSystemOrVariety))]
```

**Replace with:**
```typescript
const allSystems = Array.from(
  new Set(CROP_BENCHMARKS.map(b => b.farmingSystemOrVariety))
);
```

### 2. Disable geminiService.ts

**Rename:**
```bash
mv server/src/features/kaani/pepoystudio/studio_app/services/geminiService.ts \
   server/src/features/kaani/pepoystudio/studio_app/services/geminiService.disabled.ts
```

### 3. Update barrel export

**File:** `server/src/features/kaani/pepoystudio/index.ts`

**Replace contents with:**
```typescript
/**
 * Pepoy Studio KaAni Logic
 * 
 * Staged import from Google AI Studio export.
 * No runtime wiring - isolated package.
 */

export * from "./studio_app/services/riskCalculator";
```
