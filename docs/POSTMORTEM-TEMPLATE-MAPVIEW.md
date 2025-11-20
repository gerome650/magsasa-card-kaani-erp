# Map View - Postmortem Template

**Purpose**: Fill-in-the-blanks template for Map View incidents  
**Instructions**: Complete all sections after an incident, then store in `docs/postmortems/`  
**Last Updated**: Pre-Production QA

---

## Incident Summary

**Date**: YYYY-MM-DD  
**Duration**: X hours Y minutes  
**Severity**: P1 / P2 / P3  
**Status**: Resolved / Mitigated / Ongoing

**Brief Description**:
[One-sentence summary of what happened]

**Affected Users**:
- [Number] users affected
- [Percentage] of Map View requests failed
- [Geographic regions] affected (if applicable)

---

## Timeline

### Detection

**Time**: YYYY-MM-DD HH:MM:SS  
**Detected By**: [Alert / User Report / Monitoring]  
**Initial Symptoms**: [What was observed]

### Triage

**Time**: YYYY-MM-DD HH:MM:SS  
**Triage Actions**:
- [ ] Checked server logs for `[MapView]` errors
- [ ] Verified database connectivity
- [ ] Ran `farms.consistencyCheck` endpoint
- [ ] Checked for recent deployments
- [ ] Verified other pages (Dashboard, Analytics) status

**Initial Assessment**: [What was the initial hypothesis?]

### Mitigation

**Time**: YYYY-MM-DD HH:MM:SS  
**Mitigation Actions**:
- [Action 1]
- [Action 2]
- [Action 3]

**Mitigation Result**: [Did it work? Partial/full recovery?]

### Resolution

**Time**: YYYY-MM-DD HH:MM:SS  
**Resolution Actions**:
- [Action 1]
- [Action 2]
- [Action 3]

**Verification**: [How was resolution confirmed?]

---

## Impact

### User Impact

- **Map View Unavailable**: [Duration]
- **Error Rate**: [Percentage] of requests failed
- **Affected Features**: [List features that were affected]

### SLO Impact

**Availability SLO** (Target: 99.5% monthly):
- **Before Incident**: [Percentage]
- **During Incident**: [Percentage]
- **After Incident**: [Percentage]
- **Error Budget Consumed**: [Percentage]

**Latency SLO** (Target: p95 < 1s for `farms.mapList`):
- **Before Incident**: p95 = [X]ms
- **During Incident**: p95 = [X]ms
- **After Incident**: p95 = [X]ms

**Data Correctness SLO** (Target: `missingCoordinatePercentage <= 10%`):
- **Before Incident**: [Percentage]
- **During Incident**: [Percentage] (if applicable)
- **After Incident**: [Percentage]

### Business Impact

- **User Complaints**: [Number]
- **Support Tickets**: [Number]
- **Revenue Impact**: [If applicable]
- **Reputation Impact**: [If applicable]

---

## Root Cause

**Primary Root Cause**:
[Detailed explanation of what caused the incident]

**Technical Details**:
- [Code path / system component involved]
- [Error messages / logs that indicate root cause]
- [Database queries / API calls that failed]

**Why It Happened**:
- [Systemic issue? One-off bug? Configuration error?]

---

## Contributing Factors

**Factors that made the incident worse or harder to resolve**:

1. **Factor 1**: [Description]
2. **Factor 2**: [Description]
3. **Factor 3**: [Description]

**Examples**:
- Lack of monitoring/alerting for this specific scenario
- Insufficient documentation for troubleshooting
- No runbook procedure for this type of incident
- Recent code changes that introduced the issue
- Database performance degradation
- Network issues

---

## Detection

### Alerts That Fired

- **Alert Name**: [P1/P2/P3] - [Description]
- **Time**: YYYY-MM-DD HH:MM:SS
- **Action Taken**: [What was done in response]

### Alerts That Should Have Fired (But Didn't)

- **Missing Alert**: [Description]
- **Why It Didn't Fire**: [Reason]
- **Action Item**: [How to add this alert]

### Monitoring Gaps

- [What metrics/logs were missing that would have helped detect this earlier?]

---

## What Worked Well

**Things that helped during the incident**:

1. **Monitoring/Alerting**: [What alerts or monitoring helped?]
2. **Documentation**: [What docs were useful?]
3. **Team Response**: [What went well in the response?]
4. **Tools/Processes**: [What tools or processes helped?]

---

## What Didn't Work Well

**Things that hindered resolution or made the incident worse**:

1. **Monitoring/Alerting**: [What was missing or unclear?]
2. **Documentation**: [What docs were missing or outdated?]
3. **Team Response**: [What could have been better?]
4. **Tools/Processes**: [What tools or processes were lacking?]

---

## Action Items

| Priority | Action Item | Owner | Due Date | Status |
|----------|------------|-------|----------|--------|
| P1 | [Critical fix to prevent recurrence] | [Name] | YYYY-MM-DD | [ ] |
| P1 | [Critical monitoring/alerting gap] | [Name] | YYYY-MM-DD | [ ] |
| P2 | [Important improvement] | [Name] | YYYY-MM-DD | [ ] |
| P2 | [Documentation update] | [Name] | YYYY-MM-DD | [ ] |
| P3 | [Nice-to-have improvement] | [Name] | YYYY-MM-DD | [ ] |
| P3 | [Process improvement] | [Name] | YYYY-MM-DD | [ ] |

**Action Item Details**:

**P1 - [Action Item Name]**:
- **Description**: [Detailed description]
- **Rationale**: [Why this is critical]
- **Implementation Notes**: [How to implement]

**P2 - [Action Item Name]**:
- **Description**: [Detailed description]
- **Rationale**: [Why this is important]
- **Implementation Notes**: [How to implement]

---

## Lessons Learned

**Key Takeaways**:

1. [Lesson 1]
2. [Lesson 2]
3. [Lesson 3]

**What We'll Do Differently Next Time**:

1. [Change 1]
2. [Change 2]
3. [Change 3]

---

## Follow-Up

**Post-Incident Review Date**: YYYY-MM-DD  
**Review Attendees**: [Names]  
**Review Outcome**: [Summary of discussion]

**Action Items Status**:
- [ ] All P1 items completed
- [ ] All P2 items completed
- [ ] All P3 items completed or deferred

---

## Related Documents

- **Runbook**: `docs/RUNBOOK-MAPVIEW.md`
- **SLOs**: `docs/SLO-MAPVIEW.md`
- **Alerting**: `docs/ALERTING-MAPVIEW.md`
- **Engineering Notes**: `docs/ENGINEERING-NOTES-MAPVIEW.md`

---

**Postmortem Completed By**: [Name]  
**Date**: YYYY-MM-DD  
**Reviewed By**: [Name]  
**Date**: YYYY-MM-DD

---

**Template Version**: 1.0  
**Last Updated**: Pre-Production QA
