# Farm Detail View - Postmortem Template

**Purpose**: Fill-in-the-blanks template for incidents involving Farm Detail View  
**Usage**: Complete this template within 48 hours of incident resolution

---

## Summary

**[2-3 sentences, non-technical]**

**Example**: "On [DATE], Farm Detail View experienced [ISSUE] affecting [NUMBER] users. The issue was [RESOLUTION] after [DURATION]. Root cause was [BRIEF CAUSE]."

---

## Impact

### Who Was Affected

- [ ] Internal admins only
- [ ] Branch managers
- [ ] Loan officers
- [ ] Field officers
- [ ] End users (farmers)
- [ ] Downstream reports/dashboards
- [ ] Other: _________________

### Time Window

- **Detection**: [DATE/TIME]
- **Start of Impact**: [DATE/TIME]
- **Mitigation**: [DATE/TIME]
- **Resolution**: [DATE/TIME]
- **Total Duration**: [DURATION]

### Severity

- [ ] P1 (Critical) - Farm Detail completely unavailable, all farms failing
- [ ] P2 (Warning) - Degraded performance, high error rates, some farms failing
- [ ] P3 (Info) - Single farm failure, no pattern, minor performance issues

### Metrics

- **Views Affected**: [NUMBER]
- **Failed Views**: [NUMBER]
- **Error Rate**: [PERCENTAGE]%
- **Average Latency**: [MILLISECONDS]ms (normal: < 1000ms for p95)
- **SLO Violations**: [YES/NO]

---

## Timeline

### Detection

**[DATE/TIME]** - [HOW WAS IT DETECTED?]
- [ ] Alert triggered (`FarmDetail_Critical_High_Error_Rate`, `FarmDetail_Critical_DB_Connection_Failure`, etc.)
- [ ] User reported issue
- [ ] Monitoring dashboard showed anomaly
- [ ] On-call engineer noticed spike in logs
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

**Logs/Metrics Reviewed**:
- [ ] `farmdetail_metric` events
- [ ] `[FarmDetail]` logs
- [ ] `[FarmDetailPerf]` logs
- [ ] `[FarmDetailIntegrity]` logs
- [ ] Database query logs
- [ ] Application server logs

### Mitigation

**[DATE/TIME]** - [MITIGATION ACTIONS]

1. [ACTION TAKEN]
2. [ACTION TAKEN]

**Mitigation Duration**: [DURATION] (time from detection to mitigation)

**Mitigation Actions**:
- [ ] Restarted application servers
- [ ] Restarted database service
- [ ] Rolled back deployment
- [ ] Scaled resources (CPU, memory, connections)
- [ ] Disabled feature temporarily
- [ ] Other: _________________

### Resolution

**[DATE/TIME]** - [RESOLUTION ACTIONS]

1. [ACTION TAKEN]
2. [ACTION TAKEN]

**Resolution Duration**: [DURATION] (time from mitigation to full resolution)

---

## Root Cause

### Technical Root Cause

**[DETAILED EXPLANATION]**

**Example**: "Database connection pool was exhausted due to [REASON]. This caused all `farms.getById` requests to fail with 'Database connection not available' errors, resulting in 100% error rate for Farm Detail View."

### Contributing Factors

- [ ] Monitoring gap (alert didn't fire, or fired too late)
- [ ] Unclear documentation (users didn't know how to report)
- [ ] Insufficient guardrails (should have prevented this)
- [ ] Recent code changes (deployment, config change)
- [ ] Infrastructure issue (database, network, server)
- [ ] Data quality issue (corrupted data, missing indexes)
- [ ] Performance degradation (slow queries, missing indexes)
- [ ] Other: _________________

### Why It Wasn't Prevented

**[EXPLANATION]**

**Example**: "The connection pool limit was set too low for expected load. Load testing didn't simulate concurrent Farm Detail views from multiple users. The alert threshold was too high (5% error rate), so it didn't fire until the issue was severe."

---

## What Went Well

### Systems That Helped

- [ ] Alerts fired correctly
- [ ] Logs provided clear information
- [ ] Runbook was helpful
- [ ] Metrics showed the issue clearly
- [ ] Database backups were available
- [ ] Structured metrics (`farmdetail_metric`) made diagnosis easier
- [ ] Error categorization (`errorCategory`) helped identify root cause
- [ ] Other: _________________

**[DETAILS]**

### Processes That Helped

- [ ] On-call engineer responded quickly
- [ ] Escalation path worked
- [ ] Communication was clear
- [ ] Rollback procedure was smooth
- [ ] Runbook steps were accurate
- [ ] Other: _________________

**[DETAILS]**

---

## What Went Wrong

### Detection Issues

- [ ] Alert didn't fire
- [ ] Alert fired too late
- [ ] Alert was noisy (false positive)
- [ ] No alert configured for this scenario
- [ ] Detection delay was too long
- [ ] Other: _________________

**[DETAILS]**

### Investigation Issues

- [ ] Logs were unclear or missing
- [ ] Metrics were insufficient
- [ ] Runbook didn't cover this scenario
- [ ] Documentation was outdated
- [ ] Error messages were not helpful
- [ ] Other: _________________

**[DETAILS]**

### Resolution Issues

- [ ] Mitigation took too long
- [ ] Rollback procedure was unclear
- [ ] Communication was delayed
- [ ] Escalation path was unclear
- [ ] Root cause was not identified quickly
- [ ] Other: _________________

**[DETAILS]**

---

## Action Items

### Short-Term Fixes (≤ 1 Week)

| Action Item | Owner | Due Date | Status |
|------------|-------|----------|--------|
| [ACTION] | [OWNER] | [DATE] | [ ] To Do / [ ] In Progress / [ ] Done |
| [ACTION] | [OWNER] | [DATE] | [ ] To Do / [ ] In Progress / [ ] Done |
| [ACTION] | [OWNER] | [DATE] | [ ] To Do / [ ] In Progress / [ ] Done |

**Examples**:
- Fix connection pool limit
- Add missing alert
- Update runbook with new scenario
- Improve error message
- Add missing database index

### Medium-Term Improvements (1-4 Weeks)

| Action Item | Owner | Due Date | Status |
|------------|-------|----------|--------|
| [ACTION] | [OWNER] | [DATE] | [ ] To Do / [ ] In Progress / [ ] Done |
| [ACTION] | [OWNER] | [DATE] | [ ] To Do / [ ] In Progress / [ ] Done |

**Examples**:
- Add automated testing for this scenario
- Improve monitoring dashboards
- Refactor error handling
- Add rate limiting
- Improve database query performance

### Long-Term / Nice-to-Haves (1+ Months)

| Action Item | Owner | Due Date | Status |
|------------|-------|----------|--------|
| [ACTION] | [OWNER] | [DATE] | [ ] To Do / [ ] In Progress / [ ] Done |
| [ACTION] | [OWNER] | [DATE] | [ ] To Do / [ ] In Progress / [ ] Done |

**Examples**:
- Implement circuit breaker pattern
- Add comprehensive integration tests
- Improve data quality monitoring
- Add predictive alerting
- Refactor architecture for better scalability

---

## SLO / Error Budget Impact

### SLO Violations

**Availability SLO (99.5%)**:
- **Target**: 99.5% of Farm Detail views complete successfully
- **Actual**: [PERCENTAGE]%
- **Violation**: [ ] YES / [ ] NO
- **Duration**: [DURATION]
- **Calculation**: `(view_completed / (view_started - view_failed)) * 100`

**Latency SLO (p95 < 1s)**:
- **Target**: 95% of `farms.getById` requests complete in < 1 second
- **Actual**: [PERCENTAGE]% (p95: [MILLISECONDS]ms)
- **Violation**: [ ] YES / [ ] NO
- **Affected Views**: [NUMBER]
- **Calculation**: `P95(durationMs) < 1000`

**Data Correctness SLO**:
- **Target**: 
  - 95% of active farms have at least one yield record
  - 90% of farms have valid coordinates
  - 98% of farms have at least one crop type listed
- **Actual**: 
  - Yields: [PERCENTAGE]%
  - Coordinates: [PERCENTAGE]%
  - Crops: [PERCENTAGE]%
- **Violation**: [ ] YES / [ ] NO
- **Calculation**: From `hasYields`, `hasCosts`, `hasCoordinates` in metrics

### Error Budget Consumption

**Monthly Error Budget**: 0.5% of total Farm Detail views

- **Views This Month**: [NUMBER]
- **Error Budget**: [NUMBER] failures allowed
- **Failures This Incident**: [NUMBER]
- **Remaining Budget**: [NUMBER]
- **Budget Exhausted**: [ ] YES / [ ] NO

**Calculation**:
- If 10,000 views/month: Budget = 50 failures
- If incident caused 30 failures: Remaining = 20 failures

**Latency Error Budget**: 5% of requests can exceed p95 target

- **Requests This Month**: [NUMBER]
- **Latency Budget**: [NUMBER] requests allowed to exceed 1s
- **Exceeded This Incident**: [NUMBER]
- **Remaining Budget**: [NUMBER]
- **Budget Exhausted**: [ ] YES / [ ] NO

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

### Prevention Strategies

1. [STRATEGY 1]
2. [STRATEGY 2]
3. [STRATEGY 3]

---

## Related Documentation

- `docs/SLO-FARMDETAIL.md` - Service Level Objectives
- `docs/ALERTING-FARMDETAIL.md` - Alert definitions
- `docs/RUNBOOK-FARMDETAIL.md` - Incident response playbook
- `docs/ENGINEERING-NOTES-FARMDETAIL.md` - Technical deep dive
- `docs/FAILURE-SCENARIOS-FARMDETAIL.md` - Failure simulation guide

---

## Postmortem Metadata

- **Incident ID**: [ID]
- **Postmortem Date**: [DATE]
- **Postmortem Author**: [NAME]
- **Reviewed By**: [NAME]
- **Status**: [ ] DRAFT / [ ] REVIEWED / [ ] APPROVED

---

**Template Version**: 1.0  
**Last Updated**: Pass 6 - Ops, Training & Postmortem

