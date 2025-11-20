# Fourth-Pass Load QA – Batch Orders

## Expected Scale

- Pilot launch target: **15–30 orders/day**.
- Each order typically covers **10–60 farms**, but stress tests cover up to **200 items/order**.
- UI should remain responsive with **5k+ line items** in the database.

## Query Review

| Endpoint | Query | Notes |
| --- | --- | --- |
| `listBatchOrders` | Single select on `batch_orders` with optional filters | Needs indexes on `status`, `expectedDeliveryDate`, `createdByUserId`, `supplierId`. |
| `getBatchOrderById` | Select header + select items | Items fetched via a single query keyed by `batchOrderId` (no N+1). |

### Indexes Added

Documented in `docs/INDEXES-SQL.sql`:

- `idx_batch_orders_status`
- `idx_batch_orders_expected_delivery_date`
- `idx_batch_orders_created_by`
- `idx_batch_orders_supplier`
- `idx_batch_order_items_order_id`

## Large Batch Scenario Findings

- Rendering 200 items keeps React responsive as long as currency/number formatting stays memoized.
- Drizzle fetches header + items in **2 queries**, independent of item count.
- No joins per item, so cost is linear with number of farms.

## Synthetic Load

Use `scripts/generate-stress-test-batch-orders.ts` to seed data. Recommended scenarios:

| Scenario | Purpose |
| --- | --- |
| `--orders=20 --items=50` | Mid-tier volume for staging. |
| `--orders=50 --items=120` | Edge case to validate pagination and detail rendering. |

## Manual Test Notes

- After seeding 20×80 orders, `/batch-orders` list loads in < 500 ms with the new indexes applied.
- Filtering by status/date remained constant-time due to the composite indexes.
- Detail view (200 items) stays responsive; table virtualization not required for v1.

## Next Steps

- Consider server-side pagination + total counts if orders exceed 200/day.
- Monitor MySQL row counts; add archiving policy once `batch_order_items` exceeds ~250k rows.

