# KAANI_ROLES_v1

Purpose: Define the minimum “workflow contract” roles for KaAni hardening so work stays bounded, reversible, and BSP-friendly (anonymous-first → identity link later).

## Role 1 — Decision Maker (CEO)
**Primary responsibility:** Freeze scope + constraints, prevent drift.

**Owns**
- Sprint scope (what’s in / out)
- Compliance posture (anonymous-first, no PII in farmer_profiles; identity linking later with consent)
- Approval/merge authority (may delegate merges to John)

**Does not do**
- Implementation details, refactors, “nice-to-haves” during hardening

**Definition of Done (for each PR)**
- PR matches stated objective
- No scope creep
- Constraints honored (reversible migrations, minimal diffs)

---

## Role 2 — Implementer (Cursor)
**Primary responsibility:** Convert a bounded task into code, migrations, and minimal docs—nothing else.

**Owns**
- Implementing the exact task objective as described
- Keeping diffs minimal and reversible
- Following repo conventions (Drizzle + MySQL patterns, file structure, naming)

**Hard rules**
- No unrelated refactors (“while I’m here…” is not allowed)
- No schema changes that break existing flows unless explicitly authorized
- No PII storage in Phase 1 anonymous tables

**Outputs required per PR**
- List of files changed
- Migration commands to run locally
- Any follow-up steps (seed/backfill only if strictly necessary)

---

## Role 3 — Reviewer / QA Gate (Cursor review + John optional)
**Primary responsibility:** Enforce guardrails and catch drift before merge.

**Owns checks for**
- Migration safety: runs clean, reversible where possible, correct FK/indexes
- Data posture: no PII in farmer_profiles; identity linking separated with consent fields
- Type correctness: Drizzle ↔ MySQL compatibility (enums/decimals/json/timestamps)
- Minimality: no unrelated changes, no wide refactors, no formatting-only churn
- Basic flow safety: existing tables and endpoints still compile and run

**Approval criteria**
- Guardrails satisfied
- No drift from PR objective
- Verified migration + app startup + minimal smoke checks

---

## Role 4 — Release Operator (John/CEO)
**Primary responsibility:** Run migrations and verify the deployment in the target environment.

**Owns**
- Running migrations in staging/prod
- Verifying app boots + core KaAni flow is functional
- Rollback readiness (knows how to revert or mitigate issues)

**Release checklist (minimum)**
- Backup / snapshot confirmed (if applicable)
- Migration applied successfully
- Service health checks pass
- Smoke test: create profile → generate recommendation (if implemented) → confirm DB rows
- Rollback plan documented in PR notes (even if “manual revert + hotfix”)

---

## Operating principle
Hardening is executed as small, bounded PRs:
1 objective → 1 implementation task → 1 review gate → merge/release → stop.

Repo is the source of truth. Documentation exists only to prevent ambiguity and drift.
