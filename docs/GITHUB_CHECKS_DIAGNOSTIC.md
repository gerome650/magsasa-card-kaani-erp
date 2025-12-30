# GitHub Checks Diagnostic Report

**Issue**: Docs-only PR shows "Checks (0)" or "Expected — Waiting for status to be reported"  
**Repository**: magsasa-card-kaani-erp  
**PR**: #8 (docs-only, branch: pr-docs-source-of-truth → main)

---

## Root Cause Summary

**Most Likely Cause**: Branch protection ruleset/configuration mismatch between required check names and actual workflow job names, OR GitHub Actions approval required for workflows.

**Secondary Causes**:
1. Workflows require manual approval (Actions → General → Workflow permissions)
2. Ruleset configuration error (wrong branch targeting, missing PR scope)
3. Workflow files not present in default branch (`main`)

---

## Evidence from Workflow Files

### ✅ Workflow Configuration (Correct)

**CI Workflow** (`.github/workflows/ci.yml`):
- Workflow name: `CI`
- Jobs: `lint`, `test`, `build`
- Expected check names: `CI / lint`, `CI / test`, `CI / build`
- Triggers: `pull_request` on `main`, `develop`
- No `paths-ignore` filters

**PR Template Compliance** (`.github/workflows/pr-template-compliance.yml`):
- Workflow name: `PR Template Compliance`
- Job: `pr-template-compliance`
- Expected check name: `PR Template Compliance / pr-template-compliance`
- Triggers: `pull_request` (opened, edited, synchronize)

**QA Label Enforcement** (`.github/workflows/qa-label-enforcement.yml`):
- Workflow name: `QA Label Enforcement`
- Job: `qa-label-enforcement`
- Expected check name: `QA Label Enforcement / qa-label-enforcement`
- Triggers: `pull_request` (opened, edited, synchronize, labeled, unlabeled)

### Expected Check Names (from CONTRIBUTING.md and Playbook):
1. `CI / lint`
2. `CI / test`
3. `CI / build`
4. `PR Template Compliance / pr-template-compliance`
5. `QA Label Enforcement / qa-label-enforcement`

**Format**: `<Workflow Name> / <Job Name>`

---

## Recommended Fix (Step-by-Step)

### Step 1: Verify GitHub Actions Are Enabled

**Location**: Repository Settings → Actions → General

1. Navigate to: `https://github.com/<org>/magsasa-card-kaani-erp/settings/actions`
2. Check **"Allow all actions and reusable workflows"** is selected
3. Under **"Workflow permissions"**, ensure:
   - ✅ **"Read and write permissions"** OR **"Read repository contents and packages permissions"**
   - ✅ **"Allow GitHub Actions to create and approve pull requests"** (if needed)

### Step 2: Check Workflow Approval Requirements

**Location**: Repository Settings → Actions → General → Workflow permissions

1. Scroll to **"Workflow approval"** section
2. If **"Require approval for all outside collaborators"** is enabled:
   - For docs-only PRs from forks, workflows may require manual approval
   - **Fix**: Either approve the workflow run manually OR disable this setting for trusted collaborators

### Step 3: Verify Branch Protection / Ruleset Configuration

**Location A** (Legacy Branch Protection):  
Repository Settings → Branches → Branch protection rules → `main`

**Location B** (Rulesets - New):  
Repository Settings → Rules → Rulesets → Find ruleset targeting `main`

#### Check Required Status Checks:

**If using Legacy Branch Protection:**
1. Scroll to **"Require status checks to pass before merging"**
2. Verify these exact check names are listed (case-sensitive):
   - `CI / lint`
   - `CI / test`
   - `CI / build`
   - `PR Template Compliance / pr-template-compliance`
   - `QA Label Enforcement / qa-label-enforcement`
3. ✅ **Fix**: If check names are missing or misspelled, add/update them

**If using Rulesets:**
1. Open the ruleset targeting `main`
2. Navigate to **"Rules" → "Status checks"**
3. Verify the same 5 check names are listed exactly
4. ✅ **Fix**: Add missing checks or correct spelling

**Common Mistakes to Fix:**
- ❌ `CI/lint` (missing spaces) → ✅ `CI / lint`
- ❌ `ci / lint` (wrong case) → ✅ `CI / lint`
- ❌ `lint` (missing workflow prefix) → ✅ `CI / lint`
- ❌ `PR Template Compliance/pr-template-compliance` (missing space) → ✅ `PR Template Compliance / pr-template-compliance`

### Step 4: Verify Workflow Files Exist in Default Branch

1. Navigate to: `https://github.com/<org>/magsasa-card-kaani-erp/tree/main/.github/workflows`
2. Verify all 3 workflow files exist:
   - `ci.yml`
   - `pr-template-compliance.yml`
   - `qa-label-enforcement.yml`
3. ✅ **Fix**: If missing, merge workflow files to `main` branch

### Step 5: Re-trigger Workflows (if needed)

**Option A**: Close and reopen the PR
- Close PR #8
- Reopen PR #8
- This triggers `pull_request` event → workflows should run

**Option B**: Push an empty commit to the PR branch
```bash
git commit --allow-empty -m "ci: trigger workflows"
git push
```

**Option C**: Re-run workflows manually (if they show as failed/skipped)
- Go to PR #8 → "Checks" tab
- Click "Re-run" on any workflow that shows as skipped/failed

---

## Verification Steps

### Immediate Verification (After Fix):

1. **Navigate to PR #8**: `https://github.com/<org>/magsasa-card-kaani-erp/pull/8`
2. **Click "Checks" tab**
3. **Expected Result**: Should show 5 checks (not "Checks (0)"):
   - `CI / lint` → Status: ✅ passing or ⏳ running
   - `CI / test` → Status: ✅ passing or ⏳ running
   - `CI / build` → Status: ✅ passing or ⏳ running
   - `PR Template Compliance / pr-template-compliance` → Status: ✅ passing or ⏳ running
   - `QA Label Enforcement / qa-label-enforcement` → Status: ✅ passing or ⏳ running

4. **Check PR merge status**:
   - Should show: "All checks have passed" OR "X of Y checks required"
   - Should NOT show: "Checks (0)" or "Expected — Waiting for status"

### Workflow Run Verification:

1. Navigate to: `https://github.com/<org>/magsasa-card-kaani-erp/actions`
2. **Expected**: See recent workflow runs for PR #8:
   - `CI` workflow run (with jobs: lint, test, build)
   - `PR Template Compliance` workflow run
   - `QA Label Enforcement` workflow run
3. If workflows show as "Skipped", click on the run → check "Why was this workflow run skipped?"

---

## Optional Hardening (If Issue Persists)

### If Workflows Still Don't Run:

1. **Check Repository Visibility**:
   - Settings → General → Repository visibility
   - Private repos may have additional restrictions

2. **Verify Actions Runner**:
   - Actions → Runners
   - Ensure GitHub-hosted runners are available (should be default)

3. **Check Organization-Level Settings** (if applicable):
   - Organization Settings → Actions → General
   - Ensure actions are not restricted at org level

4. **Review Workflow Logs** (if workflows run but fail):
   - Actions → Click on failed workflow → Review job logs
   - Common issues: missing dependencies, permission errors, syntax errors

### If Check Names Mismatch:

**Temporary Workaround** (NOT RECOMMENDED):
- Add both old and new check names to branch protection (if migrating)
- Remove old names after confirming new names work

**Preferred Fix**:
- Update branch protection to use exact check names from workflow files
- Verify format: `<Workflow Name> / <Job Name>` (with spaces)

---

## Quick Diagnostic Checklist

- [ ] GitHub Actions enabled (Settings → Actions → General)
- [ ] Workflow permissions allow running workflows
- [ ] Workflow approval not required (or approved manually)
- [ ] Workflow files exist in `main` branch (`.github/workflows/*.yml`)
- [ ] Branch protection/ruleset lists all 5 required checks with exact names:
  - [ ] `CI / lint`
  - [ ] `CI / test`
  - [ ] `CI / build`
  - [ ] `PR Template Compliance / pr-template-compliance`
  - [ ] `QA Label Enforcement / qa-label-enforcement`
- [ ] Check names match format: `<Workflow Name> / <Job Name>` (spaces included)
- [ ] PR has been reopened or new commit pushed (to trigger workflows)
- [ ] Actions → Recent runs show workflows executing for PR #8

---

## Most Likely Root Cause

**#1 Most Common**: Check names in branch protection/ruleset don't match workflow job names exactly (case-sensitive, spacing matters).

**#2 Most Common**: GitHub Actions require approval for outside collaborators (if PR is from a fork or external contributor).

**#3 Most Common**: Workflow files don't exist in the default branch (`main`), so GitHub doesn't recognize them.

---

## Notes

- This diagnostic assumes workflows are correctly configured in code (✅ verified)
- All fixes are UI-only (no code changes required)
- Workflows should run on docs-only PRs (no `paths-ignore` filters exist)
- If issue persists after following all steps, check GitHub status page for Actions outages

