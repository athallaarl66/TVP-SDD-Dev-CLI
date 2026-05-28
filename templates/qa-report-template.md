# Playwright E2E Test Report: {FEATURE_NAME}

## Test Execution Summary

| Field | Value |
|-------|-------|
| **Date** | {DATE} |
| **Feature** | {FEATURE_NAME} |
| **Base URL** | {BASE_URL} |
| **Branch** | {BRANCH} |
| **Commit** | {COMMIT_SHA} ({COMMIT_DATE}) |
| **PR** | {PR_NUMBER} ({PR_URL}) or "—" |
| **Environment** | Development / Staging / Production |
| **Test Duration** | {DURATION} |
| **Playwright Version** | {VERSION} |
| **Node Version** | {NODE_VERSION} |

---

## Test Results Overview

| Metric | Count |
|--------|-------|
| **Total Tests** | {TOTAL} |
| **Passed** | {PASSED} |
| **Failed** | {FAILED} |
| **Flaky** | {FLAKY} |
| **Skipped** | {SKIPPED} |
| **Pass Rate** | {PASS_RATE}% |

---

## Browser Test Results

| Browser | Passed | Failed | Flaky | Skipped | Duration |
|---------|--------|--------|-------|---------|----------|
| Chromium | {N} | {N} | {N} | {N} | {TIME} |
| Firefox | {N} | {N} | {N} | {N} | {TIME} |
| WebKit | {N} | {N} | {N} | {N} | {TIME} |

---

## Failed Tests

### TC-001: [Test Case Name]

| Field | Value |
|-------|-------|
| **Browser** | Chromium / Firefox / WebKit |
| **File** | `tests/[test-file].spec.js` |
| **Line** | {LINE_NUMBER} |
| **Error** | {ERROR_MESSAGE} |
| **Screenshot** | [View Screenshot](screenshots/test-001-failed.png) |
| **Video** | [View Video](videos/test-001.webm) |
| **Trace** | [View Trace](trace.zip) |

**Error Details:**
```
{FULL_ERROR_STACK_TRACE}
```

**Expected:** {What should have happened}

**Actual:** {What actually happened}

**Reproduction Steps:**
1. {Step 1}
2. {Step 2}
3. {Step 3}

---

### TC-002: [Test Case Name]

| Field | Value |
|-------|-------|
| **Browser** | Chromium / Firefox / WebKit |
| **File** | `tests/[test-file].spec.js` |
| **Line** | {LINE_NUMBER} |
| **Error** | {ERROR_MESSAGE} |
| **Screenshot** | [View Screenshot](screenshots/test-002-failed.png) |
| **Video** | [View Video](videos/test-002.webm) |
| **Trace** | [View Trace](trace.zip) |

**Error Details:**
```
{FULL_ERROR_STACK_TRACE}
```

**Expected:** {What should have happened}

**Actual:** {What actually happened}

---

## Flaky Tests

| Test ID | Test Name | Browser | Failure Rate | Last Failed |
|---------|------------|---------|--------------|-------------|
| TC-F001 | [Test Name] | Chromium | {X}% | {DATE} |
| TC-F002 | [Test Name] | Firefox | {X}% | {DATE} |

---

## Performance Metrics

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Average Test Duration | < {X}s | {X}s | ✅ / ❌ |
| Slowest Test | < {X}s | {X}s | ✅ / ❌ |
| Total Suite Duration | < {X}s | {X}s | ✅ / ❌ |

**Slowest Tests:**
1. {Test Name} - {Duration}
2. {Test Name} - {Duration}
3. {Test Name} - {Duration}

---

## Coverage Report

| Type | Coverage |
|------|----------|
| Test Coverage | {X}% |
| Page Coverage | {X}% |
| User Flow Coverage | {X}% |

**Uncovered Areas:**
- [Area 1]
- [Area 2]

---

## Artifacts

| Artifact | Location | Size |
|----------|----------|------|
| HTML Report | `playwright-report/index.html` | {SIZE} |
| Screenshots | `test-results/` | {COUNT} files |
| Videos | `test-results/*/video.webm` | {COUNT} files |
| Traces | `test-results/*/trace.zip` | {COUNT} files |

---

## Issues Found

| Issue ID | Severity | Category | Browser | Status |
|----------|----------|----------|---------|--------|
| ISSUE-001 | Critical / High / Medium / Low | Functional / Visual / Performance | All / Specific | Open / Fixed |

### ISSUE-001: [Issue Title]

**Severity:** Critical / High / Medium / Low
**Category:** Functional / Visual / Performance / Accessibility
**Browser:** All / Chromium / Firefox / WebKit

**Description:**
{Detailed description of the issue}

**Steps to Reproduce:**
1. Navigate to {URL}
2. Click on {element}
3. Observe {behavior}

**Expected Behavior:**
{What should happen}

**Actual Behavior:**
{What actually happens}

**Evidence:**
- Screenshot: ![Screenshot](screenshots/issue-001.png)
- Video: [Watch Video](videos/issue-001.webm)

---

## Fixes Applied

| Issue ID | Fix Status | Commit | Files Changed | Verified By |
|----------|-----------|--------|---------------|-------------|
| ISSUE-001 | Fixed / Verified / Deferred | {SHA} | {FILES} | {NAME} |

### Before/After Evidence

#### ISSUE-001: [Issue Title]
**Before:** ![Before](screenshots/issue-001-before.png)
**After:** ![After](screenshots/issue-001-after.png)

**Verification Test:** `npx playwright test -g "[Test Name]"`

---

## Regression Tests

| Test | Status | Browser | Notes |
|------|--------|---------|-------|
| [Test 1] | Passed / Failed | All | {Notes} |
| [Test 2] | Passed / Failed | All | {Notes} |

---

## Ship Readiness

| Criteria | Status | Notes |
|----------|--------|-------|
| All critical tests pass | ✅ / ❌ | {Notes} |
| No high-severity issues | ✅ / ❌ | {Notes} |
| Performance within targets | ✅ / ❌ | {Notes} |
| Coverage meets threshold | ✅ / ❌ | {Notes} |
| No flaky tests | ✅ / ❌ | {Notes} |

**Overall Status:** ✅ READY TO SHIP / ❌ NOT READY

**Recommendations:**
- [Recommendation 1]
- [Recommendation 2]

---

## Next Steps

1. [ ] Review failed tests and fix issues
2. [ ] Re-run tests: `npx playwright test`
3. [ ] Verify fixes in staging environment
4. [ ] Update documentation if needed
5. [ ] Merge to production

---

## Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| QA Engineer | | | |
| Developer | | | |
| Tech Lead | | | |

---

## Change History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | {DATE} | {AUTHOR} | Initial test report |