---
name: sdd-prd
description: Generate Product Requirements Document (PRD) from template. Creates comprehensive product specs including executive summary, stakeholder analysis, functional/non-functional requirements, UI requirements, data requirements, integration requirements, business rules, risks, and success metrics.
license: MIT
compatibility: Requires TVP-SDD-Dev CLI.
metadata:
  author: Talapvnk
  version: "1.0"
  generatedBy: "1.0"
---

Generate Product Requirements Document (PRD) for a feature using the TVP-SDD-Dev CLI.

## What This Skill Does

When invoked, this skill will:
1. Run the command: `sdd-gen /prd <featureName>`
2. Generate a PRD document template at `docs/features/<featureName>-prd.md`
3. Pre-fill the template with the feature name, project name (from package.json), and current date

## When to Use

Use this skill when you need to:
- Define product objectives and requirements for a new feature
- Document stakeholder analysis and user flows
- Specify functional and non-functional requirements
- Define UI state requirements and user interface specifications
- Document data requirements and integration needs
- Establish business rules and success metrics

## How to Use

Provide the feature name as input:
```
Feature name: user-authentication
```

The skill will then execute the CLI command and generate the PRD document.

## What Gets Generated

The PRD document template includes:
- Executive Summary
- Stakeholder Analysis
- Functional Requirements
- Non-Functional Requirements
- User Interface Requirements
- Data Requirements
- Integration Requirements
- Business Rules
- Risks & Mitigation
- Success Metrics

## After Generation

After the PRD is generated, you should:
1. Fill in the template with actual product requirements
2. Review and refine stakeholder analysis
3. Define clear success metrics
4. Document any specific business rules
5. Identify and document risks with mitigation strategies

## Notes

- The document is generated to `docs/features/{featureName}-prd.md`
- The template is pre-filled with feature name, project name, and current date
- The template provides structure - you need to fill in the actual product content
- This is the first step in the documentation workflow before Technical Design
