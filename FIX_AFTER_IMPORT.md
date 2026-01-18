# Fix Pepoy Studio Compilation - Run After Import

## Prerequisites
Files must be imported to: `server/src/features/kaani/pepoystudio/studio_app/`

---

## Quick Fix Commands (Copy-Paste)

```bash
cd /Users/palawan/Documents/Development/MAGSASA-CARD-ERP/MAGSASA-CARD-ERP/magsasa-card-kaani-erp

# 1. Fix Set iteration in riskCalculator.ts
sed -i '' 's/\[\.\.\.new Set(/Array.from(\n  new Set(/g' \
  server/src/features/kaani/pepoystudio/studio_app/services/riskCalculator.ts
sed -i '' 's/)\]\];/)\n);/g' \
  server/src/features/kaani/pepoystudio/studio_app/services/riskCalculator.ts

# 2. Disable geminiService.ts
mv server/src/features/kaani/pepoystudio/studio_app/services/geminiService.ts \
   server/src/features/kaani/pepoystudio/studio_app/services/geminiService.disabled.ts

# 3. Update index.ts to point to studio_app
cat > server/src/features/kaani/pepoystudio/index.ts << 'EOF'
/**
 * Pepoy Studio KaAni Logic
 * 
 * Staged import from Google AI Studio export.
 * No runtime wiring - isolated package.
 */

export * from "./studio_app/services/riskCalculator";
EOF

# 4. Verify
pnpm check
```

---

## Manual Fix (If sed fails)

### Fix Set iteration:
Open `server/src/features/kaani/pepoystudio/studio_app/services/riskCalculator.ts`

Find:
```typescript
const allSystems = [...new Set(CROP_BENCHMARKS.map(b => b.farmingSystemOrVariety))]
```

Replace with:
```typescript
const allSystems = Array.from(
  new Set(CROP_BENCHMARKS.map(b => b.farmingSystemOrVariety))
);
```

### Disable geminiService:
```bash
mv server/src/features/kaani/pepoystudio/studio_app/services/geminiService.ts \
   server/src/features/kaani/pepoystudio/studio_app/services/geminiService.disabled.ts
```

---

## Git Commit

```bash
git add server/src/features/kaani/pepoystudio/
git commit -m "chore(kaani): stage Pepoy AI Studio risk logic (compile-safe, no runtime wiring)"
```
