# Farm Detail View - Alerting Design

## Overview

This document outlines the conceptual alerting strategy for the Farm Detail View feature, leveraging the structured metrics emitted by the `recordFarmDetailMetric` helper. These alerts are designed to be vendor-agnostic and can be configured in systems like Prometheus, Datadog, Loki, or any other log aggregation and monitoring platform capable of scraping structured JSON logs.

## 1. Metric Source

All alerts are based on `farmdetail_metric` events emitted as structured JSON logs from the `server/routers.ts` file, specifically from the `recordFarmDetailMetric` function.

Example Log Format:
```json
{
  "type": "farmdetail_metric",
  "event": "view_completed",
  "ts": "2024-01-15T10:30:00.000Z",
  "farmId": 123,
  "durationMs": 245,
  "hasYields": true,
  "hasCosts": true,
  "hasCoordinates": true
}
```

## 2. Alert Definitions

### 2.1. P1 Alerts (Critical - Page On-Call)

**Alert Name**: `FarmDetail_Critical_High_Error_Rate`
- **Condition**: Error rate for `farms.getById` > 5% over a 5-minute window.
- **Severity**: P1
- **Action**: Page on-call engineer immediately.
- **Runbook**: Refer to `docs/RUNBOOK-FARMDETAIL.md` -> "Farm Detail is Failing".
- **Notes**: Indicates a critical backend issue preventing farm details from loading.

**Alert Name**: `FarmDetail_Critical_DB_Connection_Failure`
- **Condition**: `farmdetail_metric` events with `errorCategory: "db_error"` > 10 in a 5-minute window.
- **Severity**: P1
- **Action**: Page on-call engineer and DBA immediately.
- **Runbook**: Refer to `docs/RUNBOOK-FARMDETAIL.md` -> "Database Connection Issues".
- **Notes**: Indicates database connectivity problems affecting Farm Detail.

### 2.2. P2 Alerts (High - Create Incident, Notify Channel)

**Alert Name**: `FarmDetail_High_Latency`
- **Condition**: p95 latency for `farms.getById` > 2 seconds for 30 consecutive minutes.
- **Severity**: P2
- **Action**: Create an incident ticket, notify `#farm-detail-performance` Slack channel.
- **Runbook**: Refer to `docs/RUNBOOK-FARMDETAIL.md` -> "Farm Detail is Slow".
- **Notes**: Indicates performance degradation impacting user experience.

**Alert Name**: `FarmDetail_High_Not_Found_Rate`
- **Condition**: `farmdetail_metric` events with `errorCategory: "not_found"` > 20% of total requests for 60 consecutive minutes.
- **Severity**: P2
- **Action**: Create an incident ticket, notify `#farm-detail-data-quality` Slack channel.
- **Runbook**: Refer to `docs/RUNBOOK-FARMDETAIL.md` -> "High Not Found Rate".
- **Notes**: May indicate data deletion, migration issues, or broken links from other pages.

**Alert Name**: `FarmDetail_Data_Completeness_Degradation`
- **Condition**: Percentage of `farmdetail_metric` events with `hasYields: false` for active farms > 10% for 24 hours.
- **Severity**: P2
- **Action**: Create an incident ticket, notify `#farm-detail-data-quality` Slack channel.
- **Runbook**: Refer to `docs/RUNBOOK-FARMDETAIL.md` -> "Data Completeness Issues".
- **Notes**: Indicates a data quality issue where active farms are missing yield records.

### 2.3. P3 Alerts (Medium - Notify Channel, Investigate)

**Alert Name**: `FarmDetail_No_Metrics_Emitted`
- **Condition**: No `farmdetail_metric` events with `event: "view_completed"` or `event: "view_failed"` in the last 60 minutes.
- **Severity**: P3
- **Action**: Notify `#monitoring-alerts` Slack channel, investigate log pipeline or `farms.getById` execution.
- **Runbook**: Refer to `docs/RUNBOOK-FARMDETAIL.md` -> "No Farm Detail Metrics".
- **Notes**: Could indicate a problem with the Farm Detail feature itself or the log ingestion pipeline.

**Alert Name**: `FarmDetail_High_Missing_Coordinates`
- **Condition**: Percentage of `farmdetail_metric` events with `hasCoordinates: false` > 15% for 24 hours.
- **Severity**: P3
- **Action**: Notify `#farm-detail-data-quality` Slack channel, investigate coordinate data entry.
- **Runbook**: Refer to `docs/RUNBOOK-FARMDETAIL.md` -> "Missing Coordinates".
- **Notes**: Indicates farms are being created or updated without GPS coordinates.

**Alert Name**: `FarmDetail_Validation_Error_Spike`
- **Condition**: `farmdetail_metric` events with `errorCategory: "validation_error"` > 5% of total requests for 60 consecutive minutes.
- **Severity**: P3
- **Action**: Notify `#farm-detail-errors` Slack channel, investigate input validation.
- **Runbook**: Refer to `docs/RUNBOOK-FARMDETAIL.md` -> "Validation Errors".
- **Notes**: May indicate a frontend bug or API contract mismatch.

## 3. Integration Notes

- **Log Scraper**: A log scraping agent (e.g., Promtail for Loki, Datadog Agent, custom script) should be configured to parse the structured JSON logs emitted by `recordFarmDetailMetric`.
- **Metric Conversion**: The scraped logs should be converted into time-series metrics (e.g., `farmdetail_error_rate_gauge`, `farmdetail_latency_histogram`, `farmdetail_data_completeness_gauge`).
- **Alerting Platform**: The chosen alerting platform (e.g., Alertmanager for Prometheus, Datadog Monitors) should be configured with the conditions defined above, referencing the converted metrics.
- **Runbook Links**: Ensure alert notifications include direct links to the relevant sections of `docs/RUNBOOK-FARMDETAIL.md`.

## 4. Alert Examples

### Example 1: High Error Rate Alert

**Trigger**: `farmdetail_metric` events with `event: "view_failed"` > 5% of total events in 5-minute window.

**Notification**:
```
🚨 P1 Alert: FarmDetail_Critical_High_Error_Rate

Farm Detail View is experiencing a high error rate (7.2% failures in the last 5 minutes).

Error breakdown:
- db_error: 45%
- not_found: 30%
- validation_error: 15%
- unknown: 10%

Runbook: docs/RUNBOOK-FARMDETAIL.md#farm-detail-is-failing
```

### Example 2: High Latency Alert

**Trigger**: p95 latency for `farms.getById` > 2 seconds for 30 minutes.

**Notification**:
```
⚠️ P2 Alert: FarmDetail_High_Latency

Farm Detail View is experiencing slow response times.

Current p95 latency: 2.8 seconds (target: < 1 second)
Affected farms: Heavy farms (200+ yields, 150+ costs)

Runbook: docs/RUNBOOK-FARMDETAIL.md#farm-detail-is-slow
```

---

**Last Updated**: Pass 4 - Observability & Metrics  
**Version**: 1.0

