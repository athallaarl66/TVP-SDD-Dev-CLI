---
name: "SDD: QA Test Run"
description: "Run generated tests for a feature across all supported frameworks (Playwright, Jest, PHPUnit, xUnit, NUnit, JUnit, pytest, Go testing). Auto-detects framework from the generated test file, installs dependencies when needed, and executes the correct test command."
category: Workflow
tags: [workflow, testing, playwright, jest, phpunit, xunit, nunit, junit, pytest, gotest, execution, automation]
---

Run generated tests and add run script using the TVP-SDD-Dev CLI.

## What This Workflow Does

When invoked, this workflow will:
1. Run the command: `sdd-gen /qa-test-run <featureName>`
2. Auto-detect framework from the generated test file in `tests/` directory
3. Auto-install dependencies if required (Playwright, Jest)
4. Add `qa-run:<featureName>` script to package.json (Node frameworks only)
5. Execute the correct test command for the detected framework

## Input

Provide the feature name as input:
```
Feature name: user-authentication
```

## Supported Frameworks

| Framework | Test File | Run Command |
|-----------|-----------|-------------|
| Playwright (E2E) | `tests/<feature>.spec.ts` | `npx playwright test tests/<feature>.spec.ts` |
| Jest (JS/TS) | `tests/<feature>.test.ts` | `npx jest tests/<feature>.test.ts` |
| PHPUnit (Laravel) | `tests/Feature/<Feature>Test.php` | `php artisan test --filter=<feature>` |
| xUnit / NUnit (.NET) | `tests/<Feature>Tests.cs` | `dotnet test --filter <feature>` |
| JUnit 5 (Java) | `tests/src/test/java/<Feature>Test.java` | `mvn test -Dtest=<Feature>Test` |
| pytest (Python) | `tests/test_<feature>.py` | `python -m pytest tests/test_<feature>.py` |
| Go testing | `tests/<feature>_test.go` | `go test -v ./tests/...` |

## Prerequisites

Before using this workflow, ensure:
- A test file was generated via `sdd-gen /qa-test-script <featureName>`
- The project's runtime is available (Node.js, PHP, .NET SDK, JDK, Python, or Go)
- package.json exists if using Playwright or Jest

## What Gets Done

The workflow performs the following:
- Detects the framework from the generated test file
- Installs Node dependencies if required (Playwright, Jest)
- Adds a `qa-run:<featureName>` script to package.json scripts section for Node frameworks
- Runs the correct test command and shows output

## Next Steps

After running tests:
1. Review test results
2. Generate QA report: `sdd-gen /qa-report <featureName>`
3. Document any issues found
4. Apply fixes and re-run tests