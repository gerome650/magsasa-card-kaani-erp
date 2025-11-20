# Failure & Resilience Analysis – Batch Orders

## Failure Scenarios

| Scenario | Expected Behavior | Current Handling |
| --- | --- | --- |
| DB unavailable/slow | Mutations fail quickly with clear error | tRPC returns error message; UI toasts surfaced. Transactions avoid partial writes. |
| Validation edge cases (overflow, negative values) | Request rejected with helpful error | Zod schemas enforce `.positive()` + `.min(0)`; client double-checks input. |
| Farm removed after order creation | Items keep historical `farmId`; edits require valid farms | Editing validates farm IDs again; failure message explains missing farm. |
| Conflicting updates | Second editor receives error once status leaves editable states | Update mutation rejects non-draft/pending statuses; UI disables buttons accordingly. |
| Large numeric totals | Totals stored as DECIMAL(15,2), preventing overflow within expected ranges | Monitor if orders exceed billions; document in future work. |

## Guardrails in Code

- API errors never expose stack traces or secrets (simple `Error` messages shown to user).
- React toasts surface mutation failures so the UI never hangs silently.
- Create/Update operations now run inside database transactions; header + items are committed atomically.
- Structured logs capture `create`, `update`, and `status.transition` events for forensic review.

## Resilience Gaps / Future Work

- No optimistic concurrency control yet (e.g., `updatedAt` check). Documented for v2.
- Supplier references are free-form strings; once suppliers are first-class, add FK validation.
- No auto-retry for transient DB write errors beyond connection retry logic.

## Summary

Batch Orders gracefully handles the most likely failure conditions (validation, basic conflicts, DB hiccups) and fails closed when necessary. Remaining risks are acceptable for v1, provided operators follow the runbook if repeated errors surface.

