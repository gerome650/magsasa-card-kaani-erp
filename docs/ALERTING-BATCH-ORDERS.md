# Alerting Strategy – Batch Orders

## Signals to Monitor

| Signal | Trigger | Rationale |
| --- | --- | --- |
| Create failures | ≥ 5 failures within 10 min | Indicates DB/validation issues blocking operations. |
| Update failures | ≥ 5 failures within 10 min | Managers stuck in draft/pending approval stage. |
| Slow list endpoint | p95 latency > 800 ms for 15 min | Usually tied to missing indexes or runaway filters. |
| DB errors on `batch_orders` tables | Any spike above baseline | Could indicate schema drift or connectivity loss. |

## Implementation Notes

- Structured logs now capture create/update/status events; ingestion systems can aggregate counts without code changes.
- When metrics pipeline exists, emit counters: `batch_order_created_total`, `batch_order_status_transition_total`, `batch_order_mutation_failed_total`.
- Alert routing: start with Slack #ops (business hours) + PagerDuty (after-hours) once metrics wired up.

## Runbook References

- `docs/RUNBOOK-BATCH-ORDERS.md` for recovery steps.
- `docs/FAILURE-SCENARIOS-BATCH-ORDERS.md` for known failure modes.

## Future Enhancements

- Add anomaly detection on ratio of drafts vs. pending approvals per day.
- Include supplier-level breakdowns once supplier entities mature.

