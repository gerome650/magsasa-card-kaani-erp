# Map View - Service Level Objectives (SLOs)

**Date**: Pre-Production QA  
**Feature**: Map View Observability & Metrics  
**Status**: ✅ Defined

---

## Overview

This document defines Service Level Objectives (SLOs) for the Map View feature, which provides geographic visualization of farm data. SLOs are used to measure service quality and determine error budgets.

---

## Service Scope

The Map View service includes:
- **`farms.mapList`**: Endpoint that returns farms with valid coordinates (excludes farms without lat/lng)
- **`farms.consistencyCheck`**: Endpoint that validates data quality between Map View and Dashboard/Analytics

---

## Proposed SLOs

### 1. Availability SLO

**Target**: 99.5% monthly availability

**Definition**: 
- Availability = (Total requests - Failed requests) / Total requests
- Failed requests = HTTP 5xx errors, timeouts, or unhandled exceptions
- Measurement period: Rolling 30-day window

**Error Budget**: 0.5% (approximately 3.6 hours of downtime per month)

**Calculation**:
```
Availability = (Successful requests / Total requests) * 100
Error Budget Consumed = (Failed requests / Total requests) * 100
```

**Example**:
- Total requests in 30 days: 100,000
- Failed requests: 400
- Availability: (99,600 / 100,000) * 100 = 99.6% ✅ (within SLO)
- Error budget consumed: 0.4%

---

### 2. Latency SLO

**Target**: 
- **p95 < 1s** for `farms.mapList`
- **p95 < 1.5s** for `farms.consistencyCheck` (heavier operation)

**Definition**:
- Latency = Time from request received to response sent
- p95 = 95th percentile latency (95% of requests complete within this time)
- Measurement period: Rolling 7-day window

**Error Budget**: 
- If p95 > 1s for `mapList` for >5% of requests → consume error budget
- If p95 > 1.5s for `consistencyCheck` for >5% of requests → consume error budget

**Calculation**:
```
p95 Latency = Value at 95th percentile of latency distribution
Error Budget Consumed = (Requests exceeding p95 threshold / Total requests) * 100
```

**Example**:
- `mapList` requests: 10,000
- p95 latency: 850ms ✅ (within 1s threshold)
- Requests > 1s: 200 (2%)
- Error budget consumed: 2% (acceptable)

---

### 3. Data Correctness SLO

**Target**: `missingCoordinatePercentage <= 10%` (target)

**Definition**:
- Data correctness measured via `farms.consistencyCheck` endpoint
- `missingCoordinatePercentage` = (Farms without coordinates / Total farms) * 100
- Measurement: Continuous monitoring via consistency check metrics

**Error Budget**:
- **Soft warning**: If `missingCoordinatePercentage > 10%` for 60+ minutes → P2 alert
- **Hard alert**: If `missingCoordinatePercentage > 20%` for 15+ minutes → P1 alert
- Error budget consumed when hard alert threshold is breached

**Calculation**:
```
missingCoordinatePercentage = (missingCoordinateCount / totalFarms) * 100
Error Budget Consumed = max(0, (missingCoordinatePercentage - 10) / 10) * 100
```

**Example**:
- Total farms: 5,000
- Farms with coordinates: 4,850
- Missing coordinates: 150
- Missing coordinate percentage: 3% ✅ (within 10% target)

---

## Error Budget

**Total Error Budget**: 0.5% (availability) + 5% (latency) + 10% (data correctness threshold)

**Error Budget Consumption**:
- **Availability**: Consumed when availability < 99.5%
- **Latency**: Consumed when p95 exceeds thresholds for >5% of requests
- **Data Correctness**: Consumed when `missingCoordinatePercentage > 20%`

**Error Budget Reset**: Monthly (rolling 30-day window)

---

## Measurement Plan

### Metrics Collection

**Structured Logs**:
- All Map View operations emit structured JSON logs via `recordMapViewMetric()`
- Logs include: `type: "mapview_metric"`, `event`, `ts`, and payload fields
- Logs are scraped by Loki/Prometheus/Datadog for metric extraction

**Key Metrics**:
1. **Request Count**: Total requests to `farms.mapList` and `farms.consistencyCheck`
2. **Error Count**: Failed requests (5xx, timeouts, exceptions)
3. **Latency Distribution**: p50, p95, p99 latencies
4. **Consistency Metrics**: From `consistencyCheck` endpoint (totalFarms, farmsWithCoordinates, etc.)

### Monitoring Queries (Example - Prometheus/Loki)

**Availability**:
```
sum(rate(mapview_requests_total[30d])) - sum(rate(mapview_requests_failed_total[30d]))
/ sum(rate(mapview_requests_total[30d])) * 100
```

**Latency (p95)**:
```
histogram_quantile(0.95, rate(mapview_request_duration_seconds_bucket[7d]))
```

**Data Correctness**:
```
mapview_missing_coordinate_percentage
```

---

## SLO Violation Response

### P1 (Critical)
- **Condition**: Availability < 99% OR `missingCoordinatePercentage > 20%` for 15+ minutes
- **Action**: Page on-call engineer immediately
- **Escalation**: If not acknowledged within 15 minutes, escalate to engineering lead

### P2 (High)
- **Condition**: Availability < 99.5% OR `missingCoordinatePercentage > 10%` for 60+ minutes
- **Action**: Create incident ticket, notify #maps-data-quality channel
- **Escalation**: If not resolved within 4 hours, escalate to P1

### P3 (Medium)
- **Condition**: Latency p95 > threshold for >5% of requests OR no `mapview_metric` events in last 60 minutes
- **Action**: Notify on-call (monitoring/log pipeline issue)
- **Escalation**: If not resolved within 24 hours, escalate to P2

---

## Review & Adjustment

**SLO Review Frequency**: Quarterly

**Adjustment Criteria**:
- If error budget consistently consumed → consider relaxing SLO or improving service
- If error budget rarely consumed → consider tightening SLO or reallocating resources

**Historical Data**: Maintain 90-day rolling window of SLO compliance metrics

---

## Related Documents

- `docs/ALERTING-MAPVIEW.md` - Alert definitions and thresholds
- `docs/QA-MAPVIEW-CONSISTENCY.md` - Consistency validation details
- `docs/LOAD-TEST-MAPVIEW.md` - Performance testing results

---

**Last Updated**: Pre-Production QA  
**Version**: 1.0

