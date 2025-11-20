# Batch Orders – Service Level Objectives

## Scope

API procedures under `batchOrder.*` and the `/batch-orders` UI surfaces.

## Availability SLOs

| Endpoint | Target Availability (30d rolling) | Notes |
| --- | --- | --- |
| `batchOrder.create` | 99.3 % | Operators can fall back to CSV import only if this path is healthy. |
| `batchOrder.update` | 99.5 % | Needed by managers while orders are still draft. |
| `batchOrder.list` | 99.7 % | Drives dashboard visibility. Cacheable if needed. |
| `batchOrder.getById` | 99.7 % | Required for audit + detail review. |

## Latency Targets (p95)

| Operation | Target | Measurement |
| --- | --- | --- |
| Create (API) | ≤ 800 ms | From request receipt to persisted response. |
| Update (API) | ≤ 700 ms | Includes recomputing totals. |
| `/batch-orders` list | ≤ 500 ms | Server response with filtering. |
| Detail view data fetch | ≤ 400 ms | Header + items query. |

## Error Budgets

- 30-day window.
- SLO burn alerts at 25 % of budget depleted.
- Track `TRPCError` totals once metrics piping exists; until then, rely on structured logs + manual sampling.

## Dependencies

- MySQL availability (single primary).
- `farms` and `users` tables for FK validation.
- Authentication middleware to supply `ctx.user`.

## Operational Notes

- Indexes added for hot queries (see `docs/INDEXES-SQL.sql`).
- Stress-test script (`scripts/generate-stress-test-batch-orders.ts`) can pre-warm caches before measuring SLIs.
- When observability stack is ready, emit counters for `batch_order_created` and `batch_order_submitted`.

