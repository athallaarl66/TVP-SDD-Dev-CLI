---
name: "SDD: Design System"
description: "Generate global Design System documentation from template. Creates comprehensive design system documentation including brand guidelines, color palette, typography, spacing, components, design tokens, iconography, responsive breakpoints, accessibility, animation, and patterns."
category: Workflow
tags: [workflow, documentation, design, design-system, ui, ux]
---

Generate global Design System documentation using the TVP-SDD-Dev CLI.

## What This Workflow Does

When invoked, this workflow will:
1. Run the command: `sdd-gen /design-system`
2. Generate a Design System document template in `docs/DESIGN.md`
3. The document will be generated to the docs folder

## Input

No input required. This is a one-time setup for the project design system.

## What Gets Generated

The Design System document template includes:
- Brand Guidelines
- Color Palette
- Typography
- Spacing & Layout
- Components
- Design Tokens
- Iconography
- Responsive Breakpoints
- Accessibility
- Animation
- Patterns
- Assets
- Version History

## After Generation

After the Design System is generated, you should:
1. Fill in the template with actual design system specifications
2. Define your brand colors and typography
3. Specify spacing scales and layout systems
4. Document component specifications and design tokens
5. Define accessibility standards and guidelines
6. Establish animation patterns and transitions

## Next Steps

After completing the Design System document:
1. Generate feature-level design: `sdd-gen /feature-design <featureName>`
2. Reference the global design system in feature designs
3. Ensure consistency across all features using the design tokens
4. Update the design system as the project evolves

## Notes

- The document is generated to `docs/DESIGN.md`
- This is a one-time setup for the project design system
- The template provides structure - you need to fill in the actual content
- Feature-specific designs should reference this global design system
- This should be done before generating feature-level design documents
