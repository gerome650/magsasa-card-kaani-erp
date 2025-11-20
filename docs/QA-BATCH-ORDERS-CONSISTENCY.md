# Batch Orders Consistency Checklist

## Data Invariants

- Every `batch_order_items.farmId` must reference an existing `farms.id`.
- `createdByUserId` must match a valid `users.id`.
- Header totals equal the sum of line totals (recomputed server-side).
- Status transitions allowed: `draft → pending_approval`. Other transitions future work.

## Alignment with Farm/Farmer Modules

- Detail view now renders the farm name (via cached farm list) alongside the farm ID, matching FarmDetail labeling.
- Currency display uses the same PHP formatter used in Farm costs/yields pages.
- Status badges reuse the shared badge styles + colors from other status-driven pages.

## Financial Model

- Margin formula applied everywhere:  
  `AgsenseRevenue = (farmerUnitPrice - supplierUnitPrice) * quantityOrdered`.
- List + detail totals show PHP currency with 2 decimals.
- Negative quantities/prices rejected in both client and server validation layers.

## UX Consistency

- List filters (status/date) mirror the filter layout used in Farmers/Farms pages.
- Buttons follow the same primary/secondary styling as Farm CRUD screens.
- Read-only states (approved/cancelled/completed) disable edit/submit buttons just like immutable Farm records.

## Open Questions / Follow-ups

- List view currently shows aggregate totals but not individual farm names. This is acceptable for v1; if PMs request farm previews, add a lightweight items count column or tooltip fed by aggregated data.
- Supplier metadata is optional; if supplier entities become first-class, consider populating supplier names consistently with other modules.

