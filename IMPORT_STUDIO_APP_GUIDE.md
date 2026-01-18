# Import Pepoy Studio AI Studio App - Step-by-Step Guide

## Overview
- Rename non-git folder (preserve imports)
- Clone real repo
- Copy AI Studio export to `server/src/features/kaani/pepoystudio/studio_app/`
- Fix imports and verify
- Commit to branch

---

## Step-by-Step Commands

### Step 1: Navigate to Projects directory
```bash
cd /Users/palawan/Projects
```

### Step 2: Verify current folder structure
```bash
# Check what's in the current folder
ls -la magsasa-card-kaani-erp/imports/

# Verify it's NOT a git repo (should fail or show nothing)
test -d magsasa-card-kaani-erp/.git && echo "ERROR: Already a git repo!" || echo "OK: Not a git repo"
```

### Step 3: Rename existing folder (preserves your imports)
```bash
mv magsasa-card-kaani-erp magsasa-card-kaani-erp-old-imports
```

**Your old imports are now at:**
`/Users/palawan/Projects/magsasa-card-kaani-erp-old-imports/imports/`

### Step 4: Clone the real repository
```bash
git clone https://github.com/gerome650/magsasa-card-kaani-erp.git
```

### Step 5: Enter the cloned repo
```bash
cd magsasa-card-kaani-erp
```

### Step 6: Create branch
```bash
git checkout -b chore/pepoystudio-scaffold
```

### Step 7: Create target directory structure
```bash
mkdir -p server/src/features/kaani/pepoystudio/studio_app
```

### Step 8: Copy AI Studio export (entire imports folder structure)
```bash
# Copy entire imports/ folder structure to studio_app/
cp -r ../magsasa-card-kaani-erp-old-imports/imports/* server/src/features/kaani/pepoystudio/studio_app/
```

**Alternative (if you want to preserve folder structure exactly):**
```bash
# Copy keeping the imports/ structure
cp -r ../magsasa-card-kaani-erp-old-imports/imports server/src/features/kaani/pepoystudio/studio_app/imports
```

**Or flatten to studio_app/ directly (recommended):**
```bash
# Copy files directly into studio_app/ (flatten structure)
cp -r ../magsasa-card-kaani-erp-old-imports/imports/services server/src/features/kaani/pepoystudio/studio_app/
cp -r ../magsasa-card-kaani-erp-old-imports/imports/data server/src/features/kaani/pepoystudio/studio_app/
cp -r ../magsasa-card-kaani-erp-old-imports/imports/agent server/src/features/kaani/pepoystudio/studio_app/ 2>/dev/null || true
cp ../magsasa-card-kaani-erp-old-imports/imports/types.ts server/src/features/kaani/pepoystudio/studio_app/ 2>/dev/null || true
```

### Step 9: Verify files copied
```bash
# Check what was copied
ls -la server/src/features/kaani/pepoystudio/studio_app/

# Should see: services/, data/, and possibly agent/, types.ts
```

### Step 10: Install dependencies
```bash
pnpm install
```

### Step 11: Run TypeScript check
```bash
pnpm check
```

### Step 12: Fix import paths (if pnpm check fails)

**If errors in `studio_app/services/riskCalculator.ts`:**

```bash
# Edit the file (you'll need to adjust paths based on actual structure)
# If files are in studio_app/services/ and studio_app/data/, fix relative imports:

# Option A: Use nano/vi
nano server/src/features/kaani/pepoystudio/studio_app/services/riskCalculator.ts

# Option B: Use sed to fix common patterns (adjust as needed)
# Change '../data/...' to '../data/...' (if structure matches)
# Change '../../data/...' to '../data/...' if riskCalculator is in services/
```

**Common fixes needed:**
- `import { ... } from '../data/weatherStations'` → `import { ... } from '../data/weatherStations'` (if data/ is sibling to services/)
- `import { ... } from '../../data/weatherStations'` → `import { ... } from '../data/weatherStations'` (if riskCalculator is one level deeper)

**If structure is:**
```
studio_app/
  services/
    riskCalculator.ts
  data/
    weatherStations.ts
    cropBenchmarks.ts
```
Then imports in `riskCalculator.ts` should be: `'../data/weatherStations'`

### Step 13: Create barrel export (index.ts)
```bash
cat > server/src/features/kaani/pepoystudio/index.ts << 'EOF'
/**
 * Pepoy Studio KaAni Logic
 * 
 * Staged import from Google AI Studio export.
 * No runtime wiring - isolated package.
 */

// Export from studio_app services
export {
  calculateBaselineRiskScore,
  type RiskScoreInput,
  type RiskScoreResult,
  type HarvestScoreResult,
  type ClimateType,
  CLIMATE_TYPE_DESCRIPTIONS,
} from './studio_app/services/riskCalculator';

// Export data if needed
export {
  type CropBenchmark,
  cropBenchmarks,
} from './studio_app/data/cropBenchmarks';

export {
  type WeatherStation,
  weatherStations,
} from './studio_app/data/weatherStations';
EOF
```

**Note:** Adjust exports based on what's actually exported from your files.

### Step 14: Re-run typecheck
```bash
pnpm check
```

**If still errors:**
- Check actual export names in the copied files
- Ensure all types are exported
- Fix any remaining import path issues

### Step 15: Verify only pepoystudio folder will be committed
```bash
# Check what git sees
git status

# Should only show:
# ?? server/src/features/kaani/pepoystudio/
```

### Step 16: Stage and commit
```bash
# Stage only the pepoystudio folder
git add server/src/features/kaani/pepoystudio/

# Verify what will be committed
git status

# Commit
git commit -m "chore: import Pepoy Studio AI Studio app (staged, no runtime wiring)

- Import entire AI Studio export to server/src/features/kaani/pepoystudio/studio_app/
- Includes services/riskCalculator.ts, data/ files, and related modules
- Add barrel export (index.ts) for staged access
- No runtime integration - isolated staged package
- Fix relative imports to match new folder structure"

# Push branch (if remote is configured)
git push -u origin chore/pepoystudio-scaffold
```

---

## Verification Checklist

### ✅ Before Committing:

```bash
# 1. Verify old imports preserved
ls /Users/palawan/Projects/magsasa-card-kaani-erp-old-imports/imports/
# Should show your original files

# 2. Verify files copied to new location
ls server/src/features/kaani/pepoystudio/studio_app/
# Should show: services/, data/, possibly agent/, types.ts

# 3. Check TypeScript compiles
pnpm check
# Should pass with no errors (or fix any errors first)

# 4. Verify barrel export exists
test -f server/src/features/kaani/pepoystudio/index.ts && echo "✅ index.ts exists" || echo "❌ Missing index.ts"

# 5. Verify git status (should only show pepoystudio/)
git status
# Should show: ?? server/src/features/kaani/pepoystudio/
```

### ✅ After Committing:

```bash
# 1. Verify commit was created
git log -1 --oneline
# Should show: "chore: import Pepoy Studio AI Studio app..."

# 2. Verify branch exists
git branch
# Should show: * chore/pepoystudio-scaffold

# 3. Verify files in commit
git ls-tree -r HEAD --name-only | grep pepoystudio
# Should list all files under pepoystudio/

# 4. Verify old-imports NOT in repo
git ls-files | grep old-imports
# Should return nothing
```

---

## Common Failure Modes & Fixes

### ❌ Error: "fatal: destination path 'magsasa-card-kaani-erp' already exists"

**Cause:** Step 3 (rename) wasn't executed, or folder already exists.

**Fix:**
```bash
# Check what exists
ls -la /Users/palawan/Projects/ | grep magsasa

# If magsasa-card-kaani-erp exists AND has .git, it's already the repo
# If magsasa-card-kaani-erp exists but NO .git, rename it:
mv magsasa-card-kaani-erp magsasa-card-kaani-erp-old-imports
```

### ❌ Error: "Cannot find module '../data/weatherStations'" (pnpm check fails)

**Cause:** Import paths in `riskCalculator.ts` don't match actual folder structure.

**Fix:**
```bash
# Check actual folder structure
find server/src/features/kaani/pepoystudio/studio_app -type f -name "*.ts" | sort

# Edit riskCalculator.ts to fix imports
# If structure is: studio_app/services/riskCalculator.ts and studio_app/data/weatherStations.ts
# Then imports should be: '../data/weatherStations' (not '../../data/...')
```

### ❌ Error: rsync/cp fails with "No such file or directory"

**Cause:** Source path is wrong or folder doesn't exist.

**Fix:**
```bash
# Verify source exists
ls -la /Users/palawan/Projects/magsasa-card-kaani-erp-old-imports/imports/

# Check exact path
cd /Users/palawan/Projects
pwd  # Should show /Users/palawan/Projects

# Re-run copy with absolute path if needed
cp -r /Users/palawan/Projects/magsasa-card-kaani-erp-old-imports/imports/* server/src/features/kaani/pepoystudio/studio_app/
```

### ❌ Error: "Cannot find name 'RiskScoreInput'" (TypeScript error)

**Cause:** Types not exported or barrel export wrong.

**Fix:**
```bash
# Check what's actually exported from riskCalculator.ts
grep "export" server/src/features/kaani/pepoystudio/studio_app/services/riskCalculator.ts

# Update index.ts to match actual exports
```

### ❌ Error: Git status shows old-imports folder

**Cause:** Copied the wrong folder or repo root is wrong.

**Fix:**
```bash
# Check current directory
pwd  # Should be: /Users/palawan/Projects/magsasa-card-kaani-erp

# If old-imports is listed, don't commit it:
git reset HEAD ../magsasa-card-kaani-erp-old-imports/ 2>/dev/null || true

# Only stage pepoystudio:
git add server/src/features/kaani/pepoystudio/
```

### ❌ Error: "pnpm check" fails with module resolution errors

**Cause:** Missing dependencies or incorrect TypeScript config paths.

**Fix:**
```bash
# Check tsconfig.json includes server/src
grep -A 5 "include" tsconfig.json

# If needed, the files should compile if they're under server/src/
# Check if there are any missing type definitions:
pnpm install --save-dev @types/node  # if using Node types
```

---

## Quick Reference: File Locations

**Old location (preserved backup):**
```
/Users/palawan/Projects/magsasa-card-kaani-erp-old-imports/imports/
```

**New location (in git repo):**
```
/Users/palawan/Projects/magsasa-card-kaani-erp/server/src/features/kaani/pepoystudio/studio_app/
  services/
    riskCalculator.ts
  data/
    cropBenchmarks.ts
    weatherStations.ts
  (possibly agent/, types.ts)
```

**Barrel export:**
```
/Users/palawan/Projects/magsasa-card-kaani-erp/server/src/features/kaani/pepoystudio/index.ts
```

---

## All-in-One Command Sequence (Copy-Paste Ready)

```bash
# Navigate
cd /Users/palawan/Projects

# Rename old folder
mv magsasa-card-kaani-erp magsasa-card-kaani-erp-old-imports

# Clone repo
git clone https://github.com/gerome650/magsasa-card-kaani-erp.git

# Enter repo
cd magsasa-card-kaani-erp

# Create branch
git checkout -b chore/pepoystudio-scaffold

# Create target dir
mkdir -p server/src/features/kaani/pepoystudio/studio_app

# Copy files
cp -r ../magsasa-card-kaani-erp-old-imports/imports/services server/src/features/kaani/pepoystudio/studio_app/
cp -r ../magsasa-card-kaani-erp-old-imports/imports/data server/src/features/kaani/pepoystudio/studio_app/
cp -r ../magsasa-card-kaani-erp-old-imports/imports/agent server/src/features/kaani/pepoystudio/studio_app/ 2>/dev/null || true
cp ../magsasa-card-kaani-erp-old-imports/imports/types.ts server/src/features/kaani/pepoystudio/studio_app/ 2>/dev/null || true

# Install & check
pnpm install
pnpm check  # Fix any errors before proceeding

# Create barrel export (manually edit if needed)
cat > server/src/features/kaani/pepoystudio/index.ts << 'EOF'
export {
  calculateBaselineRiskScore,
  type RiskScoreInput,
  type RiskScoreResult,
  type HarvestScoreResult,
  type ClimateType,
  CLIMATE_TYPE_DESCRIPTIONS,
} from './studio_app/services/riskCalculator';

export { type CropBenchmark, cropBenchmarks } from './studio_app/data/cropBenchmarks';
export { type WeatherStation, weatherStations } from './studio_app/data/weatherStations';
EOF

# Verify again
pnpm check

# Commit
git add server/src/features/kaani/pepoystudio/
git commit -m "chore: import Pepoy Studio AI Studio app (staged, no runtime wiring)"
git push -u origin chore/pepoystudio-scaffold
```

---

## Next Steps

After successful import:
1. Verify imports work: `import { calculateBaselineRiskScore } from './features/kaani/pepoystudio'`
2. Wire into runtime when ready (separate PR)
3. Keep `magsasa-card-kaani-erp-old-imports/` as backup until verified
