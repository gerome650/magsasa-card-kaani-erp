# Admin CSV Upload - Alerting Design

## Overview

This document defines alerting rules for the Admin CSV Upload feature. Alerts are designed to be **vendor-agnostic** and can be implemented using any monitoring stack (Loki + Grafana, Datadog, New Relic, CloudWatch, etc.).

## Alert Definitions

### P1: System Down (Critical)

**Alert Name**: `admin_csv_system_down`

**Trigger Condition**:
- **Signal**: All imports failing with system-level errors
- **Threshold**: 3+ consecutive `import_failed` events with `errorMessage` containing "System error" or "Database connection" in 5 minutes
- **Severity**: P1 (Critical)

**Alert Logic**:
```
count(admin_csv_metric{metric="import_failed", errorMessage=~"System error.*|Database connection.*"}) >= 3
AND
time_range = 5 minutes
```

**Actions**:
1. Page on-call engineer immediately
2. Check database connectivity
3. Check application server health
4. Review recent deployments

**Resolution**:
- System recovers when imports start succeeding again
- Alert auto-resolves after 10 minutes of successful imports

---

### P2: High Error Rate (Warning)

**Alert Name**: `admin_csv_high_error_rate`

**Trigger Condition**:
- **Signal**: High rate of failed imports or high error counts
- **Threshold**: 
  - More than 5 `import_failed` events in 1 hour, OR
  - More than 10% of imports have `errorCount > 0` in 1 hour
- **Severity**: P2 (Warning)

**Alert Logic**:
```
# Option 1: Count of failed imports
count(admin_csv_metric{metric="import_failed"}) >= 5
AND
time_range = 1 hour

# Option 2: High error rate
rate(admin_csv_metric{metric="import_completed", errorCount>0}) / 
rate(admin_csv_metric{metric="import_completed"}) >= 0.10
AND
time_range = 1 hour
```

**Actions**:
1. Notify on-call engineer (non-paging)
2. Review logs for `[AdminCSV]` entries
3. Check for common patterns (validation errors, reference errors)
4. Review recent CSV uploads

**Resolution**:
- Alert resolves when error rate drops below threshold
- May require admin training or CSV format fixes

---

### P2: Slow Import Alert (Warning)

**Alert Name**: `admin_csv_slow_import`

**Trigger Condition**:
- **Signal**: Imports exceeding SLO thresholds
- **Threshold**:
  - Small imports (<5K rows): `durationSeconds > 60` for 3+ imports in 1 hour
  - Large imports (≥5K rows): `durationSeconds > 300` (5 minutes) for 2+ imports in 1 hour
- **Severity**: P2 (Warning)

**Alert Logic**:
```
# Small imports
count(admin_csv_metric{metric="import_completed", rowCount<5000, durationSeconds>60}) >= 3
AND
time_range = 1 hour

# Large imports
count(admin_csv_metric{metric="import_completed", rowCount>=5000, durationSeconds>300}) >= 2
AND
time_range = 1 hour
```

**Actions**:
1. Notify on-call engineer (non-paging)
2. Check database performance (slow queries, connection pool)
3. Check server resources (CPU, memory)
4. Review database indexes

**Resolution**:
- Alert resolves when import times return to normal
- May require database optimization or index tuning

---

### P3: Single Import Failure (Info)

**Alert Name**: `admin_csv_single_failure`

**Trigger Condition**:
- **Signal**: Single import failure (not part of a pattern)
- **Threshold**: 1 `import_failed` event
- **Severity**: P3 (Info)

**Alert Logic**:
```
count(admin_csv_metric{metric="import_failed"}) >= 1
AND
time_range = 5 minutes
AND
NOT (admin_csv_high_error_rate OR admin_csv_system_down)
```

**Actions**:
1. Log to monitoring dashboard (no notification)
2. Review logs for specific `sessionId`
3. Check if user error or system error

**Resolution**:
- Alert auto-resolves after 5 minutes
- No action required unless part of a pattern

---

### P2: Database Connectivity Issues (Warning)

**Alert Name**: `admin_csv_db_connectivity`

**Trigger Condition**:
- **Signal**: Repeated database connection errors
- **Threshold**: 3+ `import_failed` events with `errorMessage` containing "Database connection" in 10 minutes
- **Severity**: P2 (Warning)

**Alert Logic**:
```
count(admin_csv_metric{metric="import_failed", errorMessage=~"Database connection.*"}) >= 3
AND
time_range = 10 minutes
```

**Actions**:
1. Notify on-call engineer (non-paging)
2. Check database server status
3. Check network connectivity
4. Review `DATABASE_URL` configuration
5. Check connection pool limits

**Resolution**:
- Alert resolves when database connectivity is restored
- May require database server restart or network fixes

---

## Alert Severity Levels

### P1 (Critical) - Page Immediately
- System is down or completely unusable
- All imports failing
- Requires immediate response (< 15 minutes)

### P2 (Warning) - Notify, No Page
- Degraded performance or high error rates
- Some imports failing
- Requires response within 1 hour

### P3 (Info) - Log Only
- Single import failures
- Expected user errors
- No immediate action required

## Recommended Integration

### Log-Based Alerts (Loki / ELK)

**Query Pattern**:
```logql
# Count import_failed events
count_over_time(
  {app="magsasa-erp"} 
  |= "[AdminCSV]" 
  | json 
  | metric="import_failed" 
  [1h]
) >= 5
```

**Advantages**:
- No additional instrumentation needed
- Works with existing `[AdminCSV]` logs
- Can filter by `sessionId` for correlation

### Metric-Based Alerts (Prometheus / Datadog)

**Metric Extraction**:
- Parse `admin_csv_metric` JSON logs into metrics
- Create counters: `admin_csv_import_started_total`, `admin_csv_import_completed_total`, `admin_csv_import_failed_total`
- Create histograms: `admin_csv_import_duration_seconds`

**PromQL Examples**:
```promql
# Error rate
rate(admin_csv_import_failed_total[1h]) / rate(admin_csv_import_started_total[1h])

# P95 latency (small imports)
histogram_quantile(0.95, admin_csv_import_duration_seconds_bucket{row_count<5000})

# P95 latency (large imports)
histogram_quantile(0.95, admin_csv_import_duration_seconds_bucket{row_count>=5000})
```

**Advantages**:
- Better for SLO tracking
- Supports histogram-based latency analysis
- Can create dashboards

### Hybrid Approach (Recommended)

1. **Use structured JSON logs** (`admin_csv_metric`) for flexibility
2. **Extract metrics** from logs using log aggregation tools
3. **Create alerts** on both logs and metrics
4. **Correlate** using `sessionId`

## Alert Routing

**P1 Alerts**:
- Route to: On-call engineer (PagerDuty, Opsgenie)
- Escalation: After 15 minutes, escalate to team lead

**P2 Alerts**:
- Route to: On-call engineer (non-paging, Slack/email)
- Escalation: After 1 hour, escalate to P1

**P3 Alerts**:
- Route to: Monitoring dashboard only
- No notification

## Alert Suppression

**Suppress During**:
- Scheduled maintenance windows
- Known database migrations
- Planned deployments

**Suppress If**:
- Alert is a known issue being worked on
- False positive (e.g., test imports)

## Testing Alerts

**Test Scenarios**:
1. Simulate database outage → Should trigger P1
2. Import large CSV slowly → Should trigger P2 (slow import)
3. Import corrupted CSV → Should trigger P2 (high error rate)
4. Single import failure → Should trigger P3 (info only)

**Test Frequency**: Monthly

## Related Documentation

- `docs/SLO-ADMIN-CSV.md` - Service Level Objectives
- `docs/RUNBOOK-ADMIN-CSV.md` - Incident response playbook
- `docs/PRODUCTION-QA-ADMIN-CSV.md` - Production readiness summary

