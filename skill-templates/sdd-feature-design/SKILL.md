---
name: sdd-feature-design
description: Generate feature-level design documentation from template. Creates comprehensive feature design documentation including overview, user flow, screen layouts, component hierarchy, design specifications, responsive design, interactions & states, data visualization, accessibility, animation, assets, and references.
license: MIT
compatibility: Requires TVP-SDD-Dev CLI.
metadata:
  author: Talapvnk
  version: "1.0"
  generatedBy: "1.1.1"
---

Generate feature-level design documentation using the TVP-SDD-Dev CLI.

## What This Skill Does

When invoked, this skill will:
1. Run the command: `sdd-gen /feature-design <featureName>`
2. Generate a Feature Design document template in `docs/features/{featureName}-design.md`
3. The document will be generated to the docs folder

## When to Use

Use this skill when you need to:
- Create low-fidelity wireframes for a specific feature
- Document user flows and screen layouts
- Define component hierarchy for a feature
- Specify design specifications and responsive behavior
- Document interactions, states, and animations
- Define data visualization requirements
- Establish accessibility standards for the feature

## How to Use

Provide the feature name as input:
```
Feature name: user-authentication
```

The skill will then execute the CLI command and generate the Feature Design document.

## What Gets Generated

The Feature Design document template includes:
- Overview
- User Flow
- Screen Layouts (with ASCII wireframes)
- Component Hierarchy
- Design Specifications
- Responsive Design
- Interactions & States
- Data Visualization
- Accessibility
- Animation
- Assets
- Notes
- References

## After Generation

After the Feature Design is generated, you should:
1. Fill in the template with actual feature design specifications
2. Create ASCII wireframe diagrams for each screen
3. Document user flows and navigation paths
4. Define component hierarchy and relationships
5. Specify design tokens and spacing
6. Document interactions, states, and transitions
7. Reference the global design system in docs/DESIGN.md

## Notes

- The document is generated to `docs/features/{featureName}-design.md`
- This should be done after generating the global design system
- The template provides structure - you need to fill in the actual content
- Use ASCII art for wireframe diagrams
- Reference the global design system for consistency across features
- This is part of the documentation workflow before implementation
