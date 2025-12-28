# PR-10 Deployment Guide

## Quick Start

### Environment Configuration

Add the following environment variable to your deployment configuration:

```bash
DEPLOYMENT_PROFILE=CARD_MRI
```

**Available Profiles:**
- `CARD_MRI` - Loan suggestions visible to farmers (visibility=ui), limits: PHP 5K-150K
- `LANDBANK` - Loan suggestions only for loan officers (visibility=internal), limits: PHP 10K-200K
- `DEV` - Full visibility for testing (visibility=ui), limits: PHP 1K-500K

If not set, defaults to `DEV` profile.

## Feature Behavior by Profile

### CARD_MRI Profile
The loan suggestion component will appear in the UI for both farmers and loan officers when sufficient data is available. The suggested amount will be calculated based on farm data and clamped between PHP 5,000 and PHP 150,000.

### LANDBANK Profile
The loan suggestion artifact will be computed but **not displayed** in the farmer-facing UI (visibility=internal). Loan officers can access the suggestion data through internal tools or APIs.

### DEV Profile
Full visibility for testing purposes with wider loan limits (PHP 1K-500K) to accommodate various test scenarios.

## Visibility Gating Logic

The loan suggestion component renders only when:
1. The feature is enabled for the current deployment profile
2. The artifact has `visibility === "ui"`
3. Sufficient data exists to compute a suggestion

**Code snippet from KaAniChat.tsx:**
```tsx
{artifactBundle && (() => {
  const loanSuggestion = artifactBundle.artifacts.find(a => a.type === "loan_suggestion");
  // Feature gate: only show if visibility is "ui"
  return loanSuggestion && loanSuggestion.visibility === "ui" ? (
    <div className="border-t border-gray-200 bg-gray-50 p-4">
      <KaAniLoanSuggestion data={loanSuggestion.data} />
    </div>
  ) : null;
})()}
```

## Testing Checklist

Before deploying to production:

- [ ] Set `DEPLOYMENT_PROFILE` environment variable
- [ ] Verify loan suggestions appear/don't appear based on profile visibility
- [ ] Test with complete farmer data (crop, hectares, location)
- [ ] Test with incomplete data (verify penalties and disclaimers)
- [ ] Test with high/medium risk flags (verify adjustments)
- [ ] Verify amounts are clamped to policy min/max
- [ ] Verify amounts are rounded to nearest 500 PHP
- [ ] Check confidence levels match data completeness
- [ ] Verify calculation breakdown is clear and accurate
- [ ] Test on both KaAniChat and KaAniPublic pages

## Monitoring

After deployment, monitor:

1. **Confidence Distribution:** Track how many suggestions are low/medium/high confidence
2. **Adjustment Patterns:** Which adjustments are most common (risk, missing info, clamping)
3. **Actual vs. Suggested:** Compare suggested amounts with final approved amounts
4. **User Feedback:** Collect feedback on suggestion accuracy and usefulness

## Rollback Plan

If issues arise, you can disable the feature by:

1. **Option 1:** Change deployment profile to one with `visibility=off` (requires code change)
2. **Option 2:** Set `enabled: false` in the policy profile for your deployment
3. **Option 3:** Revert the PR changes

The feature is designed to fail gracefully - if the artifact cannot be computed, it simply won't appear in the UI.

## Support

For questions or issues, refer to:
- Implementation details: `PR10_IMPLEMENTATION_SUMMARY.md`
- Code verification: Run `./verify-pr10.sh` in the project root
