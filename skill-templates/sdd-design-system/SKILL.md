---
name: sdd-design-system
description: Generate global Design System documentation (DESIGN.md) for consistent UI/UX across features.
license: MIT
compatibility: Requires TVP-SDD-Dev CLI.
metadata:
  author: Talapvnk
  version: "1.0"
  generatedBy: "1.0"
---

Generate global Design System documentation using the TVP-SDD-Dev CLI.

## What This Skill Does

When invoked, this skill will:
1. Run the command: `sdd-gen /design-system`
2. Generate `docs/DESIGN.md` from design system template

## When to Use

Use this skill when you need to:
- Establish a global design system for the project
- Define color palette, typography, spacing, and components
- Create consistent UI/UX guidelines across features
- Reference design tokens for feature-level designs

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

## Notes

- The document is generated to `docs/DESIGN.md`
- This is a global design system - reference it in `/feature-design`
- The template provides structure - you need to fill in the actual content
