# PR-9: Output Artifacts / Underwriting MVP

## Summary

This PR implements deterministic underwriting artifact generation (loan packet) from guided flow state, conversation messages, and farmer profiles. Works in both ERP and public lead-gen modes.

## Files Changed

### New Files
- `server/ai/artifacts/types.ts` - Artifact type definitions
- `server/ai/artifacts/data/inputCategories.ts` - Input category constants
- `server/ai/artifacts/data/cropBudgetBenchmarks.ts` - Crop budget benchmarks (deterministic)
- `server/ai/artifacts/loanPacket.ts` - Loan summary artifact builder
- `server/ai/artifacts/costBreakdown.ts` - Cost breakdown artifact builder
- `server/ai/artifacts/riskFlags.ts` - Risk flags artifact builder
- `server/ai/artifacts/buildArtifacts.ts` - Main artifact bundle builder
- `client/src/features/kaani/components/KaAniLoanPacket.tsx` - Loan packet UI component
- `docs/PR9_NOTES.md` - This file

### Modified Files
- `server/db.ts` - Added `appendArtifactsMessage`, `getLatestArtifacts`, `getConversationWithFarmerProfile`
- `server/routers.ts` - Added `kaani.getArtifacts` and `kaani.getLeadArtifacts` endpoints
- `client/src/features/kaani/types.ts` - Added `KaAniArtifactBundle` type
- `client/src/features/kaani/components/KaAniChat.tsx` - (TODO: integrate artifact display)
- `client/src/pages/KaAniPublic.tsx` - (TODO: integrate artifact display)

## Key Features

### 1. Deterministic Artifact Generation
- **Loan Summary**: Extracts crop, hectares, location from flow state
- **Cost Breakdown**: Uses crop benchmarks to calculate per-hectare and total costs
- **Risk Flags**: Deterministic flags based on slots (irrigation type, farm size, missing data)
- **Next Questions**: Generates friendly questions based on missing fields

### 2. Benchmark Data
- Placeholder benchmarks for palay/rice and mais/corn
- Cost per hectare ranges (PHP 25K-65K depending on crop)
- Category weights for splitting costs (fertilizer 25%, labor 25%, etc.)

### 3. Readiness Assessment
- `ready`: All required fields present (crop, hectares, province)
- `needs_info`: 2+ missing fields
- `draft`: 1 missing field

### 4. Persistence
- Artifacts stored in `conversation_messages` metadata (role='tool', type='kaani_artifacts_v1')
- No new DB tables required
- Works with existing conversation flow

## API Endpoints

### `kaani.getArtifacts` (protected)
**Input:**
```typescript
{
  conversationId: number;
  audience: "loan_officer" | "farmer";
  dialect?: "tagalog" | "cebuano" | "english";
}
```

**Output:**
```typescript
{
  bundle: KaAniArtifactBundle;
  farmerProfileId: string;
}
```

### `kaani.getLeadArtifacts` (public)
**Input:**
```typescript
{
  sessionToken: string;
  audience: "loan_officer" | "farmer";
  dialect?: "tagalog" | "cebuano" | "english";
}
```

**Output:**
```typescript
{
  bundle: KaAniArtifactBundle;
}
```

## Testing

### 1. Server Boot
```bash
pnpm dev
```
Should start successfully.

### 2. ERP Mode Test
1. Open `http://localhost:3000/erp/kaani`
2. Start conversation (or use existing)
3. Set audience to `loan_officer`
4. Send: "Palay, 1 hectare, Nueva Ecija, rainfed"
5. Verify:
   - Loan Packet panel appears below flow state UI
   - Bundle readiness badge shows (`ready`, `needs_info`, or `draft`)
   - Loan summary shows crop=Palay, hectares=1, location=Nueva Ecija
   - Cost breakdown shows PHP 35K-65K total range
   - Risk flags include weather risk (rainfed, high severity)
   - Missing info checklist if any fields missing

### 3. Public Mode Test
1. Open `http://localhost:3000/kaani`
2. Start session (automatically created on page load)
3. Send same message: "Palay, 1 hectare, Nueva Ecija, rainfed"
4. Verify:
   - Loan Packet panel appears below flow state UI
   - Same artifact content as ERP mode
   - No authentication required

### 4. SQL Verification
```sql
SELECT id, role, LEFT(content,40) as content,
  JSON_EXTRACT(metadata,'$.type') as type
FROM conversation_messages
ORDER BY createdAt DESC
LIMIT 15;
```
Expected: At least one row with `role='tool'` and `type='kaani_artifacts_v1'`.

### 5. Bundle Readiness Check
```sql
SELECT
  JSON_EXTRACT(metadata,'$.bundle.readiness') as readiness,
  JSON_LENGTH(JSON_EXTRACT(metadata,'$.bundle.missing')) as missingCount
FROM conversation_messages
WHERE role='tool'
  AND JSON_EXTRACT(metadata,'$.type')='kaani_artifacts_v1'
ORDER BY createdAt DESC
LIMIT 1;
```
Expected: readiness should be `"ready"`, `"needs_info"`, or `"draft"` based on collected data.

## Known Limitations

1. **Benchmarks**: Placeholder values - should be replaced with CARD/LandBank tables later
2. **Crop Detection**: Basic keyword matching for palay/rice/mais/corn
3. **Risk Flags**: Simple deterministic rules - no complex risk modeling
4. **UI Integration**: Loan packet component created but not yet integrated into chat pages (TODO)

## Next Steps

- Integrate `KaAniLoanPacket` component into `KaAniChat.tsx` and `KaAniPublic.tsx`
- Replace placeholder benchmarks with real data
- Enhance crop detection from conversation messages
- Add more sophisticated risk flag logic
- PDF export for loan packets (future PR)

