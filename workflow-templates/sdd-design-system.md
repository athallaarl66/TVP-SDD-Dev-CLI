---
name: "SDD: Design System"
description: "Generate global Design System documentation (DESIGN.md) for consistent UI/UX across features."
category: Workflow
tags: [workflow, design, system, ui, ux]
---

Generate global Design System documentation using the TVP-SDD-Dev CLI.

## What This Workflow Does

When invoked, this workflow will:
1. Run the command: `sdd-gen /design-system`
2. Generate `docs/DESIGN.md` from design system template

## What Gets Generated

The Design System document includes:
- Color Palette
- Typography
- Spacing System
- Component Guidelines
- Iconography
- Responsive Design Rules
- Accessibility Guidelines

## After Generation

After the design system is generated, you should:
1. Fill in the `docs/DESIGN.md` with actual design tokens
2. Define your color palette and typography
3. Specify spacing and layout rules
4. Reference this file in feature-level designs

## Next Steps

After generating the design system:
1. Create feature designs: `sdd-gen /feature-design <featureName>`
2. Reference design tokens in implementation
