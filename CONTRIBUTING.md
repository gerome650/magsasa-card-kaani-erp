# Contributing to MAGSASA-CARD ERP

## Feature Flags

- `FARMACY_ENABLED` / `VITE_FARMACY_ENABLED`  
  Enables Farmacy (GIS-first soil health recommendations)

- `MARKETPLACE_ENABLED` / `VITE_MARKETPLACE_ENABLED`  
  Enables Marketplace (input catalog and price lists)

Thank you for contributing to the MAGSASA-CARD ERP project! This document outlines the contribution process and requirements.

## Pull Request Rules (Non-Negotiable)

These rules are enforced by CI and must be followed for all pull requests.

### 1. PR Template Required
- Every PR must use the PR template (`.github/pull_request_template.md`)
- The PR body must include all required sections:
  - PR Summary
  - Linked Context
  - Scope
  - Risk Notes
  - QA Checklist (A, B, C sections)
  - Reviewer Checklist
- **No exception**: PRs without the template will be blocked by CI

### 2. Local Gate Required
- Every PR must pass the Local Gate checklist:
  - [ ] Lint passes
  - [ ] Tests pass
  - [ ] Build succeeds
  - [ ] Smoke test completed
  - [ ] DEPLOYMENT_PROFILE check completed
- Mark the Local Gate result as ✅ **PASS** or explain if blocked
- **No exception**: PRs that fail Local Gate cannot merge

### 3. CI Checks Required
- All CI status checks must pass (exact check names):
  - `CI / lint`: Code linting
  - `CI / test`: Unit tests
  - `CI / build`: Build verification
  - `PR Template Compliance / pr-template-compliance`: PR template validation
  - `QA Label Enforcement / qa-label-enforcement`: QA gate enforcement
- **No exception**: PRs with failing CI checks cannot merge

### 4. Labels Enforce Regression Gates
- **`qa:mini-regression` label**: Mini Regression Gate cannot be marked N/A
  - If this label is present, you must complete the Mini Regression Gate checklist
  - Mark status as ✅ **PASS** or ❌ **FAIL** (not N/A)
- **`qa:full-regression` or `release` label**: Full Regression Gate cannot be marked N/A
  - If either label is present, you must complete the Full Regression Gate checklist
  - Mark status as ✅ **PASS** or ❌ **FAIL** (not N/A)
- **No exception**: PRs that violate label requirements will be blocked by CI

### 5. No Direct Pushes to Main
- All changes must go through pull requests
- Main branch is protected
- **No exception**: Direct pushes to main are blocked

---

## Development Workflow

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and commit:
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

3. **Push and create a PR**:
   ```bash
   git push origin feature/your-feature-name
   ```
   Then create a PR on GitHub using the PR template.

4. **Complete the PR template**:
   - Fill out all required sections
   - Complete the Local Gate checklist
   - Complete regression gates if labels are present

5. **Wait for CI and reviews**:
   - All CI checks must pass
   - At least one approval required
   - Address review comments

6. **Merge**:
   - Once all checks pass and approved, merge the PR

---

## Code Style

- Follow existing code style and patterns
- Use TypeScript for type safety
- Add tests for new functionality
- Update documentation as needed
- Keep commits focused and atomic

---

## Testing

### Running Tests
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests for specific file
pnpm test path/to/file.test.ts
```

### Writing Tests
- Write unit tests for new functions
- Write integration tests for new features
- Aim for >80% code coverage
- Test edge cases and error conditions

---

## Branch Protection Setup

**For repository administrators**: Configure these settings in GitHub Settings → Branches → Branch protection rules for `main`:

- [ ] **Require pull request reviews before merging**
  - [ ] Require approvals: 1 (or more as needed)
- [ ] **Require status checks to pass before merging**
  - [ ] Add these required checks (exact names):
    - `CI / lint`
    - `CI / test`
    - `CI / build`
    - `PR Template Compliance / pr-template-compliance`
    - `QA Label Enforcement / qa-label-enforcement`
  - [ ] Require branches to be up to date before merging
- [ ] **Do not allow bypassing the above settings**
- [ ] **Restrict who can push to matching branches** (admin only)
- [ ] **Block force pushes**
- [ ] **Block deletions**

These status checks will block PRs from merging until all checks pass.

---

## Suggested GitHub PR Searches

Use these searches to find PRs that need attention:

### Find Release PRs
```
is:pr is:open label:release
```
This finds PRs tagged for release (require Full Regression Gate).

### Find Mini Regression PRs
```
is:pr is:open label:qa:mini-regression
```
This finds PRs tagged for mini regression testing.

---

## Every 3rd PR Rule

**Recommended practice**: Add label `qa:mini-regression` to every 3rd PR.

Example cadence:
- PR-12: Add `qa:mini-regression` label → Complete Mini Regression Gate
- PR-13: No label → Mark Mini Regression Gate as N/A
- PR-14: No label → Mark Mini Regression Gate as N/A
- PR-15: Add `qa:mini-regression` label → Complete Mini Regression Gate
- (and so on...)

**For release PRs**: Always add `release` or `qa:full-regression` label → Complete Full Regression Gate

---

## Final Lock Rule

**No QA checkbox, no merge. No exception.**

Every PR must have:
- ✅ Local Gate completed and marked PASS
- ✅ All CI checks passing
- ✅ Required regression gates completed (if labels present)
- ✅ PR template fully filled out

PRs that do not meet these requirements will be automatically blocked by CI.

---

## Questions?

If you have questions about the contribution process:
1. Check this document first
2. Check `docs/qa-cases.md` for QA definitions
3. Check `docs/qa-rules.md` for QA gate rules
4. Ask in team discussions or create an issue

Thank you for contributing! 🎉

