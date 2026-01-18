# Pepoy Studio AI Import (Staged)

## What's Here

Google AI Studio export from Pepoy's KaAni app:
- `studio_app/services/riskCalculator.ts` - Baseline risk score calculations
- `studio_app/data/cropBenchmarks.ts` - Crop benchmark data
- `studio_app/data/weatherStations.ts` - Weather station data
- `studio_app/services/geminiService.disabled.ts` - Disabled (see below)

## Current Status

✅ **Compile-safe**: TypeScript compiles without errors  
✅ **Staged**: Imported but NOT wired into runtime  
❌ **Not integrated**: No production imports from this folder yet

## Why `geminiService` is Disabled

**File:** `studio_app/services/geminiService.disabled.ts`

- Imports `@google/genai` (not installed in repo)
- Renamed to `.disabled.ts` so TypeScript skips compilation
- Source preserved for later integration

## How to Re-Enable Later

### Option A: Install Missing Dependency
```bash
pnpm add @google/genai
mv studio_app/services/geminiService.disabled.ts studio_app/services/geminiService.ts
```

### Option B: Adapt to Existing Integration (Recommended)
- This repo uses `@google/generative-ai` (see `server/ai/kaaniAgent.ts`)
- Create adapter using existing integration
- Replace `@google/genai` imports with `@google/generative-ai`

**Recommendation:** Use Option B for consistency.

## How to Use Right Now

```typescript
import { 
  calculateBaselineRiskScore,
  type RiskScoreInput,
  type RiskScoreResult 
} from './features/kaani/pepoystudio';
```

**Note:** Staged code only - do not import into production flows yet.

## Guardrails

⚠️ **No schema changes**: Do not modify database schemas  
⚠️ **No runtime wiring**: Do not import in production code yet  
⚠️ **No dependency additions**: Keep dependencies unchanged for demo  
⚠️ **Isolated package**: Do not affect existing KaAni architecture

## Next Steps

1. Review `riskCalculator.ts` logic
2. Test calculations in isolation
3. Plan integration (adapt to existing Gemini setup)
4. Wire into runtime after testing (separate PR)
