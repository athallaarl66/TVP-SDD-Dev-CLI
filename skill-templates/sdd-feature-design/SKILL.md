---
name: sdd-feature-design
description: Generate feature-level design documentation with ASCII wireframes and component hierarchy.
license: MIT
compatibility: Requires TVP-SDD-Dev CLI.
metadata:
  author: Talapvnk
  version: "1.0"
  generatedBy: "1.0"
---

Generate feature-level design documentation using the TVP-SDD-Dev CLI.

## What This Skill Does

When invoked, this skill will:
1. Run the command: `sdd-gen /feature-design <featureName>`
2. Generate `docs/features/{featureName}-design.md` from feature design template

## When to Use

Use this skill when you need to:
- Design UI/UX for a specific feature
- Create ASCII wireframes for each screen
- Define component hierarchy and visual specifications
- Reference global design system tokens

## How to Use

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

Before using this skill, ensure:
- Consider running `/design-system` first to establish global design tokens
- PRD document exists in `docs/features/`

## After Generation

After the feature design is generated, you should:
1. Fill in ASCII wireframes for each screen
2. Define component hierarchy and props
3. Specify interactions and state management
4. Reference global design tokens from `docs/DESIGN.md`

## Notes

- The document is generated to `docs/features/{featureName}-design.md`
- Reference global design tokens from `docs/DESIGN.md`
- The template provides structure - you need to fill in the actual content
