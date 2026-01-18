# Repo Setup + Pepoy Studio Import Guide

## Overview
- Rename existing folder (preserve imports/)
- Clone repo from GitHub
- Copy imports to proper structure
- Create branch and commit

---

## Step-by-Step Commands

### Step 1: Navigate to Projects directory
```bash
cd /Users/palawan/Projects
```

### Step 2: Rename existing folder (preserve your imports)
```bash
mv magsasa-card-kaani-erp magsasa-card-kaani-erp-old-imports
```

**Note:** Your old folder (with imports/) will now be at:
**`/Users/palawan/Projects/magsasa-card-kaani-erp-old-imports`**

### Step 3: Clone the repository
```bash
git clone https://github.com/gerome650/magsasa-card-kaani-erp.git
```

### Step 4: Navigate into cloned repo
```bash
cd magsasa-card-kaani-erp
```

### Step 5: Copy imports to proper structure
```bash
# Create target directory structure
mkdir -p server/src/features/kaani/pepoystudio/data
mkdir -p server/src/features/kaani/pepoystudio/services
mkdir -p server/src/features/kaani/pepoystudio/agent

# Copy files from old folder
# Copy riskCalculator.ts (if it's in services/)
if [ -f ../magsasa-card-kaani-erp-old-imports/imports/services/riskCalculator.ts ]; then
  cp ../magsasa-card-kaani-erp-old-imports/imports/services/riskCalculator.ts server/src/features/kaani/pepoystudio/riskCalculator.ts
fi

# Copy data files
if [ -f ../magsasa-card-kaani-erp-old-imports/imports/data/cropBenchmarks.ts ]; then
  cp ../magsasa-card-kaani-erp-old-imports/imports/data/cropBenchmarks.ts server/src/features/kaani/pepoystudio/data/cropBenchmarks.ts
fi

if [ -f ../magsasa-card-kaani-erp-old-imports/imports/data/weatherStations.ts ]; then
  cp ../magsasa-card-kaani-erp-old-imports/imports/data/weatherStations.ts server/src/features/kaani/pepoystudio/data/weatherStations.ts
fi

# Copy types.ts if it exists (for types only)
if [ -f ../magsasa-card-kaani-erp-old-imports/imports/types.ts ]; then
  cp ../magsasa-card-kaani-erp-old-imports/imports/types.ts server/src/features/kaani/pepoystudio/types.ts
fi

# Copy any agent files if they exist
if [ -d ../magsasa-card-kaani-erp-old-imports/imports/agent ]; then
  cp -r ../magsasa-card-kaani-erp-old-imports/imports/agent/* server/src/features/kaani/pepoystudio/agent/ 2>/dev/null || true
fi

# Copy any other service files
if [ -d ../magsasa-card-kaani-erp-old-imports/imports/services ]; then
  for file in ../magsasa-card-kaani-erp-old-imports/imports/services/*.ts; do
    if [ -f "$file" ] && [ "$(basename "$file")" != "riskCalculator.ts" ]; then
      cp "$file" server/src/features/kaani/pepoystudio/services/
    fi
  done
fi
```

**Alternative: Manual copy (safer, shows what exists)**
```bash
# First, check what's in your old imports folder
ls -la ../magsasa-card-kaani-erp-old-imports/imports/

# Then copy files manually based on what you see
# Example if structure matches:
cp ../magsasa-card-kaani-erp-old-imports/imports/services/riskCalculator.ts server/src/features/kaani/pepoystudio/
cp ../magsasa-card-kaani-erp-old-imports/imports/data/cropBenchmarks.ts server/src/features/kaani/pepoystudio/data/
cp ../magsasa-card-kaani-erp-old-imports/imports/data/weatherStations.ts server/src/features/kaani/pepoystudio/data/
```

### Step 6: Fix imports in riskCalculator.ts (if needed)
```bash
# Edit riskCalculator.ts to fix relative imports
# Change: import { ... } from '../data/weatherStations'
# To:     import { ... } from './data/weatherStations'
# Change: import { ... } from '../data/cropBenchmarks'  
# To:     import { ... } from './data/cropBenchmarks'
```

You may need to manually edit `server/src/features/kaani/pepoystudio/riskCalculator.ts` to fix import paths.

### Step 7: Create barrel export (index.ts)
```bash
cat > server/src/features/kaani/pepoystudio/index.ts << 'EOF'
/**
 * Pepoy Studio KaAni Logic
 * 
 * Barrel export for Pepoy's Google AI Studio KaAni risk calculation logic.
 * Staged import - no runtime wiring yet.
 */

export {
  calculateBaselineRiskScore,
  type RiskScoreInput,
  type RiskScoreResult,
  type HarvestScoreResult,
  type ClimateType,
  CLIMATE_TYPE_DESCRIPTIONS,
} from './riskCalculator';

export {
  type CropBenchmark,
  cropBenchmarks,
} from './data/cropBenchmarks';

export {
  type WeatherStation,
  weatherStations,
} from './data/weatherStations';
EOF
```

(Adjust exports based on what's actually exported from your files)

### Step 8: Install dependencies
```bash
pnpm install
```

### Step 9: Run type check
```bash
pnpm check
```

**If there are errors:**
- Fix import paths in copied files
- Ensure all type exports are correct
- Check that relative paths match folder structure

### Step 10: Create branch
```bash
git checkout -b chore/pepoystudio-scaffold
```

### Step 11: Stage and commit
```bash
# Check what files were added
git status

# Stage only the new pepoystudio files
git add server/src/features/kaani/pepoystudio/

# Verify what will be committed
git status

# Commit
git commit -m "chore: import Pepoy Studio KaAni logic (staged, no runtime wiring)

- Import riskCalculator.ts from Google AI Studio export
- Import cropBenchmarks.ts and weatherStations.ts data files
- Add barrel export (index.ts) for staged module
- No runtime wiring yet - staged import only
- Fix relative imports to match new folder structure"

# Push branch (if remote is set up)
git push -u origin chore/pepoystudio-scaffold
```

---

## Quick Verification Checklist

### ✅ Before Committing:
- [ ] `pnpm check` passes (no TypeScript errors)
- [ ] All files copied to `server/src/features/kaani/pepoystudio/`
- [ ] Import paths in `riskCalculator.ts` are correct (use `./data/` not `../data/`)
- [ ] `index.ts` exports match actual exports from files

### ✅ After Committing:
- [ ] `git status` shows clean working tree (or only expected changes)
- [ ] `git log -1` shows your commit message
- [ ] Branch exists: `git branch` shows `chore/pepoystudio-scaffold`

### ✅ Verify Old Imports Preserved:
```bash
ls -la /Users/palawan/Projects/magsasa-card-kaani-erp-old-imports/imports/
```
Should show your original files still there.

---

## File Locations Summary

**Old location (preserved):**
- `/Users/palawan/Projects/magsasa-card-kaani-erp-old-imports/imports/`

**New location (in repo):**
- `server/src/features/kaani/pepoystudio/riskCalculator.ts`
- `server/src/features/kaani/pepoystudio/data/cropBenchmarks.ts`
- `server/src/features/kaani/pepoystudio/data/weatherStations.ts`
- `server/src/features/kaani/pepoystudio/index.ts` (barrel export)

---

## Troubleshooting

**If `pnpm check` fails:**
1. Check import paths in `riskCalculator.ts` - they should be `./data/...` not `../data/...`
2. Ensure all types are exported correctly
3. Check that file extensions match (`.ts` vs `.tsx`)

**If files don't copy:**
1. Verify old folder name: `ls /Users/palawan/Projects/magsasa-card-kaani-erp-old-imports/`
2. Check import files exist: `ls /Users/palawan/Projects/magsasa-card-kaani-erp-old-imports/imports/`
3. Use manual copy if automated script fails

**If git clone fails:**
- Ensure old folder was renamed: `ls /Users/palawan/Projects/ | grep magsasa`
- Should see `magsasa-card-kaani-erp-old-imports` but NOT `magsasa-card-kaani-erp`

---

## Next Steps (After Import)

Once committed, you can:
1. Test import: `import { calculateBaselineRiskScore } from './features/kaani/pepoystudio'`
2. Wire into runtime when ready (separate PR)
3. Keep old folder as backup until import is verified
