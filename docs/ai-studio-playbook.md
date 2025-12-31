# Halo Foundry Playbook

Note: Halo Foundry was previously referred to internally as "AI Studio." This document reflects the current canonical name.

This playbook documents operational rails, development processes, and quality standards for Halo Foundry projects.

## Table of Contents

- [Halo Foundry — QA Enforcement & Merge Protection (Source of Truth)](#-halo-foundry--qa-enforcement--merge-protection-source-of-truth)
- [🧭 Halo Foundry — Source of Truth Doctrine](#-halo-foundry--source-of-truth-doctrine)
- [How We Merge Code](#how-we-merge-code)

## 🛡 Halo Foundry — QA Enforcement & Merge Protection (Source of Truth)

Version: v1.0 — QA Rails Locked (Dec 2025)

### Purpose
This section defines how **code quality, QA discipline, and merge safety** are enforced across Halo Foundry projects.  
The goal is to move fast **without regressions**, partner leaks, or architectural drift.

> **Principle:** QA is enforced by systems, not memory.

### Branch Protection Model

#### Protected Branch
- **Default branch only** (typically `main`)
- Feature branches remain flexible
- All enforcement happens **at merge time**

#### Ruleset: `main-branch-protection`

##### Enforcement Status
- **Active**
- **No bypass list**
  - No role, team, or app can skip rules
  - Includes repo owners

> **Rule:** No exceptions, even for founders.

### Required Conditions to Merge

#### 1️⃣ Pull Request Required
- All changes to the default branch **must** go through a PR
- Direct pushes to `main` are blocked

#### 2️⃣ Required Status Checks (Hard Gate)
The following checks **must pass** before merge:

```
CI / lint
CI / test
CI / build
PR Template Compliance / pr-template-compliance
QA Label Enforcement / qa-label-enforcement
```

These enforce:
- Code correctness
- Build integrity
- Mandatory QA documentation
- Regression discipline via labels

#### 3️⃣ Branch Must Be Up to Date
- PR branch must be rebased/merged with latest `main`
- Prevents stale merges

#### 4️⃣ Destructive Actions Blocked
- Force pushes → **Blocked**
- Deletions → **Restricted**

### Review & Approval Policy

#### Required Approvals
- **0 approvals required (current state)**
  - Used while operating as a solo maintainer
  - QA is enforced via CI + policy checks instead
  - When collaborators are added, required approvals should be increased to 1. No other rules change.

> When a regular collaborator is added:
> - Increase required approvals to **1**

#### Disabled (Intentional)
- "Require approval of most recent reviewable push" → OFF  
  (Prevents self-blocking during solo development)

### PR Template Enforcement

All PRs **must** include the standard PR template with these sections:

- **A) Local Gate**
- **B) Mini Regression Gate**
- **C) Full Regression Gate**

Missing sections → PR blocked automatically.

### QA Gate Cadence

#### Local Gate (EVERY PR)
Required:
- `pnpm lint`
- `pnpm test`
- `pnpm build`
- Smoke test of affected flows
- Deployment profile sanity checks

#### Mini Regression Gate (Every 2–3 PRs)
Triggered by label:
```
qa:mini-regression
```

Rules:
- Mini Regression section **cannot** be marked N/A
- Validated by `QA Label Enforcement` check

#### Full Regression Gate (Before deploy / demo / partner exposure)
Triggered by labels:
```
release
qa:full-regression
```

Rules:
- Full Regression section **cannot** be marked N/A
- All critical flows, profiles, and roles must be validated

### Label-Based Enforcement (Automatic)

| Label | Effect |
|-----|------|
| `qa:mini-regression` | Mini Regression section must be completed |
| `qa:full-regression` | Full Regression section must be completed |
| `release` | Full Regression required |

Label enforcement is **section-scoped** to avoid false positives.

### QA Case Definitions
Canonical QA cases live here:
```
docs/qa-cases.md
```

Quick-reference rules:
```
docs/qa-rules.md
```

These documents define:
- Deployment profiles (DEV / CARD_MRI / LANDBANK)
- Artifact visibility rules
- Data edge cases
- Observability & PII safety
- Stop-ship conditions

### Non-Negotiable Rule

> **No QA checkbox, no merge. No exception.**

This is enforced by:
- Branch rules
- CI
- PR template compliance
- Label enforcement

Not by trust or memory.

### Why This Exists
- Prevents silent regressions
- Prevents partner-facing leaks
- Scales with team size
- Survives onboarding, turnover, and pressure

This is how Halo Foundry maintains **velocity with integrity**.

See also: [How We Merge Code](#how-we-merge-code)

---

## 🧭 Halo Foundry — Source of Truth Doctrine

- [GitHub — Execution & Enforcement Source of Truth](#1-github--execution--enforcement-source-of-truth)
- [Google Drive — Canonical Memory & Governance Source of Truth](#2-google-drive--canonical-memory--governance-source-of-truth)
- [ChatGPT — Architectural Reasoning & Orchestration Layer](#3-chatgpt--architectural-reasoning--orchestration-layer)
- [Cursor — High-Velocity Execution Tool](#4-cursor--high-velocity-execution-tool)
- [Conflict Resolution Matrix](#5-conflict-resolution-matrix)
- [Operating Rule (Golden Rule)](#6-operating-rule-golden-rule)
- [When to Use Each Tool (Quick Reference)](#7-when-to-use-each-tool-quick-reference)

---

Halo Foundry operates with three systems, each with a non-overlapping authority.

If two systems disagree, this hierarchy resolves the conflict.

### 1) GitHub — Execution & Enforcement Source of Truth
GitHub is the final authority on what exists and what runs.

GitHub governs:
- Actual code
- CI / QA enforcement
- Branch protection rules
- Workflow names and check names
- Merged PR history
- What is enforced, not what is intended

If it's not in GitHub:
- It is not real
- It is not enforced
- It does not exist operationally

GitHub wins all disputes about behavior.

### 2) Google Drive — Canonical Memory & Governance Source of Truth
Google Drive is the authoritative record of decisions.

Drive governs:
- Canonical State Packets (CSPs)
- Governance decisions
- Architecture boundaries
- Closed PR cycles
- Rationale, not implementation
- What must be remembered long-term

Drive is:
- Immutable once finalized
- Human-readable
- AI-reliable
- Designed to survive team and tool changes

Drive is the memory GitHub intentionally forgets.

### 3) ChatGPT — Architectural Reasoning & Orchestration Layer
ChatGPT is a thinking partner, not a memory store.

ChatGPT governs:
- Architectural reasoning
- Design trade-offs
- PR sequencing
- Risk analysis
- Roadmap shaping
- Prompt generation (Cursor, Manus, QA, CSPs)

Rules:
- ChatGPT does not replace CSPs
- ChatGPT does not override GitHub
- ChatGPT must be re-bootstrapped via CSPs in new threads

ChatGPT thinks. It does not remember.

### 4) Cursor — High-Velocity Execution Tool
Cursor is a code operator, not an authority.

Cursor governs:
- Code generation
- File edits
- Refactors
- Documentation changes
- Applying prompts precisely

Cursor must:
- Follow prompts authored by ChatGPT
- Respect GitHub enforcement
- Never invent governance
- Never rename locked artifacts

Cursor executes. It does not decide.

### 5) Conflict Resolution Matrix
| Conflict | Winner |
|---|---|
| Docs vs GitHub behavior | GitHub |
| ChatGPT vs CSP | CSP (Drive) |
| Cursor output vs Playbook | Playbook |
| Memory vs enforcement | Enforcement |
| Speed vs correctness | Correctness |

### 6) Operating Rule (Golden Rule)
GitHub enforces reality.  
Drive remembers reality.  
ChatGPT reasons about reality.  
Cursor executes reality.

### 7) When to Use Each Tool (Quick Reference)
Use ChatGPT when:
- Sequencing PRs
- Designing governance
- Evaluating trade-offs
- Creating prompts
- Planning architecture

Use Cursor when:
- Implementing a defined PR
- Editing files
- Applying mechanical changes
- Running tests and builds

Use GitHub when:
- Enforcing rules
- Merging code
- Validating behavior
- Reviewing execution truth

Use Google Drive when:
- Closing threads
- Capturing decisions
- Creating CSPs
- Preventing future drift

---

## How We Merge Code

This section defines the operational merge process at Halo Foundry.

See also: [Halo Foundry — QA Enforcement & Merge Protection (Source of Truth)](#-halo-foundry--qa-enforcement--merge-protection-source-of-truth)

### Development Workflow

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
   - Required approvals must be satisfied
   - Address review comments

6. **Merge**:
   - Once all checks pass and approved, merge the PR

### Merge Requirements

All merges to `main` must satisfy:

- ✅ Pull Request Required (no direct pushes)
- ✅ All required status checks passing
- ✅ Branch up to date with `main`
- ✅ PR template completed
- ✅ Local Gate completed and marked PASS
- ✅ Required regression gates completed (if labels present)
- ✅ Required approvals satisfied

### Status Checks

The following checks must pass before merge:

- `CI / lint`: Code linting
- `CI / test`: Unit tests  
- `CI / build`: Build verification
- `PR Template Compliance / pr-template-compliance`: PR template validation
- `QA Label Enforcement / qa-label-enforcement`: QA gate enforcement

### Labels and Regression Gates

- **`qa:mini-regression` label**: Requires Mini Regression Gate completion (cannot be N/A)
- **`qa:full-regression` or `release` label**: Requires Full Regression Gate completion (cannot be N/A)

### Final Rule

> **No QA checkbox, no merge. No exception.**

For detailed PR rules and requirements, see [`CONTRIBUTING.md`](../CONTRIBUTING.md).

---

### PR-14 / PR-15 Cycle — Closed

- Farmacy v0 shipped (GIS-first baseline, learning-loop ready)
- Marketplace v0 shipped (read-only input catalog + tenant price lists)
- All features are feature-flagged and disabled by default
- Governance, CI, QA audits passed; PR-14.1 hotfix verified
- Known deferrals:
  - Marketplace integration tests deferred until orders/payments
  - LoanSuggestion test issue pre-existing and tracked separately

