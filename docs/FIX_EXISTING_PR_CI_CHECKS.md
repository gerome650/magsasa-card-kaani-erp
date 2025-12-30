# How to Fix Existing PRs with Red CI Checks

## The Problem

Older commits in PR history show red checks because they predate the CI workflow fixes. **Only the latest commit's checks matter** - GitHub branch protection only enforces checks on the latest commit.

## When to Use Which Option

- **Merge main** = Recommended when your PR branch is behind `main`
- **Cherry-pick** = When you want only the CI workflow fixes without other changes from `main`
- **Re-run jobs** = Only if your branch already contains the workflow fix but GitHub shows old check results

## Solution: Update Your PR Branch

### Option 1: Merge main (Recommended)

```bash
git checkout your-pr-branch-name
git fetch origin
git merge origin/main
git push origin your-pr-branch-name
```

If there are merge conflicts, resolve them, then:
```bash
git add .
git commit -m "chore: merge main to update CI workflow"
git push origin your-pr-branch-name
```

### Option 2: Cherry-pick CI fix commits

```bash
# Find the commit hash that fixed CI
git log origin/main --oneline -- .github/workflows/ci.yml | head -1

# Cherry-pick it
git checkout your-pr-branch-name
git cherry-pick <commit-hash>
git push origin your-pr-branch-name
```

### Option 3: Rerun GitHub Actions (if branch already has fixes)

1. Go to your PR on GitHub
2. Click the "Checks" tab
3. Click "Re-run jobs" (or "Re-run failed jobs")

## Verification

```bash
# Verify your branch has the correct workflow
git show origin/main:.github/workflows/ci.yml > /tmp/main-ci.yml
git show HEAD:.github/workflows/ci.yml > /tmp/branch-ci.yml
diff /tmp/main-ci.yml /tmp/branch-ci.yml
# Should show no differences (or only your PR-specific changes)
```

Then check the PR on GitHub: Go to "Checks" tab and verify all checks pass on the latest commit.

## What the Fixed Workflow Includes

- ✅ Docs-only PRs skip lint/test/build and pass
- ✅ Uses `pnpm check` (not `pnpm lint`)
- ✅ Uses `pnpm test -- --passWithNoTests` (passes when no tests exist)
- ✅ pnpm version inferred from `package.json` (no explicit version pin)
- ✅ Proper docs-only detection via `dorny/paths-filter@v3`

## Notes

- **Old commits will always show red** - This is expected and doesn't block merging
- **Only latest commit matters** - Branch protection checks the latest commit only
- **Docs-only PRs should pass** - If your PR only changes docs/.github/README/CONTRIBUTING/.env.example, CI will skip and pass
