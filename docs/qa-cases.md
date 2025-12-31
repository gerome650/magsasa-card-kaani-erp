# QA Test Cases and Definitions

This document defines the QA gates and test cases for the MAGSASA-CARD ERP system, with special focus on KaAni loan suggestion features.

## Gate Definitions

### Local Gate (Required for Every PR)
**Purpose**: Ensure code quality and basic functionality before merge.

**Requirements**:
1. **Lint**: All code passes linting rules (`pnpm lint` or `pnpm -r lint`)
2. **Test**: All unit tests pass (`pnpm test` or `pnpm -r test`)
3. **Build**: Project builds successfully (`pnpm build` or `pnpm -r build`)
4. **Smoke Test**: Manual verification that the feature works in local development environment
5. **DEPLOYMENT_PROFILE Check**: Verify behavior with different deployment profiles:
   - `DEPLOYMENT_PROFILE=DEV`: Full visibility expected
   - `DEPLOYMENT_PROFILE=CARD_MRI`: UI visibility expected for loan suggestions
   - `DEPLOYMENT_PROFILE=LANDBANK`: Internal-only visibility expected for loan suggestions

**Failure Criteria**: Any check fails → PR cannot merge.

---

### Mini Regression Gate (Label-Driven: `qa:mini-regression`)
**Purpose**: Verify core functionality and common edge cases.

**Required Scenarios** (all must pass):

1. **Clean Data Flow**
   - All required fields present (crop, hectares, province)
   - Loan suggestion computes correctly
   - Visibility matches deployment profile

2. **Missing Hectares Edge Case**
   - Input: crop present, hectares missing or 0
   - Expected: System handles gracefully, uses minimum or shows appropriate message
   - No crashes or undefined errors

3. **Missing Cost Breakdown Edge Case**
   - Input: crop and hectares present, cost breakdown missing
   - Expected: Falls back to benchmark calculation
   - Confidence level adjusted appropriately

4. **Unknown Crop Benchmark Handling**
   - Input: Crop not in benchmark database
   - Expected: Uses conservative default estimate
   - Confidence set to "low"
   - Appropriate disclaimer shown

5. **Risk Flags Applied Correctly**
   - Input: Risk flags present (e.g., "Rainfed" irrigation)
   - Expected: Loan amount adjusted downward
   - Adjustments logged in artifact
   - High-severity flags reduce amount more than medium

6. **Clamp/Round Edge Cases**
   - Input: Calculated amount below minimum policy limit
   - Expected: Clamped to minimum, adjustment logged
   - Input: Calculated amount above maximum policy limit
   - Expected: Clamped to maximum, adjustment logged
   - Input: Amount requires rounding
   - Expected: Rounded to nearest increment (e.g., 500 PHP)

**Failure Criteria**: Any scenario fails → PR cannot merge.

---

### Full Regression Gate (Label-Driven: `qa:full-regression` or `release`)
**Purpose**: Comprehensive testing before release or major changes.

**Includes All Mini Regression Scenarios Plus**:

1. **Cross-Browser Testing**
   - Chrome (latest)
   - Firefox (latest)
   - Safari (latest)
   - Edge (latest)

2. **Mobile Responsiveness**
   - Mobile viewport (< 768px)
   - Tablet viewport (768px - 1024px)
   - Desktop viewport (> 1024px)

3. **Error Handling and Edge Cases**
   - Network failures
   - Invalid input data
   - Concurrent requests
   - Session expiration
   - Database connection failures

4. **Performance Under Load**
   - Response times < 2s for artifact generation
   - No memory leaks
   - Graceful degradation under high load

5. **Integration Testing**
   - End-to-end flow from conversation to loan suggestion
   - Artifact persistence in database
   - UI rendering matches server output

6. **Backward Compatibility**
   - Existing conversations still work
   - Old artifact formats handled gracefully
   - No breaking API changes

7. **Security Audit**
   - No PII in logs (farmer IDs hashed)
   - Proper authentication checks
   - No SQL injection vulnerabilities
   - No XSS vulnerabilities
   - Rate limiting enforced

**Failure Criteria**: Any scenario fails → PR cannot merge.

---

## Deployment Profile Expectations

### DEV Profile
- **Loan Suggestion Visibility**: `"ui"` (visible to all users)
- **Min Loan Amount**: 1,000 PHP
- **Max Loan Amount**: 500,000 PHP
- **Use Case**: Development and testing

### CARD_MRI Profile
- **Loan Suggestion Visibility**: `"ui"` (visible to farmers)
- **Min Loan Amount**: 5,000 PHP
- **Max Loan Amount**: 150,000 PHP
- **Use Case**: Production deployment for CARD MRI

### LANDBANK Profile
- **Loan Suggestion Visibility**: `"internal"` (loan officers only)
- **Min Loan Amount**: 10,000 PHP
- **Max Loan Amount**: 200,000 PHP
- **Use Case**: Production deployment for LandBank

**Verification**: For each profile, verify:
1. Correct visibility in UI (loan suggestion appears/disappears as expected)
2. Correct min/max limits applied
3. Correct rounding increment (500 PHP for all profiles)

---

## Core Flows and Data Scenarios

### Flow 1: Complete Data → Loan Suggestion
**Input**:
- Crop: "palay" (rice)
- Hectares: 2
- Province: "Nueva Ecija"
- Irrigation: "Rainfed"
- Cost breakdown available

**Expected**:
- Loan summary artifact created
- Cost breakdown computed from benchmarks
- Risk flag for "Rainfed" irrigation (high severity)
- Loan suggestion computed with risk adjustment
- Visibility matches deployment profile
- All artifacts persisted

### Flow 2: Missing Hectares
**Input**:
- Crop: "palay"
- Hectares: missing or 0
- Province: "Nueva Ecija"

**Expected**:
- System handles gracefully (no crash)
- Uses minimum loan amount or shows appropriate message
- Confidence set to "low"
- Missing fields logged in artifact

### Flow 3: Missing Cost Breakdown
**Input**:
- Crop: "palay"
- Hectares: 2
- Cost breakdown: missing

**Expected**:
- Falls back to benchmark calculation
- Uses average cost per hectare from crop benchmarks
- Confidence may be reduced
- Appropriate disclaimer shown

### Flow 4: Unknown Crop
**Input**:
- Crop: "unknown_crop_xyz"
- Hectares: 2
- Province: "Nueva Ecija"

**Expected**:
- Uses conservative default estimate (e.g., 40,000 PHP/ha)
- Confidence set to "low"
- Disclaimer: "Crop-specific data not available"
- No crash or undefined errors

### Flow 5: Risk Flags Applied
**Input**:
- Crop: "palay"
- Hectares: 2
- Irrigation: "Rainfed" (high risk)
- Additional medium risk flags: 2

**Expected**:
- High risk: 15% reduction per flag (max 30%)
- Medium risk: 8% reduction per flag (max 20%)
- Adjustments logged in artifact
- Final amount within policy min/max

### Flow 6: Clamp/Round Edge Cases
**Input**: Calculated amount = 3,000 PHP (below minimum)
**Expected**: Clamped to minimum (5,000 PHP for CARD_MRI), adjustment logged

**Input**: Calculated amount = 200,000 PHP (above maximum for CARD_MRI)
**Expected**: Clamped to maximum (150,000 PHP for CARD_MRI), adjustment logged

**Input**: Calculated amount = 12,347 PHP
**Expected**: Rounded to 12,500 PHP (nearest 500), adjustment logged

---

## Observability Checks

### Audit Logging Requirements
1. **No PII in Logs**
   - Farmer IDs must be hashed (SHA-256 with salt)
   - No raw farmer IDs in log output
   - Verify: Search logs for UUID patterns, ensure none found

2. **Structured Logging**
   - All logs are single-line JSON
   - Event names follow pattern: `ai.loan_suggestion.computed.v1`
   - Timestamps in ISO 8601 format

3. **No Raw IDs**
   - Correlation IDs are present but not PII
   - Request IDs are present but not PII
   - Verify: Logs contain `correlationId` and `farmerIdHash` but no raw UUIDs

4. **Log Completeness**
   - Every loan suggestion computation emits a log event
   - Log includes: deploymentProfile, visibility, baseAmount, suggestedAmount, confidence
   - Log includes: computeDurationMs, artifactValidation

**Verification**: Run test suite and inspect logs for compliance.

---

## Stop-Ship Conditions

**These conditions must be resolved before any release**:

1. **Critical Bugs**
   - System crashes on valid input
   - Data corruption
   - Security vulnerabilities

2. **PII Leakage**
   - Raw farmer IDs in logs
   - Raw farmer IDs in API responses
   - Raw farmer IDs in error messages

3. **Performance Degradation**
   - Response times > 5s for normal operations
   - Memory leaks
   - Database connection pool exhaustion

4. **Broken Core Flows**
   - Loan suggestion computation fails
   - Artifact persistence fails
   - UI rendering fails

5. **Deployment Profile Mismatch**
   - Wrong visibility for deployment profile
   - Wrong min/max limits
   - Wrong rounding increment

6. **Missing Required Gates**
   - Local gate not passed
   - Required regression gates not passed
   - PR template not completed

**Resolution**: Fix issue, re-run affected gates, verify resolution.

---

## Test Data

### Valid Test Cases
- Crop: "palay", "rice", "mais", "corn"
- Hectares: 0.5, 1, 2, 5, 10
- Provinces: "Nueva Ecija", "Laguna", "Bacolod"
- Irrigation: "Rainfed", "Pump", "Canal"

### Edge Cases
- Hectares: 0, negative, very large (100+)
- Crop: empty string, unknown crop, special characters
- Missing fields: crop, hectares, province, all
- Risk flags: none, one, many, all high severity

---

## Regression Test Checklist

When running regression tests, verify:

- [ ] All core flows work as expected
- [ ] Edge cases handled gracefully
- [ ] No new errors in console/logs
- [ ] Performance is acceptable
- [ ] UI renders correctly
- [ ] Database operations succeed
- [ ] Audit logs are compliant
- [ ] Deployment profiles work correctly

