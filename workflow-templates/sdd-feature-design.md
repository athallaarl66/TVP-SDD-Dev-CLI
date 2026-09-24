---
name: "SDD: Feature Design"
description: "Generate feature-level design documentation with ASCII wireframes and component hierarchy."
category: Workflow
tags: [workflow, design, feature, ui, ux, wireframe]
---

Generate feature-level design documentation using the TVP-SDD-Dev CLI.

## What This Workflow Does

When invoked, this workflow will:
1. Run the command: `sdd-gen /feature-design <featureName>`
2. Generate `docs/features/{featureName}-design.md` from feature design template

## Input

Provide the feature name as input:
```
Feature name: user-authentication
```

## What Gets Generated

The Feature Design document includes:
- Feature Overview
- Screen Descriptions
- ASCII Wireframe Diagrams
- Component Hierarchy
- State Management
- Interaction Specifications
- Design Token References

## Prerequisites

Before using this workflow, ensure:
- Consider running `/design-system` first to establish global design tokens
- PRD document exists in `docs/features/`

## After Generation

After the feature design is generated, you should:
1. Fill in ASCII wireframes for each screen
2. Define component hierarchy and props
3. Specify interactions and state management
4. Reference global design tokens from `docs/DESIGN.md`

## Next Steps

After generating the feature design:
1. Run breakdown: `sdd-gen /breakdown-task <prd-file> <featureName>`
