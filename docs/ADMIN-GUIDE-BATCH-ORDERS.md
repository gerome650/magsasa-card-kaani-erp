# Admin Guide – Batch Orders

Audience: Operations managers and support agents helping field officers with Agri Input Batch Orders.

## Key Concepts

- **Batch Order**: Aggregated purchase for multiple farms under the margin model.
- **Statuses**:
  - `draft`: Editable by managers.
  - `pending_approval`: Submitted; awaits approval workflow (future phase).
  - `approved/cancelled/completed`: Read-only snapshots for audit.

## Daily Tasks

1. **View/Search Orders**
   - Navigate to `/batch-orders`.
   - Filter by status or expected delivery date.
   - Click a row to open the detail page.

2. **Interpret Totals**
   - `Total Quantity`: Sum of all line quantities.
   - `Total Supplier Cost`: Amount due to suppliers.
   - `Total Billed to Farmers`: Farmer-facing total.
   - `AgSense Revenue`: Margin captured (per-unit margin × quantity).

3. **Edit Drafts**
   - Allowed only while status is `draft`.
   - Update delivery date, line quantities, and prices.
   - Save changes; totals recompute server-side.

4. **Submit for Approval**
   - From the detail page, click **Submit for Approval**.
   - Status flips to `pending_approval`, locking edits.

## Common Support Cases

| Issue | Resolution |
| --- | --- |
| Wrong quantity/price | Reopen draft (if still editable) or create correcting order. |
| Missing farm | Ensure farm exists in `/farms`; re-add line item after creation. |
| Delivery date too old | Respect the “not older than 2 days” rule; adjust date. |
| Cannot edit | Check status; only `draft`/`pending_approval` are mutable. |

## Escalation

- If multiple creates fail, follow `docs/RUNBOOK-BATCH-ORDERS.md`.
- Capture reference codes + timestamps for engineering review (structured logs include the same identifiers).

