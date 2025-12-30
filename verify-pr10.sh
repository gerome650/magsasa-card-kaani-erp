#!/bin/bash
set -e

echo "Verifying PR-10 loan suggestion..."

# Check TypeScript compilation
echo "✓ Type checking..."
pnpm -r build > /dev/null 2>&1 || (echo "✗ Build failed" && exit 1)

# Check visibility property access (should be top-level)
echo "✓ Checking visibility property access..."
if grep -r "loanSuggestion\.data\.visibility" client/src/features/kaani client/src/pages/KaAniPublic.tsx 2>/dev/null; then
  echo "✗ ERROR: visibility should be top-level, not in data"
  exit 1
fi

# Check suggestedAmount field name
echo "✓ Checking suggestedAmount field..."
if grep -r "suggestedAmountPhp\|suggested_amount" client/src/features/kaani/components/KaAniLoanSuggestion.tsx 2>/dev/null; then
  echo "✗ ERROR: Field should be suggestedAmount, not suggestedAmountPhp"
  exit 1
fi

echo "✓ All checks passed!"
