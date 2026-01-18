# PR Creation for Pepoy Studio Import

## Status Check

**Current branch:** `demo/kaani-starter-prompts-2026-01-17`

**Target branch:** `chore/pepoystudio-scaffold` (should exist based on terminal history)

## PR Details

**Title:**
```
chore(kaani): stage Pepoy AI Studio risk & harvest logic (no runtime wiring)
```

**Body:**
```markdown
- Stages Pepoy's AI Studio riskCalculator + benchmark datasets as an isolated module
- Keeps import compile-safe: disables Gemini + React entrypoints (archived as .disabled.txt)
- No runtime wiring, no backend schema changes, no architecture refactors
- Intended follow-up PR: create adapter + wire deterministic scorer into KaAni flows
```

## Create PR

**Option A: Using GitHub CLI (if authenticated)**
```bash
gh pr create \
  --base main \
  --head chore/pepoystudio-scaffold \
  --title "chore(kaani): stage Pepoy AI Studio risk & harvest logic (no runtime wiring)" \
  --body "- Stages Pepoy's AI Studio riskCalculator + benchmark datasets as an isolated module
- Keeps import compile-safe: disables Gemini + React entrypoints (archived as .disabled.txt)
- No runtime wiring, no backend schema changes, no architecture refactors
- Intended follow-up PR: create adapter + wire deterministic scorer into KaAni flows"
```

**Option B: Browser URL (if gh CLI not authenticated)**
https://github.com/gerome650/magsasa-card-kaani-erp/compare/main...chore/pepoystudio-scaffold?expand=1

Copy the title and body above into the PR form.
