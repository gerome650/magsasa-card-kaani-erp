
This folder contains Pepoy’s Google AI Studio export staged under:
`server/src/features/kaani/pepoystudio/studio_app/`

## Status
- Staged only (NOT wired into runtime)
- No schema changes
- Intended for logic review + future integration

## Why Gemini is disabled
`studio_app/services/geminiService.ts` imports `@google/genai`, which is not a dependency in this repo.
For compile safety it is renamed to:
`geminiService.disabled.ts`

## What we intend to use first
Primary focus is the deterministic risk logic:
- `studio_app/services/riskCalculator.ts`
  - baselineScore (climate + soil + optional harvest)
  - harvestScore + benchmark matching
  - alpha / alphaRisk outputs

## Guardrails
- Keep isolated under pepoystudio/
- No changes to existing KaAni/AIDA architecture in this PR
