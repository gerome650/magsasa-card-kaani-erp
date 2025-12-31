# PR-10: Loan Amount Suggestion Engine Implementation Summary

## Overview
Implemented a partner-gated loan amount suggestion engine that provides explainable loan recommendations based on farm data, cost breakdowns, and risk assessments.

## Implementation Details

### 1. Feature Flags and Policy Profiles
**File:** `server/ai/config/policyProfiles.ts`

- Created `DeploymentProfile` type with three profiles: `CARD_MRI`, `LANDBANK`, `DEV`
- Defined `FeatureVisibility` levels: `off`, `internal`, `ui`
- Implemented `LoanSuggestionPolicy` interface with:
  - `enabled`: Feature toggle
  - `visibility`: Controls UI rendering
  - `minLoanAmount`, `maxLoanAmount`: Policy-specific limits
  - `roundingIncrement`: Rounding behavior (500 PHP)
- Profile-specific configurations:
  - **CARD_MRI**: visibility=`ui`, min=5K, max=150K
  - **LANDBANK**: visibility=`internal`, min=10K, max=200K
  - **DEV**: visibility=`ui`, min=1K, max=500K
- Environment-based profile selection via `DEPLOYMENT_PROFILE` env var

### 2. Artifact Type Definition
**Files:**
- `server/ai/artifacts/types.ts`
- `client/src/features/kaani/types.ts`

Added `loan_suggestion` artifact type with:
- `visibility` field for feature gating
- `suggestedAmount`: Final recommended loan amount
- `baseAmount`: Starting calculation point
- `adjustments`: Array of explainable adjustments with reasons and impacts
- `disclaimers`: User-facing notices
- `confidence`: Low/medium/high confidence level

### 3. Loan Suggestion Formula
**File:** `server/ai/loanSuggestion/loanSuggestionFormula.ts`

Implemented multi-step calculation formula:

1. **Base Amount Calculation:**
   - Primary: Use average of cost_breakdown.total range if available
   - Fallback: hectares × crop benchmark (from existing data)
   - Last resort: Minimum policy amount

2. **Risk Multipliers:**
   - High severity flags: -15% per flag (max -30%)
   - Medium severity flags: -8% per flag (max -20%)
   - Adjusts confidence level based on risk

3. **Missing Info Penalties:**
   - Critical missing fields (crop, hectares, province): -10% per field (max -25%)
   - Reduces confidence to "low"

4. **Policy Clamping:**
   - Enforce min/max from deployment profile
   - Add disclaimers for capped amounts

5. **Rounding:**
   - Round to nearest increment (500 PHP)

All adjustments are tracked with explainable reasons and impact values.

### 4. Artifact Builder Integration
**File:** `server/ai/loanSuggestion/computeLoanSuggestion.ts`

- Orchestrates formula computation
- Checks feature flag before building artifact
- Sets visibility based on policy configuration
- Returns null if feature is disabled (filtered out in artifact bundle)

**File:** `server/ai/artifacts/buildArtifacts.ts`

- Integrated `computeLoanSuggestion` into artifact build pipeline
- Passes existing artifacts (loan_summary, cost_breakdown, risk_flags) as inputs
- Filters null artifacts before returning bundle
- Maintains existing artifact flow patterns

### 5. Client-Side Component
**File:** `client/src/features/kaani/components/KaAniLoanSuggestion.tsx`

Created React component with:
- Large, prominent display of suggested amount
- Confidence badge (color-coded: green/yellow/orange)
- Calculation breakdown showing all adjustments
- Visual indicators for positive/negative impacts
- Multiplier and penalty percentages displayed
- Disclaimers section for important notices
- Consistent styling with existing artifact components

### 6. UI Integration with Visibility Gating
**Files:**
- `client/src/features/kaani/components/KaAniChat.tsx`
- `client/src/pages/KaAniPublic.tsx`

Both files updated with:
- Import of `KaAniLoanSuggestion` component
- Visibility check: Only renders when `artifact.visibility === "ui"`
- Positioned before `KaAniLoanPacket` for prominence
- Inline comments explaining gating decisions
- Follows existing artifact rendering patterns

## Key Design Decisions

1. **No Approve/Reject Language:** Component is purely informational, showing a suggestion without action buttons
2. **Explainability First:** All adjustments tracked with reasons and impacts for transparency
3. **Conservative Defaults:** Missing data results in penalties and lower confidence
4. **Policy-Driven:** All limits and visibility controlled by deployment profile
5. **Minimal Changes:** Integrated into existing artifact flow without disrupting other features

## Environment Configuration

To enable/configure the feature, set:
```bash
DEPLOYMENT_PROFILE=CARD_MRI  # or LANDBANK, or DEV
```

If not set, defaults to `DEV` profile.

## Testing Considerations

1. **Feature Toggle:** Test with different `DEPLOYMENT_PROFILE` values
2. **Visibility Gating:** Verify UI rendering based on profile visibility setting
3. **Formula Accuracy:** Test with various combinations of:
   - Complete vs. incomplete data
   - With/without cost_breakdown
   - Different risk flag severities
   - Edge cases (min/max clamping)
4. **Explainability:** Verify all adjustments are tracked and displayed correctly
5. **Confidence Levels:** Ensure confidence degrades appropriately with missing data/risks

## Files Modified/Created

### Created:
- `server/ai/config/policyProfiles.ts`
- `server/ai/loanSuggestion/loanSuggestionFormula.ts`
- `server/ai/loanSuggestion/computeLoanSuggestion.ts`
- `client/src/features/kaani/components/KaAniLoanSuggestion.tsx`

### Modified:
- `server/ai/artifacts/types.ts`
- `server/ai/artifacts/buildArtifacts.ts`
- `client/src/features/kaani/types.ts`
- `client/src/features/kaani/components/KaAniChat.tsx`
- `client/src/pages/KaAniPublic.tsx`

## Next Steps

1. Set `DEPLOYMENT_PROFILE` environment variable in deployment
2. Test with real farmer data
3. Monitor confidence levels and adjust formula if needed
4. Gather feedback on suggested amounts vs. actual approvals
5. Consider adding A/B testing for different formula parameters
