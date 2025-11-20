# Deploy Checklist – Batch Orders

## Pre-Deploy

- [ ] Confirm latest migrations applied: `pnpm db:push`.
- [ ] Run automated tests: `pnpm vitest run server/batchOrder.test.ts`.
- [ ] Verify `.env` contains `DATABASE_URL`.
- [ ] Review structured logs in staging to ensure no unexpected errors.

## Deploy Steps

1. Build artifacts: `pnpm build`.
2. Deploy server + client bundles via existing pipeline.
3. Apply optional indexes if not already present (see `docs/INDEXES-SQL.sql`).

## Post-Deploy Smoke Test

- [ ] Create a draft batch order (2–3 farms).
- [ ] Confirm it appears in `/batch-orders`.
- [ ] Open detail page, edit a line, save.
- [ ] Submit for approval and ensure status updates everywhere.

## Rollback Considerations

- No schema changes beyond standard migrations; rollback by redeploying previous build.
- Draft orders created post-deploy remain in DB. If new code introduced a regression, operators can continue using existing drafts once patch applied.
- Keep note of reference codes generated during smoke tests for cleanup if necessary.

