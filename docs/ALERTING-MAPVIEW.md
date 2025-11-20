# Map View - Alerting Design

**Date**: Pre-Production QA  
**Feature**: Map View Observability & Metrics  
**Status**: ✅ Defined

---

## Overview

This document defines alerting rules for the Map View feature. Alerts are vendor-agnostic and use structured JSON logs emitted by `recordMapViewMetric()` that can be scraped by Loki, Prometheus, Datadog, or any log aggregation system.

---

## Alert Architecture

**Metrics Source**: Structured JSON logs via `recordMapViewMetric()`
- **Format**: `{ type: "mapview_metric", event: "consistency_check", ts: "...", ...payload }`
- **Scraping**: Logs are parsed and converted to metrics by monitoring stack
- **No PII**: Only counts and percentages, no farmer names, emails, or raw barangay names

**Alert Evaluation**: Continuous monitoring of metrics extracted from logs

---

## Alert Definitions

### P1 (Critical) - Immediate Response Required

#### P1-1: High Missing Coordinate Percentage

**Condition**: 
```
missingCoordinatePercentage > 20% for 15+ consecutive minutes
```

**Severity**: P1 (Critical)

**Description**: More than 20% of farms are missing coordinates, indicating a significant data quality issue that could affect Map View usability.

**Action**:
1. Page on-call engineer immediately
2. Create P1 incident ticket
3. Notify #maps-data-quality channel
4. If not acknowledged within 15 minutes, escalate to engineering lead

**Recovery**: 
- Investigate root cause (data import issue, coordinate validation failure, etc.)
- Fix missing coordinates or identify farms that legitimately don't have coordinates
- Verify fix via `farms.consistencyCheck` endpoint

**Example Log Query** (Loki/Prometheus):
```
{type="mapview_metric", event="consistency_check"} 
| json 
| missingCoordinatePercentage > 20 
| duration > 15m
```

---

#### P1-2: Map View API Unavailable

**Condition**:
```
Availability < 99% for 5+ consecutive minutes
OR
No successful responses from farms.mapList in last 5 minutes
```

**Severity**: P1 (Critical)

**Description**: Map View API is down or returning errors, preventing users from accessing the map.

**Action**:
1. Page on-call engineer immediately
2. Check server logs for errors
3. Verify database connectivity
4. Check for recent deployments or configuration changes

**Recovery**:
- Restart service if needed
- Check database connection pool
- Verify tRPC router is functioning
- Rollback deployment if issue introduced recently

---

### P2 (High) - Response Required Within 4 Hours

#### P2-1: Elevated Missing Coordinate Percentage

**Condition**:
```
missingCoordinatePercentage > 10% for 60+ consecutive minutes
```

**Severity**: P2 (High)

**Description**: More than 10% of farms are missing coordinates, indicating a data quality issue that should be investigated.

**Action**:
1. Create incident ticket
2. Notify #maps-data-quality channel
3. Investigate root cause during business hours
4. If not resolved within 4 hours, escalate to P1

**Recovery**:
- Review recent data imports
- Check coordinate validation logic
- Identify farms missing coordinates
- Plan fix (batch update or exclude from Map View)

---

#### P2-2: Latency Degradation

**Condition**:
```
p95 latency > 1s for farms.mapList for >5% of requests over 30 minutes
OR
p95 latency > 1.5s for farms.consistencyCheck for >5% of requests over 30 minutes
```

**Severity**: P2 (High)

**Description**: Map View API is experiencing performance degradation, affecting user experience.

**Action**:
1. Create incident ticket
2. Check database query performance
3. Review recent code changes
4. Check for database connection pool exhaustion

**Recovery**:
- Optimize slow queries
- Add database indexes if needed
- Scale database connection pool
- Review viewport-based rendering logic

---

### P3 (Medium) - Response Required Within 24 Hours

#### P3-1: Monitoring Pipeline Issue

**Condition**:
```
No mapview_metric(consistency_check) events in last 60 minutes
AND
farms.mapList is responding successfully
```

**Severity**: P3 (Medium)

**Description**: Metrics are not being emitted, indicating a monitoring/log pipeline issue (not a service issue).

**Action**:
1. Notify on-call engineer
2. Check log aggregation system (Loki/Prometheus/Datadog)
3. Verify log scraping is working
4. Check for log pipeline configuration changes

**Recovery**:
- Restart log scraping service if needed
- Verify log format hasn't changed
- Check for log volume issues (rate limiting, etc.)

---

#### P3-2: Crop/Barangay Mismatch

**Condition**:
```
(distinctCropsTotal - distinctCropsWithCoordinates) > 5% of distinctCropsTotal
OR
(distinctBarangaysTotal - distinctBarangaysWithCoordinates) > 5% of distinctBarangaysTotal
for 60+ consecutive minutes
```

**Severity**: P3 (Medium)

**Description**: Significant number of crop types or barangays exist in Dashboard/Analytics but not in Map View, likely due to missing coordinates.

**Action**:
1. Create ticket for data quality review
2. Investigate which crops/barangays are affected
3. Determine if missing coordinates are expected (e.g., farms in different regions)

**Recovery**:
- Update coordinate data for affected farms
- Or document that certain farms legitimately don't have coordinates
- Update data quality documentation

---

## Alert Integration

### Recommended Integration Points

**Loki** (Log Aggregation):
- Parse `{type="mapview_metric"}` logs
- Extract metrics via JSON parsing
- Create alerts based on metric values

**Prometheus** (Metrics):
- Scrape logs and convert to Prometheus metrics
- Use `promtail` or similar to extract metrics from logs
- Create alert rules based on metric thresholds

**Datadog** (APM):
- Parse structured JSON logs
- Create custom metrics from log fields
- Set up monitors based on metric values

### Alert Channel Routing

- **P1 Alerts**: → PagerDuty / On-call rotation
- **P2 Alerts**: → Slack #maps-data-quality channel + Incident ticket
- **P3 Alerts**: → Slack #maps-data-quality channel

---

## Alert Testing

### Manual Testing

1. **Trigger P1 Alert**:
   - Temporarily set `missingCoordinatePercentage` to 25% in test data
   - Run `farms.consistencyCheck`
   - Verify alert fires within 15 minutes

2. **Trigger P2 Alert**:
   - Temporarily set `missingCoordinatePercentage` to 15% in test data
   - Run `farms.consistencyCheck`
   - Verify alert fires within 60 minutes

3. **Trigger P3 Alert**:
   - Stop emitting `mapview_metric` logs (temporarily)
   - Verify alert fires after 60 minutes

### Alert Validation Checklist

- [ ] P1 alerts page on-call engineer
- [ ] P2 alerts create incident tickets
- [ ] P3 alerts notify appropriate channels
- [ ] Alert messages include relevant context (counts, percentages)
- [ ] Alert messages do not contain PII
- [ ] Alerts auto-resolve when condition no longer met

---

## Alert Tuning

**Initial Thresholds**: Based on expected data quality and performance characteristics

**Tuning Process**:
1. Monitor alert frequency for first 30 days
2. Adjust thresholds if too sensitive (too many false positives) or too lenient (missed issues)
3. Document threshold changes and rationale

**Expected Alert Frequency**:
- **P1**: < 1 per month (critical issues only)
- **P2**: < 5 per month (data quality issues)
- **P3**: < 10 per month (monitoring issues, minor data quality)

---

## Related Documents

- `docs/SLO-MAPVIEW.md` - Service Level Objectives
- `docs/QA-MAPVIEW-CONSISTENCY.md` - Consistency validation details
- `docs/RUNBOOK-MAPVIEW.md` - Incident response procedures (future)

---

**Last Updated**: Pre-Production QA  
**Version**: 1.0

