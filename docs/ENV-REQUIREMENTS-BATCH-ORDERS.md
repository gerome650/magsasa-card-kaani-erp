# Environment Requirements – Batch Orders

## Configuration

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | MySQL connection string (required for all CRUD). |
| `GOOGLE_AI_STUDIO_API_KEY` | Only needed for KaAni chat; Batch Orders unaffected but still part of server env. |

## Database

- Tables: `batch_orders`, `batch_order_items`.
- Apply migrations via `pnpm db:push`.
- Optional indexes documented in `docs/INDEXES-SQL.sql`.

## Dependencies

- Farms/farmers must exist (batch order items validate farm IDs).
- Auth: user context provided via existing auth middleware (no extra config).
- No feature flag; Batch Orders pages enabled for `manager` and `field_officer` roles.

## Local Setup Checklist

1. `cp .env.template .env` and fill DB credentials.
2. Run migrations.
3. Seed farms (`scripts/seed-farms.mjs`) or load sample data.
4. Start server: `pnpm dev`.
5. Access UI at `http://localhost:5173/batch-orders`.

