---
name: sdd-design-system
description: Generate global Design System documentation from template. Creates comprehensive design system documentation including brand guidelines, color palette, typography, spacing, components, design tokens, iconography, responsive breakpoints, accessibility, animation, and patterns.
license: MIT
compatibility: Requires TVP-SDD-Dev CLI.
metadata:
  author: Talapvnk
  version: "1.0"
  generatedBy: "1.1.1"
---

Generate global Design System documentation using the TVP-SDD-Dev CLI.

## What This Skill Does

When invoked, this skill will:
1. Run the command: `sdd-gen /design-system`
2. Generate a Design System document template in `docs/DESIGN.md`
3. The document will be generated to the docs folder

## When to Use

Use this skill when you need to:
- Establish a global design system for the project
- Define brand guidelines and visual identity
- Document color palette, typography, and spacing
- Specify design tokens and component specifications
- Define iconography and responsive breakpoints
- Establish accessibility standards and animation guidelines

## How to Use

No input required. Simply invoke the skill to generate the global design system document.

The skill will then execute the CLI command and generate the Design System document.

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

## Notes

- The document is generated to `docs/DESIGN.md`
- This is a one-time setup for the project design system
- The template provides structure - you need to fill in the actual content
- Feature-specific designs should reference this global design system
- This should be done before generating feature-level design documents
