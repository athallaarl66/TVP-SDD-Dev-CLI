---
name: sdd-implement-code
description: Load DESIGN.md and generate AI implementation prompt. Reads visual design tokens from DESIGN.md and generates a comprehensive prompt combining design specs with BRD and Technical Design references for full slice code production (Database, API, Frontend UI Component with reactive state, and SEO Metadata).
license: MIT
compatibility: Requires TVP-SDD-Dev CLI.
metadata:
  author: Talapvnk
  version: "1.0"
  generatedBy: "1.0"
---

Generate AI implementation prompt using DESIGN.md and documentation from the TVP-SDD-Dev CLI.

## What This Skill Does

When invoked, this skill will:
1. Run the command: `sdd-gen /implement-code <featureName>`
2. Search for DESIGN.md in multiple locations (docs/DESIGN.md, docs/<featureName>-DESIGN.md, or .windsurf/skills/<featureName>-DESIGN.md)
3. Read DESIGN.md for visual tokens and design specifications
4. Generate a comprehensive AI prompt combining design specs with BRD and Technical Design references
5. Display the prompt in terminal for use with AI agents (Windsurf Cascade, Claude, OpenCode)

## When to Use

Use this skill when you need to:
- Generate implementation prompts for AI-assisted coding
- Combine visual design tokens with business and technical requirements
- Create comprehensive instructions for full slice code production
- Provide AI agents with complete context for implementation

## How to Use

Provide the feature name as input:
```
Feature name: user-authentication
```

The skill will then execute the CLI command and generate the AI implementation prompt.

## What Gets Generated

The AI implementation prompt includes:
- Visual design tokens from DESIGN.md
- References to BRD document for business requirements
- References to Technical Design document for technical specifications
- Instructions for full slice code production (Database, API, Frontend UI Component with reactive state, and SEO Metadata)

## Prerequisites

Before using this skill, ensure:
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

- The CLI will prompt to create AI tool folders if none exist
- The prompt is displayed in terminal - you need to copy it manually
- This skill bridges the gap between documentation and implementation
- DESIGN.md should contain visual tokens (colors, layout, components)
