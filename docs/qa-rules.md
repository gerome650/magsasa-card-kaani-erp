# QA Rules

Quick reference for QA gate requirements. See `docs/qa-cases.md` for detailed test cases.

See also: [Halo Foundry Playbook — QA Enforcement & Merge Protection](ai-studio-playbook.md#-halo-foundry--qa-enforcement--merge-protection-source-of-truth)

## Every PR: Local Gate

**Required for all PRs, no exceptions.**

Complete the Local Gate checklist in the PR template:
- [ ] Lint passes
- [ ] Tests pass
- [ ] Build succeeds
- [ ] Smoke test completed
- [ ] DEPLOYMENT_PROFILE check completed

Mark result as ✅ **PASS** or explain if blocked.

---

## Every 3rd PR: Mini Regression (Recommended)

**Suggested practice**: Add label `qa:mini-regression` to every 3rd PR (PR-12, PR-15, PR-18, etc.).

When this label is present:
- Mini Regression Gate **cannot** be marked N/A
- Must complete all scenarios in the Mini Regression Gate checklist
- Mark result as ✅ **PASS** or ❌ **FAIL**

**Purpose**: Catch regressions early without full test suite overhead.

---

## Any Partner Demo/Deploy: Full Regression (Required)

**Required**: Add label `release` or `qa:full-regression` for:
- Partner demos
- Production deployments
- Major feature releases
- Breaking changes

When this label is present:
- Full Regression Gate **cannot** be marked N/A
- Must complete all scenarios in the Full Regression Gate checklist
- Mark result as ✅ **PASS** or ❌ **FAIL**

**Purpose**: Ensure production readiness and prevent regressions.

---

## Label Summary

| Label | When to Use | Gate Requirement |
|-------|-------------|------------------|
| `qa:mini-regression` | Every 3rd PR (recommended) | Mini Regression Gate required (not N/A) |
| `qa:full-regression` | Major changes, demos | Full Regression Gate required (not N/A) |
| `release` | Production deployments | Full Regression Gate required (not N/A) |

---

## Quick Checklist

Before merging any PR:
- [ ] Local Gate completed and marked PASS
- [ ] All CI checks passing
- [ ] If `qa:mini-regression` label: Mini Regression Gate completed (not N/A)
- [ ] If `release` or `qa:full-regression` label: Full Regression Gate completed (not N/A)
- [ ] PR template fully filled out

**No QA checkbox, no merge. No exception.**

For detailed test cases and scenarios, see `docs/qa-cases.md`.

