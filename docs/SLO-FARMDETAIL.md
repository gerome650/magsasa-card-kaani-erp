# Farm Detail View - Service Level Objectives (SLOs)

## Overview

This document defines the Service Level Objectives (SLOs) for the Farm Detail View feature, which provides comprehensive farm information including yields, costs, boundaries, and profitability metrics. These SLOs are critical for ensuring a reliable and performant user experience for managers and loan officers who rely on this view for detailed farm analysis.

## 1. Service Scope

The Farm Detail View feature encompasses:
- The `farms.getById` tRPC endpoint (backend data retrieval for farm details).
- The `yields.getByFarmId` tRPC endpoint (historical yield records).
- The `costs.getByFarmId` tRPC endpoint (cost records).
- The `boundaries.getByFarmId` tRPC endpoint (farm boundary/parcel data).
- The `client/src/pages/FarmDetail.tsx` frontend component (farm detail rendering, yields/costs tables, profitability analysis, map display).
- Underlying database queries for farm, yield, cost, and boundary data.

## 2. Proposed SLOs

### 2.1. Availability

**Objective**: The Farm Detail View API endpoints (`farms.getById`, `yields.getByFarmId`, `costs.getByFarmId`, `boundaries.getByFarmId`) should be available and return a successful response (HTTP 200 equivalent for tRPC) for at least 99.5% of requests on a monthly basis.

- **Target**: 99.5% monthly availability.
- **Measurement**:
  - Server-side: Monitor successful responses vs. error responses (e.g., `TRPCError` with `INTERNAL_SERVER_ERROR`, `NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`).
  - Client-side: Track successful `useQuery` calls for all Farm Detail endpoints.
  - Metrics: `farmdetail_metric` events with `event: "view_completed"` vs `event: "view_failed"`.
- **Impact of Failure**: Managers and loan officers cannot view detailed farm information, analyze profitability, or make informed decisions.

### 2.2. Latency

**Objective**: The Farm Detail View API endpoints should respond quickly to user requests, even for farms with many yields and costs.

- **Target**:
  - `farms.getById`: p95 latency < 1 second.
  - `yields.getByFarmId`: p95 latency < 1.5 seconds (for farms with 200+ yields).
  - `costs.getByFarmId`: p95 latency < 1.5 seconds (for farms with 150+ costs).
  - `boundaries.getByFarmId`: p95 latency < 1 second.
- **Measurement**:
  - Server-side: Measure duration of tRPC procedure execution (via `farmdetail_metric` `durationMs` field).
  - Client-side: Monitor `useQuery` loading times.
- **Impact of Failure**: Slow page loads, delayed decision-making, poor user experience.

### 2.3. Data Correctness (Completeness)

**Objective**: The Farm Detail View should display complete and accurate data for farms.

- **Target**: 
  - At least 95% of active farms should have at least one yield record.
  - At least 90% of farms should have valid coordinates (non-zero, non-null).
  - At least 98% of farms should have at least one crop type listed.
- **Measurement**:
  - Server-side: The `farmdetail_metric` events include `hasYields`, `hasCosts`, `hasCoordinates` booleans.
  - Client-side: Integrity checks log warnings with `[FarmDetailIntegrity]` prefix for incomplete data.
- **Impact of Failure**: Incomplete farm profiles, missing historical data, inability to calculate profitability.

## 3. Error Budget

The error budget is the inverse of the SLO target. For example, a 99.5% availability SLO means there is a 0.5% error budget.

- **Availability Error Budget**: 0.5% of monthly requests.
- **Latency Error Budget**: 5% of requests exceeding p95 targets.
- **Data Correctness Error Budget**:
  - Up to 5% of active farms can have no yields (acceptable for newly registered farms).
  - Up to 10% of farms can have missing coordinates (acceptable for farms pending GPS survey).
  - Up to 2% of farms can have no crops listed (acceptable for farms in transition).

Exceeding these error budgets will trigger alerts and potentially lead to incident response, indicating a need for immediate attention and resolution.

## 4. Measurement Plan

### 4.1. Metrics Collection

- **Structured Logs**: `farmdetail_metric` events emitted as JSON logs:
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

- **Log Aggregation**: Logs are scraped by monitoring systems (Loki, Prometheus, Datadog) and converted to time-series metrics.

### 4.2. SLO Calculation

- **Availability**: `(successful_requests / total_requests) * 100 >= 99.5%`
- **Latency**: `p95(durationMs) < 1000ms` for `farms.getById`
- **Data Correctness**: Calculated from `hasYields`, `hasCosts`, `hasCoordinates` booleans in metrics.

### 4.3. Reporting

- **Daily**: Automated reports showing SLO compliance for the previous 24 hours.
- **Weekly**: Trend analysis and error budget consumption.
- **Monthly**: Full SLO compliance report and error budget reset.

---

**Last Updated**: Pass 4 - Observability & Metrics  
**Version**: 1.0

