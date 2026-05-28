---
name: "SDD: BRD"
description: "Generate Business Requirements Document (BRD) from template. Creates comprehensive business specs including executive summary, stakeholder analysis, functional/non-functional requirements, UI requirements, data requirements, integration requirements, business rules, risks, and success metrics."
category: Workflow
tags: [workflow, documentation, brd, business, requirements]
---

Generate Business Requirements Document (BRD) for a feature using the TVP-SDD-Dev CLI.

## What This Workflow Does

When invoked, this workflow will:
1. Run the command: `sdd-gen /brd <featureName>`
2. Generate a BRD document template in `.windsurf/skills/<featureName>-BRD.md`
3. The document will be generated to all existing AI tool folders (.windsurf, .opencode, .claude, .antigravity)

## Input

Provide the feature name as input:
```
Feature name: user-authentication
```

## What Gets Generated

The BRD document template includes:
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

After the BRD is generated, you should:
1. Fill in the template with actual business requirements
2. Review and refine stakeholder analysis
3. Define clear success metrics
4. Document any specific business rules
5. Identify and document risks with mitigation strategies

## Next Steps

After completing the BRD document:
1. Generate Technical Design: `sdd-gen /technical <featureName>`
2. Generate Spec Test: `sdd-gen /spec-test <featureName>`
3. Create DESIGN.md for visual specifications
