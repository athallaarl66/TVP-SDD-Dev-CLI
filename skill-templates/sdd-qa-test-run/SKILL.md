---
name: sdd-qa-test-run
description: Run generated tests for a feature across all supported frameworks (Playwright, Jest, PHPUnit, xUnit, NUnit, JUnit, pytest, Go testing). Auto-detects the framework from the generated test file, installs dependencies when needed, and executes the correct test command.
license: MIT
compatibility: Requires TVP-SDD-Dev CLI.
metadata:
  author: Talapvnk
  version: "1.0"
  generatedBy: "1.0"
---

Run generated tests and add run script using the TVP-SDD-Dev CLI.

## What This Skill Does

When invoked, this skill will:
1. Run the command: `sdd-gen /qa-test-run <featureName>`
2. Auto-detect framework from the generated test file in `tests/` directory
3. Auto-install Node dependencies (`@playwright/test`) if required
4. Add `qa-run:<featureName>` script to package.json (Node frameworks only)
5. Execute the correct test command for the detected framework

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

## When to Use

Use this skill when you need to:
- Run generated tests for a feature
- Execute the correct test runner without manual command typing
- Add test scripts to package.json for Node-based projects
- Ensure test dependencies are installed

## How to Use

Provide the feature name as input:
```
Feature name: user-authentication
```

The skill will detect the framework and run the tests automatically.

## Prerequisites

Before using this skill, ensure:
- A test file was generated via `sdd-gen /qa-test-script <featureName>`
- The project's runtime is available (Node.js, PHP, .NET SDK, JDK, Python, or Go)
- package.json exists if using Playwright or Jest

## After Running

After the tests run, you can:
1. Review the terminal output
2. Generate QA report: `sdd-gen /qa-report <featureName>`
3. Document any failures and fix them
4. Re-run with: `sdd-gen /qa-test-run <featureName>`

## Notes

- The framework is detected automatically from the generated test file
- Node-based frameworks (Playwright, Jest) also get a `qa-run:<feature>` script in package.json
- For PHPUnit, JUnit, xUnit/NUnit, pytest, and Go, the native runner is invoked directly
- Playwright browsers are installed automatically if missing