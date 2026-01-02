# Environment Requirements – Batch Orders

## Configuration

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | MySQL connection string (required for all CRUD). |
| `GOOGLE_AI_STUDIO_API_KEY` | Only needed for KaAni chat; Batch Orders unaffected but still part of server env. |
| `VITE_FRONTEND_FORGE_API_KEY` | **Frontend only:** Required for Farm Map View tiles (`/map` route). Set in `.env.local` for local dev. Must never be committed to git. See `docs/MAP-SETUP.md` for Google Cloud configuration steps. |

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
2. **For Farm Map View:** Create `.env.local` in project root and add:
   ```
   VITE_FRONTEND_FORGE_API_KEY=your_dev_map_token_here
   ```
   **Important:** `.env.local` is git-ignored. Never commit real tokens.
3. Run migrations.
4. Seed farms (`scripts/seed-farms.mjs`) or load sample data.
5. Start server: `pnpm dev`.
6. Access UI at `http://localhost:5173/batch-orders`.
7. **Map View:** Access `/map` - if token is set, tiles and markers render. If missing, dev banner shows (metrics still work).

