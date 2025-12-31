#!/bin/bash
echo "=== PR-10 Implementation Verification ==="
echo ""
echo "1. Checking created files..."
files=(
  "server/ai/config/policyProfiles.ts"
  "server/ai/loanSuggestion/loanSuggestionFormula.ts"
  "server/ai/loanSuggestion/computeLoanSuggestion.ts"
  "client/src/features/kaani/components/KaAniLoanSuggestion.tsx"
)
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "✓ $file"
  else
    echo "✗ $file (MISSING)"
  fi
done

echo ""
echo "2. Checking modified files..."
echo "   - Checking artifact types..."
grep -q "loan_suggestion" server/ai/artifacts/types.ts && echo "✓ server/ai/artifacts/types.ts updated" || echo "✗ types.ts not updated"
grep -q "loan_suggestion" client/src/features/kaani/types.ts && echo "✓ client types.ts updated" || echo "✗ client types.ts not updated"

echo "   - Checking buildArtifacts integration..."
grep -q "computeLoanSuggestion" server/ai/artifacts/buildArtifacts.ts && echo "✓ buildArtifacts.ts integrated" || echo "✗ buildArtifacts.ts not integrated"

echo "   - Checking UI integration..."
grep -q "KaAniLoanSuggestion" client/src/features/kaani/components/KaAniChat.tsx && echo "✓ KaAniChat.tsx integrated" || echo "✗ KaAniChat.tsx not integrated"
grep -q "KaAniLoanSuggestion" client/src/pages/KaAniPublic.tsx && echo "✓ KaAniPublic.tsx integrated" || echo "✗ KaAniPublic.tsx not integrated"

echo ""
echo "3. Checking visibility gating..."
grep -q 'visibility === "ui"' client/src/features/kaani/components/KaAniChat.tsx && echo "✓ Visibility gating in KaAniChat" || echo "✗ No visibility gating in KaAniChat"
grep -q 'visibility === "ui"' client/src/pages/KaAniPublic.tsx && echo "✓ Visibility gating in KaAniPublic" || echo "✗ No visibility gating in KaAniPublic"

echo ""
echo "=== Verification Complete ==="
