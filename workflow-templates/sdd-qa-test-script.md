---
name: "SDD: QA Test Script"
description: "Generate Playwright test script from SPEC_TEST document. Reads SPEC_TEST.md content and generates a Playwright test script with basic structure including test describe block and placeholder tests in the tests/ directory."
category: Workflow
tags: [workflow, testing, playwright, e2e, automation]
---

Generate Playwright test script from SPEC_TEST document using the TVP-SDD-Dev CLI.

## What This Workflow Does

When invoked, this workflow will:
1. Run the command: `sdd-gen /qa-test-script <featureName>`
2. Search for SPEC_TEST.md in AI tool workflows folders
3. Read SPEC_TEST.md content
4. Generate a Playwright test script with basic structure
5. Save the test script to `tests/<featureName>.spec.js`

## Input

Provide the feature name as input:
```
Feature name: user-authentication
```

## What Gets Generated

The Playwright test script includes:
- Basic test structure with describe block
- Placeholder tests based on SPEC_TEST content
- Test file saved to `tests/<featureName>.spec.js`

## Prerequisites

Before using this workflow, ensure:
- SPEC_TEST.md exists in AI tool workflows folder (.windsurf/workflows/, .opencode/workflows/, etc.)
- The SPEC_TEST.md has been filled with test scenarios
- The tests/ directory exists (will be created if not)

## After Generation

After the test script is generated, you should:
1. Customize the test script in `tests/<featureName>.spec.js`
2. Add specific test cases based on your requirements
3. Configure test selectors and assertions
4. Set up test data and fixtures
5. Run the tests using `/qa-test-run` workflow

## Next Steps

After generating the test script:
1. Run tests: `sdd-gen /qa-test-run <featureName>`
2. Execute tests: `npm run qa-run:<featureName>`
3. Generate QA report: `sdd-gen /qa-report <featureName>`
