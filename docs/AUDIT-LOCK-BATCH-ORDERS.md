# Audit Lock – Batch Orders

## What Can Be Audited Today

- `createdAt` / `updatedAt` timestamps on both header and items.
- `createdByUserId` recorded for every order.
- `approvedByUserId` reserved for future workflow.
- Structured logs for:
  - `create.success`
  - `update.success`
  - `status.transition`
  (include `batchOrderId`, `referenceCode`, acting user).

## Gaps / Accepted Risks

- No historical trail of field-level changes (only latest snapshot retained).
- Status history stored in logs only (not in DB table) for v1.
- Approval workflow not yet implemented; `approvedByUserId` remains null.

## Operator Guidance

- Capture `referenceCode` + timestamp when troubleshooting to correlate with logs.
- Avoid manual DB edits; always use UI/API so audit metadata stays correct.
- If a correction is required for a read-only order, create a compensating batch order instead of editing the locked one.

## Future Enhancements

- Store `statusHistory` JSON for each order once audit requirements tighten.
- Emit immutable events to an append-only ledger service (if/when available).

