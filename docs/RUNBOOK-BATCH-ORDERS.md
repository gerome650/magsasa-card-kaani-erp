# Runbook – Batch Orders

## 1. All Creates Failing

1. Check logs (`source=batchOrder.router event=create.success|error`).
2. Verify MySQL health: `mysqladmin ping`.
3. Ensure `batch_orders` table exists/migrated.
4. Run smoke test via Postman or `pnpm tsx scripts/generate-stress-test-batch-orders.ts --orders=1 --items=5`.
5. If DB unavailable, follow infra escalation. Otherwise share error message + referenceCode with engineering.

## 2. Updates Stuck / Status Not Changing

1. Confirm status (`draft` vs `pending_approval`) on detail page.
2. Review logs for `event=status.transition`.
3. If UI shows error toast, capture message and reattempt after refreshing.
4. For conflicting edits, coordinate between managers; only one should edit at a time until optimistic locking exists.

## 3. Slow `/batch-orders` List

1. Confirm indexes applied (`docs/INDEXES-SQL.sql`).
2. Run EXPLAIN plan for current filters; ensure indexes used.
3. Reduce filter window (narrow date range) to mitigate load.
4. If slowness persists, capture query time + MySQL metrics for performance team.

## 4. Inspecting a Specific Order

1. Use `/batch-orders/:id` detail page.
2. Cross-check DB directly:
   ```sql
   SELECT * FROM batch_orders WHERE id = '<id>';
   SELECT * FROM batch_order_items WHERE batchOrderId = '<id>';
   ```
3. Compare totals with UI to detect data drift.

## 5. Post-Incident Checklist

- Document incident in `docs/POSTMORTEM-TEMPLATE-BATCH-ORDERS.md`.
- Include affected reference codes, timestamps, and any mitigation taken.

