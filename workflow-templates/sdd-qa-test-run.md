---
name: "SDD: QA Test Run"
description: "Execute Playwright test and add script to package.json. Auto-installs @playwright/test and Playwright browsers if not present, then adds qa-run:[featureName] script to package.json and provides execution command for running the tests."
category: Workflow
tags: [workflow, testing, playwright, execution, automation]
---

Execute Playwright test and add script to package.json using the TVP-SDD-Dev CLI.

## What This Workflow Does

When invoked, this workflow will:
1. Run the command: `sdd-gen /qa-test-run <featureName>`
2. Auto-install @playwright/test if not present in the project
3. Auto-install Playwright browsers if not present
4. Add `qa-run:<featureName>` script to package.json
5. Provide the execution command: `npm run qa-run:<featureName>`

## Input

Provide the feature name as input:
```
Feature name: user-authentication
```

## What Gets Done

The workflow performs the following:
- Checks for @playwright/test in package.json
- Installs @playwright/test if not present
- Installs Playwright browsers if not present
- Adds test script to package.json scripts section
- Provides command to run the tests

## Prerequisites

Before using this workflow, ensure:
- Test script exists in `tests/<featureName>.spec.js`
- package.json exists in the project root
- Node.js and npm are installed

## After Setup

After the setup is complete, you can:
1. Run tests using: `npm run qa-run:<featureName>`
2. Or run directly: `npx playwright test tests/<featureName>.spec.js`
3. View test results in the terminal
4. Check test reports in the test-results/ directory

## Next Steps

After running tests:
1. Review test results
2. Generate QA report: `sdd-gen /qa-report <featureName>`
3. Document any issues found
4. Apply fixes and re-run tests
