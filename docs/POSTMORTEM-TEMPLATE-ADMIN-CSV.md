# Admin CSV Upload - Postmortem Template

**Purpose**: Fill-in-the-blanks template for incidents involving Admin CSV Upload  
**Usage**: Complete this template within 48 hours of incident resolution

---

## Summary

**[2-3 sentences, non-technical]**

**Example**: "On [DATE], Admin CSV Upload feature experienced [ISSUE] affecting [NUMBER] admin users. The issue was [RESOLUTION] after [DURATION]. Root cause was [BRIEF CAUSE]."

---

## Impact

### Who Was Affected

- [ ] Internal admins only
- [ ] Downstream reports/dashboards
- [ ] Partner banks (CARD MRI, LandBank)
- [ ] End users (farmers, field officers)
- [ ] Other: _________________

### Time Window

- **Detection**: [DATE/TIME]
- **Start of Impact**: [DATE/TIME]
- **Mitigation**: [DATE/TIME]
- **Resolution**: [DATE/TIME]
- **Total Duration**: [DURATION]

### Severity

- [ ] P1 (Critical) - System down, all imports failing
- [ ] P2 (Warning) - Degraded performance, high error rates
- [ ] P3 (Info) - Single import failure, no pattern

### Metrics

- **Imports Affected**: [NUMBER]
- **Failed Imports**: [NUMBER]
- **Error Rate**: [PERCENTAGE]%
- **Average Latency**: [SECONDS] (normal: 15-60s for small, 2-3min for large)

---

## Timeline

### Detection

**[DATE/TIME]** - [HOW WAS IT DETECTED?]
- [ ] Alert triggered (`admin_csv_system_down`, `admin_csv_high_error_rate`, etc.)
- [ ] Admin reported issue
- [ ] Monitoring dashboard showed anomaly
- [ ] Other: _________________

**Detection Delay**: [DURATION] (time from start of impact to detection)

### Investigation

**[DATE/TIME]** - [INVESTIGATION STEPS]

1. [ACTION TAKEN]
2. [ACTION TAKEN]
3. [ACTION TAKEN]

**Key Findings**:
- [FINDING 1]
- [FINDING 2]
- [FINDING 3]

### Mitigation

**[DATE/TIME]** - [MITIGATION ACTIONS]

1. [ACTION TAKEN]
2. [ACTION TAKEN]

**Mitigation Duration**: [DURATION] (time from detection to mitigation)

### Resolution

**[DATE/TIME]** - [RESOLUTION ACTIONS]

1. [ACTION TAKEN]
2. [ACTION TAKEN]

**Resolution Duration**: [DURATION] (time from mitigation to full resolution)

---

## Root Cause

### Technical Root Cause

**[DETAILED EXPLANATION]**

**Example**: "Database connection pool was exhausted due to [REASON]. This caused all new import requests to fail with 'Database connection not available' errors."

### Contributing Factors

- [ ] Monitoring gap (alert didn't fire, or fired too late)
- [ ] Unclear documentation (admins didn't know how to report)
- [ ] Insufficient guardrails (should have prevented this)
- [ ] Recent code changes (deployment, config change)
- [ ] Infrastructure issue (database, network, server)
- [ ] Other: _________________

### Why It Wasn't Prevented

**[EXPLANATION]**

**Example**: "The connection pool limit was set too low for expected load. Load testing didn't simulate concurrent imports from multiple admins."

---

## What Went Well

### Systems That Helped

- [ ] Alerts fired correctly
- [ ] Logs provided clear information
- [ ] Runbook was helpful
- [ ] Metrics showed the issue clearly
- [ ] Database backups were available
- [ ] Other: _________________

**[DETAILS]**

### Processes That Helped

- [ ] On-call engineer responded quickly
- [ ] Escalation path worked
- [ ] Communication was clear
- [ ] Rollback procedure was smooth
- [ ] Other: _________________

**[DETAILS]**

---

## What Went Wrong

### Detection Issues

- [ ] Alert didn't fire
- [ ] Alert fired too late
- [ ] Alert was noisy (false positive)
- [ ] No alert configured for this scenario
- [ ] Other: _________________

**[DETAILS]**

### Investigation Issues

- [ ] Logs were unclear or missing
- [ ] Metrics were insufficient
- [ ] Runbook didn't cover this scenario
- [ ] Documentation was outdated
- [ ] Other: _________________

**[DETAILS]**

### Resolution Issues

- [ ] Mitigation took too long
- [ ] Rollback procedure was unclear
- [ ] Communication was delayed
- [ ] Escalation path was unclear
- [ ] Other: _________________

**[DETAILS]**

---

## Action Items

### Short-Term Fixes (≤ 1 Week)

| Action Item | Owner | Due Date | Status |
|------------|-------|----------|--------|
| [ACTION] | [OWNER] | [DATE] | [ ] TODO / [ ] IN PROGRESS / [ ] DONE |
| [ACTION] | [OWNER] | [DATE] | [ ] TODO / [ ] IN PROGRESS / [ ] DONE |
| [ACTION] | [OWNER] | [DATE] | [ ] TODO / [ ] IN PROGRESS / [ ] DONE |

**Examples**:
- Fix connection pool limit
- Add missing alert
- Update runbook with new scenario
- Improve error message

### Medium-Term Improvements (1-4 Weeks)

| Action Item | Owner | Due Date | Status |
|------------|-------|----------|--------|
| [ACTION] | [OWNER] | [DATE] | [ ] TODO / [ ] IN PROGRESS / [ ] DONE |
| [ACTION] | [OWNER] | [DATE] | [ ] TODO / [ ] IN PROGRESS / [ ] DONE |

**Examples**:
- Add automated testing for this scenario
- Improve monitoring dashboards
- Refactor error handling
- Add rate limiting

### Long-Term / Nice-to-Haves (1+ Months)

| Action Item | Owner | Due Date | Status |
|------------|-------|----------|--------|
| [ACTION] | [OWNER] | [DATE] | [ ] TODO / [ ] IN PROGRESS / [ ] DONE |
| [ACTION] | [OWNER] | [DATE] | [ ] TODO / [ ] IN PROGRESS / [ ] DONE |

**Examples**:
- Move to async processing
- Add comprehensive integration tests
- Implement circuit breaker pattern
- Add admin training program

---

## SLO / Error Budget Impact

### SLO Violations

**Availability SLO (99.5%)**:
- **Target**: 99.5% of imports complete without system errors
- **Actual**: [PERCENTAGE]%
- **Violation**: [ ] YES / [ ] NO
- **Duration**: [DURATION]

**Latency SLO (95% within time limits)**:
- **Target**: 95% of imports finish within time limits
- **Actual**: [PERCENTAGE]%
- **Violation**: [ ] YES / [ ] NO
- **Affected Imports**: [NUMBER]

**Correctness SLO (99% valid rows processed)**:
- **Target**: 99% of valid rows processed successfully
- **Actual**: [PERCENTAGE]%
- **Violation**: [ ] YES / [ ] NO
- **Affected Rows**: [NUMBER]

### Error Budget Consumption

**Monthly Error Budget**: 0.5% of total imports

- **Imports This Month**: [NUMBER]
- **Error Budget**: [NUMBER] failures allowed
- **Failures This Incident**: [NUMBER]
- **Remaining Budget**: [NUMBER]
- **Budget Exhausted**: [ ] YES / [ ] NO

**Calculation**:
- If 1,000 imports/month: Budget = 5 failures
- If incident caused 3 failures: Remaining = 2 failures

---

## Lessons Learned

### What We Learned

1. [LESSON 1]
2. [LESSON 2]
3. [LESSON 3]

### What We'll Do Differently

1. [CHANGE 1]
2. [CHANGE 2]
3. [CHANGE 3]

---

## Related Documentation

- `docs/SLO-ADMIN-CSV.md` - Service Level Objectives
- `docs/ALERTING-ADMIN-CSV.md` - Alert definitions
- `docs/RUNBOOK-ADMIN-CSV.md` - Incident response playbook
- `docs/ENGINEERING-NOTES-ADMIN-CSV.md` - Technical deep dive

---

## Postmortem Metadata

- **Incident ID**: [ID]
- **Postmortem Date**: [DATE]
- **Postmortem Author**: [NAME]
- **Reviewed By**: [NAME]
- **Status**: [ ] DRAFT / [ ] REVIEWED / [ ] APPROVED

---

**Template Version**: 1.0  
**Last Updated**: Production Go-Live

