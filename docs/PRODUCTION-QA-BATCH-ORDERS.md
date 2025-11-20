# Production QA – Batch Orders

## Post-Deploy Verification Scenarios

| Scenario | Steps | Expected Result |
| --- | --- | --- |
| Create draft | `/batch-orders/new` → add 2 farms, save | Status `draft`, totals correct |
| Edit draft | Update quantity + price | Header totals change accordingly |
| Submit for approval | Click **Submit for Approval** | Status -> `pending_approval`, buttons disabled |
| List filters | Filter by status + date | Table updates without errors |
| Detail read-only | View approved/cancelled sample | No edit buttons shown |

## Edge Cases to Spot-Check

- Delivery date exactly 2 days in the past (should pass).
- Attempt to create with empty items (should block with toast).
- Negative price attempt (should block client and server).
- Large quantity (e.g., 10,000) to verify DECIMAL precision.

## Data Validation

- Run SQL spot check:
  ```sql
  SELECT id, totalQuantity, totalSupplierTotal, totalFarmerTotal, totalAgsenseRevenue
  FROM batch_orders
  ORDER BY createdAt DESC
  LIMIT 5;
  ```
- Ensure totals match UI values.

## Checklist

- [ ] Structured logs showing create/update/status events.
- [ ] No console errors in browser dev tools.
- [ ] Batch order tests run and passing.
- [ ] Stress-test script documented for future load testing.

