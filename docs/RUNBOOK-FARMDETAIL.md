# Farm Detail View - Runbook for On-Call Engineers

**Date**: Pass 5 - Failure & Resilience QA  
**Feature**: Farm Detail View  
**Status**: ✅ Complete

---

## Overview

This runbook provides step-by-step troubleshooting procedures for on-call engineers responding to Farm Detail View incidents. It covers common symptoms, triage steps, remediation actions, and escalation procedures.

---

## Quick Reference

- **Feature**: Farm Detail View (`/farms/{id}`)
- **Backend Endpoint**: `farms.getById` (tRPC)
- **Key Metrics**: `farmdetail_metric` (structured JSON logs)
- **Log Prefixes**: `[FarmDetail]`, `[FarmDetailPerf]`, `[FarmDetailIntegrity]`
- **Related Docs**: 
  - `docs/SLO-FARMDETAIL.md` (SLO definitions)
  - `docs/ALERTING-FARMDETAIL.md` (Alert definitions)
  - `docs/FAILURE-SCENARIOS-FARMDETAIL.md` (How to simulate failures)

---

## Triage Flow

### Step 1: Identify the Issue

**Check Alert Details**:
- Which alert fired? (P1/P2/P3)
- What is the error rate? (percentage of failed requests)
- What is the latency? (p95, p99)
- What is the error category? (`db_error`, `not_found`, `validation_error`, etc.)

**Check Metrics**:
- Query logs for `farmdetail_metric` events:
  ```bash
  # Example: Loki query
  {type="farmdetail_metric"} | json | event="view_failed"
  
  # Example: grep in logs
  grep "farmdetail_metric" /var/log/app.log | jq '.event'
  ```

**Check User Reports**:
- Are users seeing error messages?
- Which farms are affected? (specific farmIds)
- Is the issue affecting all farms or specific ones?

---

## Common Scenarios & Actions

### Scenario 1: Farm Detail is Failing (High Error Rate)

**Symptoms**:
- Alert: `FarmDetail_Critical_High_Error_Rate`
- Error rate > 5% over 5 minutes
- Users see "Failed to load farm details" messages

**Triage Steps**:

1. **Check error categories**:
   ```bash
   # Count errors by category
   grep "farmdetail_metric" logs | jq 'select(.event=="view_failed") | .errorCategory' | sort | uniq -c
   ```

2. **Check recent failures**:
   ```bash
   grep "\[FarmDetail\] getById failed" logs | tail -20
   ```

3. **Check database connectivity**:
   ```bash
   # Test DB connection
   mysql -h {DB_HOST} -u {DB_USER} -p -e "SELECT 1;"
   ```

**Remediation**:

- **If `errorCategory: "db_error"`**:
  1. Check database service status.
  2. Check database connection pool (if applicable).
  3. Check network connectivity between app and DB.
  4. Review database logs for errors.
  5. **Action**: Restart database service or connection pool if needed.

- **If `errorCategory: "not_found"`**:
  1. Verify farm IDs exist in database:
     ```sql
     SELECT COUNT(*) FROM farms WHERE id IN ({affected_farm_ids});
     ```
  2. Check if farms were recently deleted.
  3. Check for data migration issues.
  4. **Action**: Investigate data deletion/migration, restore if needed.

- **If `errorCategory: "validation_error"`**:
  1. Check for recent code deployments.
  2. Review input validation logic.
  3. Check for API contract mismatches.
  4. **Action**: Rollback deployment if recent, or fix validation logic.

- **If `errorCategory: "unknown"`**:
  1. Check full error logs (sanitized):
     ```bash
     grep "\[FarmDetail\] getById failed" logs | tail -10
     ```
  2. Review stack traces (if available in logs).
  3. **Action**: Escalate to engineering team.

**Escalation**:
- If error rate > 10% for > 15 minutes → Escalate to engineering lead.
- If database is down → Escalate to DBA/Infrastructure team.

---

### Scenario 2: Farm Detail is Slow (High Latency)

**Symptoms**:
- Alert: `FarmDetail_High_Latency`
- p95 latency > 2 seconds for 30+ minutes
- Users report slow page loads

**Triage Steps**:

1. **Check latency distribution**:
   ```bash
   # Extract durationMs from metrics
   grep "farmdetail_metric" logs | jq 'select(.event=="view_completed") | .durationMs' | sort -n | tail -100
   ```

2. **Check slow operation warnings**:
   ```bash
   grep "\[FarmDetail\] Slow operation detected" logs | tail -20
   ```

3. **Check database query performance**:
   ```sql
   -- Check for slow queries
   SHOW PROCESSLIST;
   -- Or check slow query log
   ```

4. **Check for heavy farms**:
   ```bash
   grep "\[FarmDetail\] Farm.*has extremely high" logs | tail -20
   ```

**Remediation**:

- **If database queries are slow**:
  1. Check database load (CPU, memory, connections).
  2. Check for long-running queries:
     ```sql
     SHOW PROCESSLIST;
     ```
  3. Check for missing indexes:
     ```sql
     EXPLAIN SELECT * FROM farms WHERE id = {farm_id};
     ```
  4. **Action**: 
     - Kill long-running queries if safe.
     - Add indexes if missing.
     - Scale database resources if needed.

- **If specific farms are slow**:
  1. Check yield/cost counts for affected farms:
     ```sql
     SELECT f.id, COUNT(DISTINCT y.id) as yield_count, COUNT(DISTINCT c.id) as cost_count
     FROM farms f
     LEFT JOIN yields y ON f.id = y.farmId
     LEFT JOIN costs c ON f.id = c.farmId
     WHERE f.id IN ({slow_farm_ids})
     GROUP BY f.id;
     ```
  2. **Action**: 
     - If counts > 1000, consider data archiving.
     - Verify pagination is working correctly.

- **If all farms are slow**:
  1. Check application server resources (CPU, memory).
  2. Check for application-level bottlenecks.
  3. **Action**: Scale application servers or optimize code.

**Escalation**:
- If p95 latency > 5 seconds for > 1 hour → Escalate to engineering lead.
- If database is the bottleneck → Escalate to DBA team.

---

### Scenario 3: High Not Found Rate

**Symptoms**:
- Alert: `FarmDetail_High_Not_Found_Rate`
- `errorCategory: "not_found"` > 20% of requests for 60+ minutes
- Users see "Farm not found" messages

**Triage Steps**:

1. **Check which farm IDs are failing**:
   ```bash
   grep "farmdetail_metric" logs | jq 'select(.event=="view_failed" and .errorCategory=="not_found") | .farmId' | sort | uniq -c
   ```

2. **Verify farms exist in database**:
   ```sql
   SELECT id FROM farms WHERE id IN ({failing_farm_ids});
   ```

3. **Check for broken links**:
   - Review recent deployments that might have changed routes.
   - Check if farm IDs are being passed correctly from other pages.

**Remediation**:

- **If farms don't exist**:
  1. Check if farms were deleted (audit log if available).
  2. Check for data migration issues.
  3. **Action**: Restore farms from backup if needed.

- **If farms exist but still failing**:
  1. Check for permission/access issues.
  2. Check for tenant/org filtering issues.
  3. **Action**: Review access control logic, fix if needed.

- **If broken links from other pages**:
  1. Check Farms page, Map View, Analytics for incorrect links.
  2. **Action**: Fix links in frontend code.

**Escalation**:
- If > 50% of requests are not found → Escalate to engineering lead.
- If data loss is suspected → Escalate to data team.

---

### Scenario 4: Data Completeness Issues

**Symptoms**:
- Alert: `FarmDetail_Data_Completeness_Degradation`
- High percentage of farms with `hasYields: false` for active farms
- Users report missing yield/cost data

**Triage Steps**:

1. **Check data completeness metrics**:
   ```bash
   # Count farms with missing yields
   grep "farmdetail_metric" logs | jq 'select(.event=="view_completed" and .hasYields==false) | .farmId' | sort | uniq | wc -l
   ```

2. **Check integrity warnings**:
   ```bash
   grep "\[FarmDetailIntegrity\]" logs | tail -50
   ```

3. **Query database for missing data**:
   ```sql
   -- Active farms with no yields
   SELECT f.id, f.name, f.status
   FROM farms f
   LEFT JOIN yields y ON f.id = y.farmId
   WHERE f.status = 'active' AND y.id IS NULL
   LIMIT 20;
   ```

**Remediation**:

- **If data is legitimately missing**:
  1. Verify if farms are newly registered (may not have yields yet).
  2. Check if data entry process is working.
  3. **Action**: No immediate action needed if expected.

- **If data should exist but is missing**:
  1. Check for data deletion (audit log if available).
  2. Check for data migration issues.
  3. **Action**: Restore data from backup if needed.

- **If data entry process is broken**:
  1. Check yield/cost creation endpoints.
  2. Check for validation errors preventing data entry.
  3. **Action**: Fix data entry process.

**Escalation**:
- If > 20% of active farms have missing data → Escalate to data team.
- If data loss is confirmed → Escalate to engineering lead.

---

### Scenario 5: Database Connection Issues

**Symptoms**:
- Alert: `FarmDetail_Critical_DB_Connection_Failure`
- `errorCategory: "db_error"` > 10 in 5 minutes
- Users see "temporary database issue" messages

**Triage Steps**:

1. **Check database service status**:
   ```bash
   # Check MySQL service
   systemctl status mysql
   # or
   brew services list | grep mysql
   ```

2. **Test database connectivity**:
   ```bash
   mysql -h {DB_HOST} -u {DB_USER} -p -e "SELECT 1;"
   ```

3. **Check connection pool**:
   - Review application connection pool settings.
   - Check for connection pool exhaustion.

4. **Check network connectivity**:
   ```bash
   ping {DB_HOST}
   telnet {DB_HOST} 3306
   ```

**Remediation**:

- **If database service is down**:
  1. Restart database service:
     ```bash
     systemctl restart mysql
     # or
     brew services restart mysql
     ```
  2. Check database logs for errors.
  3. **Action**: Restart service, investigate root cause.

- **If connection pool is exhausted**:
  1. Increase connection pool size (if safe).
  2. Check for connection leaks in application code.
  3. **Action**: Restart application to reset connections.

- **If network issue**:
  1. Check firewall rules.
  2. Check DNS resolution.
  3. **Action**: Fix network configuration.

**Escalation**:
- If database is down for > 5 minutes → Escalate to DBA/Infrastructure team.
- If connection pool issues persist → Escalate to engineering lead.

---

## General Remediation Actions

### Restart Application

**When to use**: Application-level issues, memory leaks, connection pool issues.

**Steps**:
1. Check if restart is safe (no active critical operations).
2. Restart application servers:
   ```bash
   # Example: PM2
   pm2 restart app
   
   # Example: systemd
   sudo systemctl restart app
   ```
3. Monitor metrics after restart.

### Rollback Deployment

**When to use**: Recent deployment caused issues, validation errors, API contract mismatches.

**Steps**:
1. Identify last deployment time.
2. Check deployment history.
3. Rollback to previous version.
4. Monitor metrics after rollback.

### Scale Resources

**When to use**: High load, resource exhaustion, performance degradation.

**Steps**:
1. Check current resource usage (CPU, memory, connections).
2. Scale up application servers or database.
3. Monitor metrics after scaling.

---

## Escalation Procedures

### When to Escalate

- **P1 Alerts**: Escalate immediately if not resolved within 15 minutes.
- **P2 Alerts**: Escalate if not resolved within 1 hour.
- **P3 Alerts**: Escalate if not resolved within 4 hours or if severity increases.

### Who to Escalate To

- **Engineering Lead**: Code issues, performance problems, data quality issues.
- **DBA/Infrastructure Team**: Database issues, infrastructure problems.
- **Data Team**: Data loss, data migration issues, data quality problems.

### What to Include in Escalation

- Alert name and severity.
- Error rate, latency, or affected metrics.
- Error categories and sample error messages (sanitized).
- Steps already taken.
- Current status and impact.

---

## Prevention

### Regular Monitoring

- Review `farmdetail_metric` logs daily.
- Monitor SLO compliance weekly.
- Review integrity warnings weekly.

### Proactive Checks

- Run heavy farm generator periodically to test performance.
- Review data completeness metrics monthly.
- Check for slow queries weekly.

---

**Last Updated**: Pass 5 - Failure & Resilience QA  
**Version**: 1.0

