---
name: sdd-qa-test-run
description: Execute Playwright test and add script to package.json. Auto-installs @playwright/test and Playwright browsers if not present, then adds qa-run:[featureName] script to package.json and provides execution command for running the tests.
license: MIT
compatibility: Requires TVP-SDD-Dev CLI.
metadata:
  author: Talapvnk
  version: "1.0"
  generatedBy: "1.0"
---

Execute Playwright test and add script to package.json using the TVP-SDD-Dev CLI.

## What This Skill Does

When invoked, this skill will:
1. Run the command: `sdd-gen /qa-test-run <featureName>`
2. Auto-install @playwright/test if not present in the project
3. Auto-install Playwright browsers if not present
4. Add `qa-run:<featureName>` script to package.json
5. Provide the execution command: `npm run qa-run:<featureName>`

## When to Use

Use this skill when you need to:
- Set up Playwright test execution for a feature
- Add test scripts to package.json
- Ensure Playwright dependencies are installed
- Run E2E tests for a specific feature

## How to Use

Provide the feature name as input:
```
Feature name: user-authentication
```

The skill will then execute the CLI command and set up test execution.

## What Gets Done

The skill performs the following:
- Checks for @playwright/test in package.json
- Installs @playwright/test if not present
- Installs Playwright browsers if not present
- Adds test script to package.json scripts section
- Provides command to run the tests

## Prerequisites

Before using this skill, ensure:
- Test script exists in `tests/<featureName>.spec.ts`
- package.json exists in the project root
- Node.js and npm are installed

## After Setup

After the setup is complete, you can:
1. Run tests using: `npm run qa-run:<featureName>`
2. Or run directly: `npx playwright test tests/<featureName>.spec.ts`
3. View test results in the terminal
4. Check test reports in the test-results/ directory

## Notes

- The CLI will auto-install Playwright dependencies if needed
- Browsers are installed automatically if not present
- The test script is added to package.json for easy execution
- This skill handles all Playwright setup automatically
- No manual Playwright installation required
