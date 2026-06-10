---
name: sdd-implement-code
description: Generate skill.md with role prompts and trigger implementation. Reads breakdown files (prod, testing, design, tech) and optionally DESIGN.md to generate a comprehensive skill.md file that can be invoked by AI agents for full slice code production (Database, API, Frontend UI Component with reactive state, and SEO Metadata).
license: MIT
compatibility: Requires TVP-SDD-Dev CLI.
metadata:
  author: Talapvnk
  version: "2.0"
  generatedBy: "1.0"
---

Generate skill.md with role prompts and trigger implementation using breakdown files and optional DESIGN.md from the TVP-SDD-Dev CLI.

## What This Skill Does

When invoked, this skill will:
1. Run the command: `sdd-gen /implement-code <featureName> <num>`
2. Search for breakdown files in `docs/prod/<featureName>/<feature><num>-*.md`
3. Optionally search for DESIGN.md (if exists) for visual tokens
4. Generate a skill.md file with role prompt and file references
5. Trigger implementation (similar to openspec apply workflow)

## When to Use

Use this skill when you need to:
- Generate implementation prompts for AI-assisted coding
- Combine visual design tokens with business and technical requirements
- Create comprehensive instructions for full slice code production
- Provide AI agents with complete context for implementation

## How to Use

Provide the feature name and user acceptance number as input:
```
Feature name: user-authentication
User acceptance number: 01
```

The skill will then execute the CLI command, generate the skill.md file, and trigger implementation.

## What Gets Generated

The skill.md file includes:
- Role prompt: "You are a senior IT fullstack software engineer architect..."
- File references to breakdown files:
  - `docs/prod/<featureName>/<feature><num>-prod.md`
  - `docs/prod/<featureName>/<feature><num>-tech.md`
  - `docs/prod/<featureName>/<feature><num>-design.md` (optional)
  - `docs/prod/<featureName>/<feature><num>-testing.md` (optional)
- Optional DESIGN.md content if exists
- Instructions for full slice code production (Database, API, Frontend UI Component with reactive state, and SEO Metadata)

## Prerequisites

Before using this skill, ensure:
- Breakdown files exist in `docs/prod/<featureName>/`:
  - `<feature><num>-prod.md` (required)
  - `<feature><num>-tech.md` (required)
  - `<feature><num>-design.md` (optional)
  - `<feature><num>-testing.md` (optional)
- DESIGN.md is optional (if exists, visual tokens will be included)
- Run `/breakdown-task` first to generate breakdown files from PRD

## File Lookup Order

### Breakdown Files (required)
```
docs/prod/<featureName>/<feature><num>-prod.md
docs/prod/<featureName>/<feature><num>-tech.md
docs/prod/<featureName>/<feature><num>-design.md (optional)
docs/prod/<featureName>/<feature><num>-testing.md (optional)
```

### DESIGN.md (optional)
```
docs/DESIGN.md
docs/<featureName>-DESIGN.md
.windsurf/skills/<featureName>-DESIGN.md
.opencode/skills/<featureName>-DESIGN.md
.claude/skills/<featureName>-DESIGN.md
.antigravity/skills/<featureName>-DESIGN.md
```

## After Generation

After the skill.md is generated:
1. The implementation is automatically triggered (similar to openspec apply)
2. AI agents can invoke the skill.md file for implementation
3. The skill.md file can be reused multiple times

## Notes

- The CLI will prompt to create AI tool folders if none exist
- DESIGN.md is now optional - features can be implemented without visual design documents
- Breakdown files are required for scenario-level implementation
- This skill generates a reusable skill.md file instead of just printing a prompt
- The implementation is triggered automatically after skill.md generation
- This is the third step in the documentation workflow after PRD and breakdown-task
