---
name: "SDD: PRD"
description: "Generate Product Requirements Document (PRD) from template. Creates comprehensive product specs including executive summary, stakeholder analysis, functional/non-functional requirements, UI requirements, data requirements, integration requirements, business rules, risks, and success metrics."
category: Workflow
tags: [workflow, documentation, prd, product, requirements]
---

Generate Product Requirements Document (PRD) for a feature using the TVP-SDD-Dev CLI.

## What This Workflow Does

When invoked, this workflow will:
1. Run the command: `sdd-gen /prd <featureName>`
2. Generate a PRD document template in `.windsurf/skills/<featureName>-PRD.md`
3. The document will be generated to all existing AI tool folders (.windsurf, .opencode, .claude, .antigravity)

## Input

Provide the feature name as input:
```
Feature name: user-authentication
```

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

## Next Steps

After completing the PRD document:
1. Breakdown PRD into scenario-level docs: `sdd-gen /breakdown-task <prd-file> <featureName>`
2. Generate Technical Design: `sdd-gen /technical <featureName>`
3. Generate Spec Test: `sdd-gen /spec-test <featureName>`
4. Create DESIGN.md for visual specifications (optional)
