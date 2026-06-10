---
name: "SDD: Spec Test"
description: "Generate Playwright E2E Test Specification from template. Creates comprehensive test planning including test scenarios, user flows, form validation, navigation, API integration, responsive, accessibility, and performance testing."
category: Workflow
tags: [workflow, testing, qa, playwright, e2e]
---

Generate Playwright E2E Test Specification for a feature using the TVP-SDD-Dev CLI.

## What This Workflow Does

When invoked, this workflow will:
1. Run the command: `sdd-gen /spec-test <featureName>`
2. Generate a Spec Test document template in `docs/test-reports/{featureName}/{featureName}-spec-test.md`
3. The document will also be copied to AI tool folders (.windsurf, .opencode, .claude, .antigravity) if they exist

## Input

Provide the feature name as input:
```
Feature name: user-authentication
```

## What Gets Generated

The Spec Test document template includes:
- Playwright Configuration
- Page Object Model Structure
- E2E Test Cases (User Flows, Form Validation, Navigation, API Integration, Responsive, Accessibility, Performance)
- Test Data Management
- Test Execution Commands
- CI/CD Integration
- Reporting & Debugging

## After Generation

After the Spec Test is generated, you should:
1. Fill in the template with actual test scenarios
2. Define specific test cases for each user flow
3. Specify test data requirements and management
4. Configure Playwright settings for your project
5. Plan test execution strategy
6. Set up CI/CD integration
7. Define reporting and debugging procedures

## Next Steps

After completing the Spec Test document:
1. Generate test script: `sdd-gen /qa-test-script <featureName>`
2. Run tests: `sdd-gen /qa-test-run <featureName>`
3. Generate QA report: `sdd-gen /qa-report <featureName>`
