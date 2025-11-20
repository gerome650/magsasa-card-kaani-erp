# Farm Detail View – Deployment Checklist

**Last Updated**: Pass 8 – Production Readiness  
**Use This For**: Staging → Production pushes of Farm Detail (or any deployment that affects `farms.getById` / `/farms/:id`)

---

## 1. Pre-Deploy Checks

- [ ] **Migrations applied**: `pnpm db:migrate` (verify `farms`, `yields`, `costs`, `boundaries`, `users` tables + indexes)
- [ ] **Seed / demo data plan**: Decide whether to seed a heavy farm (use `pnpm generate:heavy-farm`) for post-deploy validation
- [ ] **Environment variables match** `docs/ENV-REQUIREMENTS-FARMDETAIL.md`
  - `DATABASE_URL`, `JWT_SECRET`, `VITE_FRONTEND_FORGE_API_KEY`, etc.
- [ ] **Auth configuration tested**: Confirm `protectedProcedure` routes still require a valid session
- [ ] **Feature flags / routing**: Ensure `/farms/:id` is enabled in the target environment
- [ ] **Monitoring dashboards ready**: Farm Detail panels added to latency/error SLO dashboards
- [ ] **Rollback artifact available**: Previous Docker image / release tag is available for instant revert

---

## 2. Smoke Tests (Post-Deploy)

1. **Basic access**
   - [ ] Log in as a normal user and open `/farms/{id}` for a typical farm (5–20 yields/costs)
   - [ ] Verify farm header, yields table, costs table, profitability card, and boundaries/map render
2. **Heavy scenario**
   - [ ] Open the seeded heavy farm (200+ yields, 150+ costs)
   - [ ] Scroll through pagination (“Show More”) and confirm UI remains responsive
   - [ ] Confirm profitability/summary stats render without NaN/Infinity
3. **Error handling**
   - [ ] Navigate to `/farms/0` or a non-existent ID → expect “Farm not found” message
   - [ ] Temporarily revoke access (e.g., remove session cookie) → expect redirect or auth error
4. **Map & boundaries**
   - [ ] Draw a parcel and trigger the Save button (expect success toast/alert)
   - [ ] Export boundaries (GeoJSON/KML) and verify download prompt appears

> Record screenshots or console logs for each smoke test in case of regression triage.

---

## 3. Monitoring & Alert Verification

- [ ] Confirm `farmdetail_metric` JSON logs appear in the logging backend within 1 minute of opening a farm
- [ ] Verify `view_started`, `view_completed`, `view_failed` events all show up when expected
- [ ] Check latency dashboard:
  - p95 for `farms.getById` remains < 1 s after deploy (per `docs/SLO-FARMDETAIL.md`)
- [ ] Check error-rate dashboard:
  - Ensure no unexpected spike in `errorCategory: "db_error"` or `"validation_error"`
- [ ] Confirm alert routing is active (P1/P2/P3 definitions from `docs/ALERTING-FARMDETAIL.md`)

---

## 4. Rollback & Disable Procedure

**Rollback to previous build**
1. Redeploy the last known-good image/tag (document the tag in change management ticket).
2. Run smoke tests again to confirm recovery.

**Emergency disable (without revert)**
1. Update the API to short-circuit `farms.getById` (return “temporarily unavailable”) or
2. Use the gateway/feature flag to block `/farms/:id` temporarily.
3. Add a banner in the UI (optional) if the outage is user-visible.

**Post-rollback**
- [ ] File/Update the incident ticket with details
- [ ] Schedule a postmortem using `docs/POSTMORTEM-TEMPLATE-FARMDETAIL.md`
- [ ] Restore Farm Detail only after the root cause is addressed

---

Keep this checklist alongside the release runbook. If new dependencies are added (e.g., new metrics, new sub-services), update both this file and `docs/ENV-REQUIREMENTS-FARMDETAIL.md`.


