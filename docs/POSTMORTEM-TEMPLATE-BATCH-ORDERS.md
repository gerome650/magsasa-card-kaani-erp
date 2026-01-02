# Postmortem Template – Batch Orders

## 1. Summary
- **Date/Time:**
- **Reported By:**
- **Impact:** (e.g., unable to create batch orders, incorrect totals shown)

## 2. Timeline
| Time | Event |
| --- | --- |
| hh:mm | Detection |
| hh:mm | Mitigation start |
| hh:mm | Resolution |

## 3. Impact Details
- Affected reference codes:
- Number of failed requests or users impacted:
- Financial exposure (if any):

## 4. Root Cause
- Technical explanation (DB outage, validation bug, etc.)
- Supporting evidence (logs, metrics, screenshots)

## 5. Resolution
- What fixed the issue?
- Temporary vs. permanent fix?

## 6. Action Items
| Owner | Task | Priority | Due Date |
| --- | --- | --- | --- |
|  |  |  |  |

## 7. Detection Evaluation
- How was the issue detected?
- Did existing alerts fire? If not, why?

## 8. Lessons Learned
- What went well?
- What could be improved?

## 9. Attachments
- Links to logs, dashboards, JIRA tickets, etc.

> **Hint:** For common incidents (e.g., `batchOrder.create` failure spike), include log snippets such as `source=batchOrder.router event=create.error` for quick root-cause validation.

