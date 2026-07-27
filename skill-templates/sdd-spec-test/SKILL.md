---
name: sdd-spec-test
description: Generate Playwright E2E Test Specification from template. Creates comprehensive test planning including Playwright configuration, Page Object Model structure, E2E test cases (user flows, form validation, navigation, API integration, responsive, accessibility, performance), test data management, test execution commands, CI/CD integration, and reporting & debugging.
license: MIT
compatibility: Requires TVP-SDD-Dev CLI.
metadata:
  author: Talapvnk
  version: "1.0"
  generatedBy: "1.0"
---

Generate Playwright E2E Test Specification for a feature using the TVP-SDD-Dev CLI.

## What This Skill Does

When invoked, this skill will:
1. Run the command: `sdd-gen /spec-test <featureName>`
2. Generate a Spec Test document in `docs/test-reports/{featureName}/{featureName}-spec-test.md`

## When to Use

Use this skill when you need to:
- Plan E2E test scenarios for a feature
- Define test cases for user flows and form validation
- Specify navigation and API integration tests
- Plan responsive, accessibility, and performance testing
- Set up test data management strategies
- Configure Playwright test execution
- Plan CI/CD integration for automated testing
- Establish reporting and debugging procedures

## How to Use

Provide the feature name as input:
```
Feature name: user-authentication
```

The skill will then execute the CLI command and generate the Spec Test document.

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

## Notes

- The document is generated to `docs/test-reports/{featureName}/{featureName}-spec-test.md`
- The template provides structure - you need to fill in the actual content
- This should be created after Technical Design to ensure test coverage
