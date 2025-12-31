# PR-7: Guided Flow Runtime + Loan Officer Output (MVP)

## Summary

This PR transforms KaAni from a free-form chat into a deterministic guided interview system. It implements flow runtime logic, slot extraction, progress tracking, and generates loan officer summaries when sufficient data is collected.

## Files Changed

### New Files
- `server/ai/flows/runtime/flowRuntime.ts` - Core flow runtime engine (slot extraction, progress computation, step navigation)
- `server/ai/flows/runtime/loanOfficerSummary.ts` - Loan officer summary builder
- `client/src/features/kaani/components/KaAniProgressBar.tsx` - Progress bar component
- `client/src/features/kaani/components/KaAniWhatWeKnowPanel.tsx` - "What we know" collapsible panel
- `client/src/features/kaani/components/KaAniLoanOfficerSummary.tsx` - Loan officer summary display component
- `docs/PR7_NOTES.md` - This file

### Modified Files
- `server/db.ts` - Added `getLatestFlowState()` and `appendFlowStateMessage()` helpers
- `server/routers.ts` - Added `kaani.sendGuidedMessage` endpoint; updated `kaani.sendLeadMessage` to return flow state
- `client/src/features/kaani/components/KaAniChat.tsx` - Updated to use `sendGuidedMessage` and display flow state
- `client/src/pages/KaAniPublic.tsx` - Updated to display flow state from lead-gen endpoint

## Key Features

### 1. Flow Runtime Engine
- **Slot Extraction**: Deterministic extraction from user messages using simple heuristics (numbers, enums, text patterns)
- **Progress Computation**: Calculates required vs filled slots percentage
- **Step Navigation**: Determines next step based on filled slots and conditions
- **What We Know**: Builds display array of collected information

### 2. Loan Officer Summary
- Generates MVP underwriting summary when:
  - Progress >= 60%, OR
  - All critical slots filled
  - Only for `loan_officer` audience
- Includes: location, crop, farm size, production needs, estimated working capital, flags, assumptions

### 3. Flow State Persistence
- Stores flow state in `conversation_messages.metadata` (no new tables)
- Each user message triggers a flow state update (stored as `role='tool'` message)
- Includes: slots, progress, nextStepId, whatWeKnow, loanOfficerSummary

### 4. UI Enhancements
- **Progress Bar**: Shows completion percentage (e.g., "3/7 (43%)")
- **What We Know Panel**: Collapsible panel showing collected information
- **Loan Officer Summary**: Expandable summary panel (ERP mode, loan_officer audience)
- **Suggested Chips**: Flow-driven suggestions based on current step

## API Changes

### New Endpoint: `kaani.sendGuidedMessage` (protected)
**Input:**
```typescript
{
  conversationId: number;
  message: string;
  audience: "loan_officer" | "farmer";
  dialect?: "tagalog" | "cebuano" | "english";
  flowId?: string;
}
```

**Output:**
```typescript
{
  reply: string;
  farmerProfileId: string;
  flow: {
    flowId: string;
    nextStepId: string | null;
    suggestedChips: string[];
    progress: { requiredTotal, requiredFilled, percent, missingRequired: string[] };
    whatWeKnow: Array<{label: string, value: string}>;
    loanOfficerSummary?: { summaryText, flags, assumptions, missingCritical };
  } | null;
}
```

### Updated Endpoint: `kaani.sendLeadMessage` (public)
Now returns the same `flow` object structure as `sendGuidedMessage`.

## Testing

### 1. Server Boot
```bash
pnpm dev
```
Should start successfully on localhost:3000.

### 2. Guided Flow (ERP Mode)
1. Open `/erp/kaani`
2. Create new conversation
3. Send message: "Palay, 1 hectare, Nueva Ecija"
4. Verify:
   - Response returned
   - Progress bar shows > 0%
   - Suggested chips appear
   - "What we know" panel shows extracted data (crop, farm size, location)

### 3. Flow State Persistence
```sql
SELECT role, content, JSON_EXTRACT(metadata, '$.type') as type
FROM conversation_messages
ORDER BY createdAt DESC
LIMIT 5;
```
Expected: One row with `role='tool'` and `type='flow_state'`.

### 4. Loan Officer Summary
1. Set audience to `loan_officer`
2. Send 2-3 messages providing: farm size, crop, location, cost estimates
3. Verify:
   - `flow.loanOfficerSummary` appears when progress >= 60%
   - Summary panel displays in UI
   - Includes estimated working capital if farm size + cost available

### 5. Lead-gen Mode
1. Open `/kaani` (public)
2. Send message
3. Verify:
   - Progress bar visible
   - Suggested chips appear
   - What-we-know panel shows collected data
   - No auth required

## Known Limitations

1. **Slot Extraction**: Uses simple heuristics (regex, substring matching). Not perfect, but deterministic and fast. Future PRs can add Gemini-based extraction.

2. **Step Navigation**: Basic implementation - supports `equals`, `exists`, `missing` conditions. Full conditional logic (gt, lt, in) defined but not fully tested.

3. **Flow Packages**: Currently only supports `default` flow per audience. Flow versioning and multiple flows per audience not implemented.

4. **Loan Officer Summary**: MVP version - basic formatting, no PDF export, no complex calculations.

## Backward Compatibility

- ✅ Existing `kaani.sendConversationMessage` endpoint remains unchanged
- ✅ Existing `kaani.sendMessage` endpoint remains unchanged
- ✅ ERP chat at `/erp/kaani` continues to work (now with guided flow)
- ✅ Public chat at `/kaani` continues to work (now with guided flow)
- ✅ No database schema changes (uses existing `conversation_messages.metadata`)

## Next Steps (Future PRs)

- PR-8: Full flow compiler with complex step navigation
- Enhanced slot extraction using Gemini tools
- PDF export for loan officer summaries
- Flow package admin UI
- Multiple flows per audience
- Flow versioning and migration

