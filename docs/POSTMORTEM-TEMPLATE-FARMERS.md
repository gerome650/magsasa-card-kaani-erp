# Farmers Feature - Postmortem Template

**Use this template after any incident related to farmer counts, data consistency, or the Farmers feature.**

---

## Incident Summary

**Date**: [YYYY-MM-DD]  
**Duration**: [Start time] - [End time]  
**Severity**: [P1/P2/P3]  
**Status**: [Resolved / Mitigated / Ongoing]

**Brief Description**: [One-line summary of what happened]

---

## Impact

### User Impact
- **Affected Users**: [Number or description]
- **User-Facing Symptoms**: [What users saw - e.g., "Dashboard showed 0 farmers", "Farmers page crashed"]
- **Business Impact**: [e.g., "Unable to generate farmer reports", "Analytics dashboard unusable"]

### System Impact
- **Affected Components**: [e.g., "Farmers page", "Dashboard", "Analytics"]
- **Error Rates**: [If available - e.g., "100% of farmer list queries failed"]
- **Performance Impact**: [e.g., "Page load time increased from 2s to 30s"]

---

## Timeline

| Time | Event |
|------|-------|
| [HH:MM] | [Initial detection / user report] |
| [HH:MM] | [Investigation started] |
| [HH:MM] | [Root cause identified] |
| [HH:MM] | [Fix deployed / mitigation applied] |
| [HH:MM] | [Incident resolved] |

---

## Root Cause

**Primary Cause**: [What directly caused the incident]

**Contributing Factors**:
- [Factor 1]
- [Factor 2]

**Technical Details**:
- [Code path, query, configuration that failed]
- [Database state that caused the issue]
- [Any relevant logs or error messages]

---

## What Went Well

- [Positive aspect 1 - e.g., "Error handling prevented data corruption"]
- [Positive aspect 2 - e.g., "Logging helped identify root cause quickly"]

---

## What Went Wrong

- [Issue 1 - e.g., "No monitoring alert for farmer count discrepancies"]
- [Issue 2 - e.g., "Error message was not user-friendly"]
- [Issue 3 - e.g., "Database query was not optimized for large datasets"]

---

## Action Items

| Action | Owner | Priority | Due Date | Status |
|--------|-------|----------|----------|--------|
| [Action item 1] | [Name] | [P1/P2/P3] | [Date] | [ ] TODO / [ ] IN PROGRESS / [ ] DONE |
| [Action item 2] | [Name] | [P1/P2/P3] | [Date] | [ ] TODO / [ ] IN PROGRESS / [ ] DONE |
| [Action item 3] | [Name] | [P1/P2/P3] | [Date] | [ ] TODO / [ ] IN PROGRESS / [ ] DONE |

**Short-term (This Week)**:
- [Immediate fix or mitigation]

**Medium-term (This Month)**:
- [Process improvement or code change]

**Long-term (This Quarter)**:
- [Architectural change or monitoring improvement]

---

## Prevention

**How can we prevent this from happening again?**

- [Prevention measure 1 - e.g., "Add monitoring alert for farmer count discrepancies"]
- [Prevention measure 2 - e.g., "Add integration test for farmer count consistency"]
- [Prevention measure 3 - e.g., "Document expected behavior in admin guide"]

---

## Lessons Learned

- [Lesson 1]
- [Lesson 2]

---

## Related Incidents

- [Link to related incident or similar past incident]

---

## SLO / Error Budget Impact

**If applicable**:
- **SLO Violated**: [Which SLO - e.g., "Availability SLO (99.5%)"]
- **Error Budget Consumed**: [Percentage or amount]
- **Remaining Budget**: [Percentage or amount]

---

## Sign-Off

**Incident Commander**: [Name]  
**Technical Lead**: [Name]  
**Date**: [YYYY-MM-DD]

---

## Appendix

### Relevant Logs
```
[Paste relevant log snippets here]
```

### Database Queries Run
```sql
-- [Paste SQL queries used during investigation]
```

### Code Changes
- [Link to PR or commit that fixed the issue]

---

**Template Version**: 1.0  
**Last Updated**: Pre-Production QA

