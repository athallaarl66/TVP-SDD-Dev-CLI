---
name: "SDD: Implement Code"
description: "Load DESIGN.md and generate AI implementation prompt. Reads visual design tokens from DESIGN.md and generates a comprehensive prompt combining design specs with BRD and Technical Design references for full slice code production (Database, API, Frontend UI Component with reactive state, and SEO Metadata)."
category: Workflow
tags: [workflow, implementation, ai, code, development]
---

Generate AI implementation prompt using DESIGN.md and documentation from the TVP-SDD-Dev CLI.

## What This Workflow Does

When invoked, this workflow will:
1. Run the command: `sdd-gen /implement-code <featureName>`
2. Search for DESIGN.md in multiple locations (docs/DESIGN.md, docs/<featureName>-DESIGN.md, or .windsurf/skills/<featureName>-DESIGN.md)
3. Read DESIGN.md for visual tokens and design specifications
4. Generate a comprehensive AI prompt combining design specs with BRD and Technical Design references
5. Display the prompt in terminal for use with AI agents (Windsurf Cascade, Claude, OpenCode)

## Input

Provide the feature name as input:
```
Feature name: user-authentication
```

## What Gets Generated

The AI implementation prompt includes:
- Visual design tokens from DESIGN.md
- References to BRD document for business requirements
- References to Technical Design document for technical specifications
- Instructions for full slice code production (Database, API, Frontend UI Component with reactive state, and SEO Metadata)

## Prerequisites

Before using this workflow, ensure:
- DESIGN.md exists in one of these locations:
  - `docs/DESIGN.md` (generic for entire project)
  - `docs/<featureName>-DESIGN.md` (feature-specific)
  - `.windsurf/skills/<featureName>-DESIGN.md`
  - `.opencode/skills/<featureName>-DESIGN.md`
  - `.claude/skills/<featureName>-DESIGN.md`
  - `.antigravity/skills/<featureName>-DESIGN.md`
- BRD document exists in skills folder
- Technical Design document exists in skills folder

## After Generation

After the prompt is generated, you should:
1. Copy the output from the terminal
2. Paste it to your AI agent (Windsurf Cascade, Claude, OpenCode)
3. The AI agent will use the prompt to implement the feature

## Notes

- The prompt is displayed in terminal - you need to copy it manually
- This workflow bridges the gap between documentation and implementation
- DESIGN.md should contain visual tokens (colors, layout, components)
