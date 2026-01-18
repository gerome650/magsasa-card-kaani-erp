# Fix Pepoy Studio Compilation - Manual Steps

## Summary of Changes

1. **Fix Set iteration** in `riskCalculator.ts` (ES5 compatibility)
2. **Disable geminiService.ts** (rename to `.disabled.ts` to prevent compilation)
3. **Update barrel export** in `index.ts` (only export riskCalculator, no Gemini/UI)

---

## Step-by-Step Fix Commands

### Step 1: Fix Set iteration in riskCalculator.ts

```bash
cd /Users/palawan/Documents/Development/MAGSASA-CARD-ERP/MAGSASA-CARD-ERP/magsasa-card-kaani-erp

# Open the file
nano server/src/features/kaani/pepoystudio/studio_app/services/riskCalculator.ts
```

**Find this line:**
```typescript
const allSystems = [...new Set(CROP_BENCHMARKS.map(b => b.farmingSystemOrVariety))]
```

**Replace with:**
```typescript
const allSystems = Array.from(
  new Set(CROP_BENCHMARKS.map(b => b.farmingSystemOrVariety))
);
```

**Or use sed (one-liner):**
```bash
# Backup first
cp server/src/features/kaani/pepoystudio/studio_app/services/riskCalculator.ts \
   server/src/features/kaani/pepoystudio/studio_app/services/riskCalculator.ts.bak

# Fix the line (macOS sed syntax)
sed -i '' 's/const allSystems = \[\.\.\.new Set(CROP_BENCHMARKS\.map(b => b\.farmingSystemOrVariety))\]/const allSystems = Array.from(\n  new Set(CROP_BENCHMARKS.map(b => b.farmingSystemOrVariety))\n);/g' \
  server/src/features/kaani/pepoystudio/studio_app/services/riskCalculator.ts
```

### Step 2: Disable geminiService.ts

```bash
# Rename to prevent TypeScript from compiling it
mv server/src/features/kaani/pepoystudio/studio_app/services/geminiService.ts \
   server/src/features/kaani/pepoystudio/studio_app/services/geminiService.disabled.ts
```

### Step 3: Verify index.ts (already updated)

The `index.ts` has been updated to only export from riskCalculator:
```typescript
export * from "./studio_app/services/riskCalculator";
```

**Verify it's correct:**
```bash
cat server/src/features/kaani/pepoystudio/index.ts
```

Should show:
```typescript
/**
 * Pepoy Studio KaAni Logic
 * 
 * Staged import from Google AI Studio export.
 * No runtime wiring - isolated package.
 */

export * from "./studio_app/services/riskCalculator";
```

### Step 4: Run TypeScript check

```bash
pnpm check
```

Should pass with no errors.

---

## Git Commands (After Fixes)

```bash
# Stage only pepoystudio folder
git add server/src/features/kaani/pepoystudio/

# Verify what will be committed
git status

# Commit
git commit -m "chore(kaani): stage Pepoy AI Studio risk logic (compile-safe, no runtime wiring)

- Fix Set iteration in riskCalculator.ts (use Array.from for ES5 compatibility)
- Disable geminiService.ts (rename to .disabled.ts) to prevent @google/genai import errors
- Update barrel export to only export riskCalculator (no Gemini/UI components)
- No runtime wiring - isolated staged package"

# Do NOT push yet (as requested)
```

---

## Verification Checklist

- [ ] `pnpm check` passes with no errors
- [ ] `riskCalculator.ts` uses `Array.from(new Set(...))` not `[...new Set(...)]`
- [ ] `geminiService.ts` renamed to `geminiService.disabled.ts`
- [ ] `index.ts` only exports from `./studio_app/services/riskCalculator`
- [ ] `git status` shows only `server/src/features/kaani/pepoystudio/` changes

---

## Troubleshooting

**If `pnpm check` still fails:**

1. **Check for other Set spread operators:**
   ```bash
   grep -r "\[\.\.\.new Set" server/src/features/kaani/pepoystudio/
   ```
   Fix any found instances.

2. **Check for other @google/genai imports:**
   ```bash
   grep -r "@google/genai" server/src/features/kaani/pepoystudio/
   ```
   Rename any files that import it to `.disabled.ts`

3. **Check index.ts exports:**
   ```bash
   cat server/src/features/kaani/pepoystudio/index.ts
   ```
   Ensure it only exports from riskCalculator.
