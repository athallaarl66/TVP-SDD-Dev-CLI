---
name: sdd-qa-test-script
description: Generate Playwright test script from SPEC_TEST document. Reads SPEC_TEST.md content and generates a Playwright test script with basic structure including test describe block and placeholder tests in the tests/ directory.
license: MIT
compatibility: Requires TVP-SDD-Dev CLI.
metadata:
  author: Talapvnk
  version: "1.0"
  generatedBy: "1.0"
---

Generate Playwright test script from SPEC_TEST document using the TVP-SDD-Dev CLI.

## What This Skill Does

When invoked, this skill will:
1. Run the command: `sdd-gen /qa-test-script <featureName>`
2. Search for SPEC_TEST.md in AI tool workflows folders
3. Read SPEC_TEST.md content
4. Generate a Playwright test script with basic structure
5. Save the test script to `tests/<featureName>.spec.js`

## When to Use

Use this skill when you need to:
- Generate Playwright test scripts from test specifications
- Create initial test structure for E2E testing
- Set up test files based on documented test scenarios
- Automate the creation of test files from specifications

## How to Use

Provide the feature name as input:
```
Feature name: user-authentication
```

The skill will then execute the CLI command and generate the Playwright test script.

## What Gets Generated

The Playwright test script includes:
- Basic test structure with describe block
- Placeholder tests based on SPEC_TEST content
- Test file saved to `tests/<featureName>.spec.js`

## Prerequisites

Before using this skill, ensure:
- SPEC_TEST.md exists in AI tool workflows folder (.devin/workflows/, .opencode/workflows/, etc.)
- The SPEC_TEST.md has been filled with test scenarios
- The tests/ directory exists (will be created if not)

## After Generation

After the test script is generated, you should:
1. Customize the test script in `tests/<featureName>.spec.js`
2. Add specific test cases based on your requirements
3. Configure test selectors and assertions
4. Set up test data and fixtures
5. Run the tests using `/qa-test-run` command

## Notes

- The CLI will prompt to create AI tool folders if none exist
- The generated script has basic structure - you need to customize it
- This skill automates the initial test file creation
- Test scripts are generated based on SPEC_TEST content
