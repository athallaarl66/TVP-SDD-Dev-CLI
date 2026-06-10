---
name: sdd-qa-report
description: Generate QA Report document from template. Creates comprehensive QA report including test execution summary, test results overview, browser test results, failed tests, flaky tests, performance metrics, coverage report, artifacts (screenshots, videos, traces), issues found, fixes applied, regression tests, and ship readiness assessment.
license: MIT
compatibility: Requires TVP-SDD-Dev CLI.
metadata:
  author: Talapvnk
  version: "1.0"
  generatedBy: "1.0"
---

Generate QA Report document from template using the TVP-SDD-Dev CLI.

## What This Skill Does

When invoked, this skill will:
1. Run the command: `sdd-gen /qa-report <featureName>`
2. Generate a QA Report document template in `.windsurf/workflows/<featureName>-REPORT.md`
3. The document will be generated to all existing AI tool folders (.windsurf, .opencode, .claude, .antigravity)

## When to Use

Use this skill when you need to:
- Document test execution results
- Create formal QA reports for stakeholders
- Track issues found during testing
- Document fixes applied and regression tests
- Assess ship readiness for a feature
- Provide UAT sign-off documentation for clients

## How to Use

Provide the feature name as input:
```
Feature name: user-authentication
```

The skill will then execute the CLI command and generate the QA Report document.

## What Gets Generated

The QA Report document template includes:
- Test Execution Summary
- Test Results Overview
- Browser Test Results
- Failed Tests
- Flaky Tests
- Performance Metrics
- Coverage Report
- Artifacts (Screenshots, Videos, Traces)
- Issues Found
- Fixes Applied
- Regression Tests
- Ship Readiness

## Prerequisites

Before using this skill, ensure:
- Tests have been executed using `/qa-test-run` command
- Test results are available in test-results/ directory
- You have access to test artifacts and metrics

## After Generation

After the QA Report is generated, you should:
1. Fill in the template with actual test results
2. Document all failed tests and their causes
3. Track issues found during testing
4. Document fixes applied for each issue
5. Specify regression tests needed
6. Assess ship readiness based on test results
7. Use the report for UAT sign-off with clients

## Notes

- The document is generated to `docs/test-reports/{featureName}/{featureName}-qa-report.md`
- The document is also copied to AI tool folders if they exist
- The template provides structure - you need to fill in actual test results
- This should be created after test execution is complete
- The report serves as formal documentation for stakeholders
