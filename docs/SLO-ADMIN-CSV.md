# Admin CSV Upload - Service Level Objectives (SLOs)

## Service Scope

**Service Name**: Admin CSV Upload  
**Service Description**: Bulk import of farmers, farms, and seasons/yields data via CSV files  
**Users**: Internal administrators only (admin role required)  
**Service Components**:
- Farmers CSV import (`uploadFarmersCsv`)
- Farms CSV import (`uploadFarmsCsv`)
- Seasons/Yields CSV import (`uploadSeasonsCsv`)

## Proposed SLOs

### 1. Availability SLO

**Target**: 99.5% of CSV imports complete without system-level errors

**Definition**:
- **Success**: Import completes and returns a response (even if some rows have errors)
- **Failure**: System-level errors (5xx HTTP errors, database unreachable, connection timeouts, unhandled exceptions)
- **Excluded**: User errors (validation errors, missing references) are not counted as failures

**Measurement**:
- Count total imports (all three CSV types)
- Count system-level failures (5xx errors, DB connection errors)
- Calculate: `(total_imports - system_failures) / total_imports >= 0.995`

**Example**:
- 1000 imports in a month
- 3 system-level failures
- Availability: 99.7% ✅ (meets 99.5% target)

### 2. Latency SLO

**Target**: 95% of imports finish within defined time limits

**Definitions**:
- **Small imports** (<5,000 rows): 95% finish within 60 seconds
- **Large imports** (≥5,000 rows): 95% finish within 5 minutes (300 seconds)

**Measurement**:
- Track `durationSeconds` from `import_completed` metrics
- For small imports: `P95(durationSeconds) <= 60`
- For large imports: `P95(durationSeconds) <= 300`

**Example**:
- 100 small imports: 96 finish within 60s → 96% ✅ (meets 95% target)
- 50 large imports: 48 finish within 5min → 96% ✅ (meets 95% target)

### 3. Correctness SLO

**Target**: 99% of valid rows in a given CSV are processed successfully

**Definition**:
- **Valid row**: Row that passes validation and has all required references (farmer exists, farm exists, etc.)
- **Success**: Row is inserted/updated in database
- **Failure**: Valid row fails to insert due to system error (not user error)

**Measurement**:
- For each import: `insertedCount / (insertedCount + skippedCount) >= 0.99`
- Only count rows that should have succeeded (exclude validation errors)

**Example**:
- CSV with 10,000 rows
- 9,950 rows are valid (50 have validation errors)
- 9,945 rows inserted successfully
- Correctness: 99.95% ✅ (meets 99% target)

## Error Budget

**Monthly Error Budget**: 0.5% of total imports

**Calculation**:
- If 1,000 imports per month: Error budget = 5 system-level failures
- If 5,000 imports per month: Error budget = 25 system-level failures

**Usage**:
- Track system-level failures per month
- If error budget is exhausted (>0.5% failures), trigger P2 alert
- Review and improve system reliability

**Example**:
- Month 1: 1,000 imports, 3 failures (0.3%) → ✅ Within budget
- Month 2: 1,000 imports, 7 failures (0.7%) → ⚠️ Budget exceeded, investigate

## SLO Measurement Plan

### Data Sources

1. **Structured Logs** (`[AdminCSV]` prefix):
   - `import_started` events (timestamp, csvType, rowCount, sessionId)
   - `import_completed` events (timestamp, csvType, insertedCount, skippedCount, errorCount, durationSeconds, sessionId)
   - `import_failed` events (timestamp, csvType, errorMessage, sessionId)

2. **Metrics JSON Events**:
   - `admin_csv_metric` structured JSON logs
   - Can be ingested by Prometheus, Datadog, New Relic, etc.

### Measurement Methods

**Availability**:
- Count `import_started` events
- Count `import_failed` events (system-level only)
- Calculate: `(started - failed) / started`

**Latency**:
- Extract `durationSeconds` from `import_completed` events
- Group by row count (<5K vs ≥5K)
- Calculate P95 percentile

**Correctness**:
- Extract `insertedCount` and `skippedCount` from `import_completed` events
- Filter out validation errors (counted separately)
- Calculate: `insertedCount / (insertedCount + skippedCount)`

### Tools & Integration

**Recommended Stack**:
- **Log Aggregation**: Loki, ELK, or cloud-native (CloudWatch, Datadog Logs)
- **Metrics**: Prometheus, Datadog, New Relic
- **Alerting**: Grafana Alerts, PagerDuty, Opsgenie
- **Dashboards**: Grafana, Datadog Dashboards

**Query Examples** (Loki/PromQL style):
```promql
# Availability
rate(admin_csv_import_started_total[1h]) - rate(admin_csv_import_failed_total[1h]) / rate(admin_csv_import_started_total[1h])

# Latency P95 (small imports)
histogram_quantile(0.95, admin_csv_import_duration_seconds_bucket{row_count<5000})

# Latency P95 (large imports)
histogram_quantile(0.95, admin_csv_import_duration_seconds_bucket{row_count>=5000})
```

## Review & Adjustment

**Review Frequency**: Monthly  
**Adjustment Criteria**:
- If SLOs are consistently met (>99% of time): Consider tightening
- If SLOs are consistently missed: Investigate root causes, adjust targets if needed
- If usage patterns change significantly: Re-evaluate latency targets

## Notes

- These SLOs are **internal-facing** (not customer-facing)
- Focus on **system reliability**, not user error rates
- User errors (validation, missing references) are expected and not counted against SLOs
- SLOs should be reviewed after first month of production use

