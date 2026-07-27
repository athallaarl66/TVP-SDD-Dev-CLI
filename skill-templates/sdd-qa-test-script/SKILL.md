---
name: sdd-qa-test-script
description: Generate test script (Playwright or Unit) from SPEC_TEST document with multi-framework support. Auto-detects project type and supports Jest, PHPUnit, xUnit, NUnit, JUnit, pytest.
license: MIT
compatibility: Requires TVP-SDD-Dev CLI.
metadata:
  author: Talapvnk
  version: "1.0"
  generatedBy: "1.0"
---

Generate test script from SPEC_TEST document using the TVP-SDD-Dev CLI.

## What This Skill Does

When invoked, this skill will:
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

## When to Use

Use this skill when you need to:
- Generate test scripts from test specifications
- Create initial test structure for E2E or unit testing
- Set up test files based on documented test scenarios
- Automate the creation of test files from specifications

## How to Use

Provide the feature name as input:
```
Feature name: user-authentication
```

The skill will auto-detect your project type and prompt for framework selection.

## What Gets Generated

### Playwright (E2E)
- Basic test structure with describe block
- Placeholder tests based on SPEC_TEST content
- Uses ESM imports (`import { test, expect } from '@playwright/test'`)

### Unit Tests
- Framework-appropriate test structure
- Placeholder tests based on SPEC_TEST content
- Follows language conventions (camelCase for JS/Java, PascalCase for C#, snake_case for Python)

## Prerequisites

Before using this skill, ensure:
- SPEC_TEST.md exists in `docs/test-reports/{featureName}/`
- The SPEC_TEST.md has been filled with test scenarios
- The tests/ directory exists (will be created if not)

## After Generation

After the test script is generated, you should:
1. Customize the test script in the generated file
2. Add specific test cases based on your requirements
3. Configure test selectors and assertions
4. Set up test data and fixtures

## Notes

- The CLI auto-detects your project type for relevant framework options
- Follows standard test file conventions for each framework
- The generated script has basic structure - you need to customize it
- Test scripts are generated based on SPEC_TEST content
