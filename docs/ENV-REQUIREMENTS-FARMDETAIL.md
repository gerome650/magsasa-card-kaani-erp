# Farm Detail View – Environment & Dependency Requirements

**Last Updated**: Pass 8 – Production Readiness  
**Scope**: All runtime dependencies required for the Farm Detail View (`server/routers.ts` → `farms.getById`, `client/src/pages/FarmDetail.tsx`)

---

## 1. Environment Variables

| Variable | Example | Purpose | Notes |
| --- | --- | --- | --- |
| `DATABASE_URL` | `mysql://user:pass@127.0.0.1:3306/magsasa_demo` | Primary MySQL connection used by Drizzle (`farms`, `yields`, `costs`, `boundaries`, `users`) | **Required** before starting the API server |
| `JWT_SECRET` | `super-secure-secret` | Session cookie signing for `protectedProcedure` routes (Farm Detail is auth-protected) | Must match the value used by the auth service |
| `OAUTH_SERVER_URL` | `https://auth.magsasa-card.com` | OAuth issuer used by auth middleware | Needed so on-call can reproduce auth-required flows |
| `OWNER_OPEN_ID` | `demo-admin` | Seed/admin user reference for local/dev | Used by auth bootstrap scripts |
| `NODE_ENV` | `production` | Enables production logging + disables DEV-only integrity logs | Farm Detail integrity warnings only log when `NODE_ENV !== production` |
| `PORT` | `3000` | API port (via `server/index.ts`) | Optional unless deploying behind custom gateway |
| `VITE_FRONTEND_FORGE_API_KEY` | `forge_live_xxx` | Google Maps proxy key used by `MapView` component inside Farm Detail | Required to load parcel boundaries / map |
| `VITE_FRONTEND_FORGE_API_URL` | `https://forge.butterfly-effect.dev` | Optional override for the Maps proxy base URL | Defaults to the public Forge instance |
| `VITE_ANALYTICS_ENDPOINT` | `https://analytics.magsasa-card.com/api/event` | Optional analytics endpoint if telemetry is enabled | Farm Detail can operate without analytics |
| `VITE_ANALYTICS_WEBSITE_ID` | `farm-detail` | Optional analytics site identifier | Pair with the endpoint above |

> **Tip**: When adding new environment variables for Farm Detail, always update this document and the deployment checklist.

---

## 2. Database Tables & Seed Data

Farm Detail reads from the following tables (via Drizzle):

- `farms` – primary farm metadata (size, crops, coordinates, farmer name/id)
- `users` – farmer / owner records (used to link `farms.userId`)
- `yields` – historical harvest records (used for tables + profitability)
- `costs` – expense records (fertilizer, labor, etc.)
- `boundaries` – parcel polygons displayed on the map (optional but recommended)

**Seed data / scripts**:

- `scripts/generate-heavy-farm.ts` – creates a heavy test farm (200+ yields, 150+ costs)
- `scripts/generate-demo-data.ts` – broader demo dataset (optional)

---

## 3. Required Indexes & Performance Notes

| Table | Index | Purpose / Notes |
| --- | --- | --- |
| `yields` | `idx_yields_farmId` | Ensures `getYieldsByFarmId(farmId)` remains sub-50 ms even for 300+ rows |
| `costs` | `idx_costs_farmId` | Mirrors the yield index but for costs |
| `farms` | Primary key `id` + (optional) `idx_farms_name_farmerName` | PK is required; composite index helps admin imports + Farm Detail lookups |
| `boundaries` | `idx_boundaries_farmId` (recommended) | Speeds up parcel lookups for farms with >10 boundaries |

All indexes should already exist in production; verify before go-live if the schema was recently migrated.

---

## 4. Authentication & Routing Dependences

- `farms.getById` is registered under the `appRouter` in `server/routers.ts` and uses `protectedProcedure`.
- Session cookie relies on `JWT_SECRET` and the auth middleware defined in `server/_core`.
- The Farm Detail page (`/farms/:id`) expects that:
  - The user is authenticated (session cookie set).
  - The `trpc` client has a valid base URL (configured globally).
  - The Farmers list / Map View routes remain intact (integrity checks compare against `farms.list` and `mapList`).

---

## 5. External Services

- **Google Maps Platform** – accessed via Forge proxy.
  - Requires `VITE_FRONTEND_FORGE_API_KEY` (maps key stored server-side).
  - Optional `VITE_FRONTEND_FORGE_API_URL` override if a custom proxy is deployed.
- **Analytics (optional)** – only if your deployment captures telemetry using the shared analytics helper.

---

## 6. Verification Checklist

Before deploying Farm Detail to a new environment:

1. [ ] Validate all environment variables above are present (use `env.example` or `doppler` to confirm).
2. [ ] Run `pnpm db:migrate` (or equivalent) to ensure the latest tables/indexes exist.
3. [ ] Seed at least one farm with yields/costs to test the UI (use `generate-heavy-farm.ts` for stress cases).
4. [ ] Confirm Forge proxy credentials are live (map should load tiles + allow drawing parcels).
5. [ ] Confirm authenticated access works (Farm Detail should redirect to login if session missing).

---

This document should be updated whenever Farm Detail gains new external dependencies, environment variables, or database requirements. Let Ops know if a change here requires new secrets in the deployment pipeline.


