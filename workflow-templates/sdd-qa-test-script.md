---
name: "SDD: QA Test Script"
description: "Generate test script (Playwright or Unit) from SPEC_TEST document with multi-framework support. Auto-detects project type and supports Jest, PHPUnit, xUnit, NUnit, JUnit, pytest."
category: Workflow
tags: [workflow, testing, playwright, jest, phpunit, xunit, nunit, junit, pytest, e2e, unit, automation]
---

Generate test script from SPEC_TEST document using the TVP-SDD-Dev CLI.

## What This Workflow Does

When invoked, this workflow will:
1. Run the command: `sdd-gen /qa-test-script <featureName>`
2. Auto-detect project type (PHP, .NET, Java, Python, JS/TS)
3. Prompt to choose test type and framework
4. Read SPEC_TEST.md from `docs/test-reports/{featureName}/`
5. Generate the selected test type with basic structure
6. Save the test script to appropriate location with correct extension

## Supported Frameworks

| Framework | Extension | Convention |
|-----------|-----------|------------|
| Playwright (E2E) | `.spec.ts` | `tests/<feature>.spec.ts` |
| Jest (JS/TS/JSX/TSX) | `.test.ts` | `tests/<feature>.test.ts` |
| PHPUnit (Laravel) | `Test.php` | `tests/Feature/<Feature>Test.php` |
| xUnit (.NET) | `Tests.cs` | `tests/<Feature>Tests.cs` |
| NUnit (.NET) | `Tests.cs` | `tests/<Feature>Tests.cs` |
| JUnit 5 (Java) | `Test.java` | `tests/src/test/java/<Feature>Test.java` |
| pytest (Python) | `_test.py` | `tests/test_<feature>.py` |

## Input

Provide the feature name as input:
```
Feature name: user-authentication
```

Then choose framework from detected or available options.

## What Gets Generated

### Playwright (E2E)
- Basic test structure with describe block
- Placeholder tests based on SPEC_TEST content
- Uses ESM imports

### Unit Tests
- Framework-appropriate test structure
- Placeholder tests based on SPEC_TEST content
- Follows language conventions

## Prerequisites

Before using this workflow, ensure:
- SPEC_TEST.md exists in `docs/test-reports/{featureName}/`
- The SPEC_TEST.md has been filled with test scenarios
- The tests/ directory exists (will be created if not)

## After Generation

After generating the test script, you should:
1. Customize the test script in the generated file
2. Add specific test cases based on your requirements
3. Configure test selectors and assertions
4. Set up test data and fixtures

## Next Steps

After generating the test script:
1. Run Playwright tests: `sdd-gen /qa-test-run <featureName>`
2. Run Jest: `npx jest <featureName>`
3. Run PHPUnit: `php artisan test --filter=<featureName>`
4. Run .NET: `dotnet test --filter <featureName>`
5. Run JUnit: `mvn test -Dtest=<featureName>Test`
6. Run pytest: `pytest tests/test_<feature_name>.py`
7. Generate QA report: `sdd-gen /qa-report <featureName>`
