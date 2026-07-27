---
name: "SDD: Breakdown Task"
description: "Parse PRD and generate scenario-level documentation. Creates granular docs per user acceptance including production requirements, testing scenarios, design specifications, and technical specifications using templates."
category: Workflow
tags: [workflow, documentation, breakdown, scenarios, implementation]
---

Parse Product Requirements Document (PRD) and generate scenario-level documentation for each user acceptance using the TVP-SDD-Dev CLI.

## What This Workflow Does

When invoked, this workflow will:
1. Run the command: `sdd-gen /sdd-breakdown-task <prd-file-path> [featureName]`
2. Parse the PRD.md file to extract user stories and acceptance criteria
3. Create folder structure: `docs/production/<feature-name>/`
4. Generate 4 files per user acceptance (auto-incremented from PRD):
   - `<feature><num>-prod.md` - User acceptance from production perspective
   - `<feature><num>-testing.md` - Testing scenarios
   - `<feature><num>-design.md` - Wireframe + Figma/Sketch links
   - `<feature><num>-tech.md` - API specs, seed data, permissions

## Input

Provide the PRD file path and optionally a feature name:
```
PRD file path: docs/features/user-authentication/prd.md
Feature name (optional): user-authentication
```

If feature name is omitted, the skill will process all features from the PRD and group by feature.

## What Gets Generated

For each user acceptance in the PRD, the following files are generated:

### Production Requirements (`<feature><num>-prod.md`)
- User acceptance criteria
- Business value
- Success metrics
- User persona
- User journey
- Edge cases and constraints

### Testing Scenarios (`<feature><num>-testing.md`)
- Test cases with Given/When/Then format
- Edge cases
- Negative testing
- Performance testing
- Security testing
- Acceptance criteria verification

### Design Specifications (`<feature><num>-design.md`)
- Wireframe descriptions
- Figma/Sketch links
- UI components
- Visual guidelines (color, typography, spacing)
- Responsive design
- Animation and interactions
- Accessibility requirements

### Technical Specifications (`<feature><num>-tech.md`)
- API endpoints
- Database changes
- Permissions
- Dependencies
- Impact analysis
- Performance considerations
- Security considerations
- Error handling
- Testing strategy
- Deployment considerations

## File Structure

The generated files follow this structure:
```
docs/production/
├── <feature-name>/
│   ├── <feature><num>-prod.md
│   ├── <feature><num>-testing.md
│   ├── <feature><num>-design.md
│   └── <feature><num>-tech.md
```

Example:
```
docs/production/
├── user-authentication/
│   ├── user-authentication01-prod.md
│   ├── user-authentication01-testing.md
│   ├── user-authentication01-design.md
│   └── user-authentication01-tech.md
```

## After Generation

After the breakdown files are generated, you should:
1. Fill in each template with scenario-specific details
2. Define clear acceptance criteria for each scenario
3. Create wireframes or link to Figma/Sketch designs
4. Specify API endpoints and database changes for each scenario
5. Define testing scenarios and edge cases
6. Review and refine technical specifications

## Error Handling

The workflow will handle these error cases:
- PRD file not found → Error with message to run `/prd` first
- PRD has no user stories → Warning message
- Feature name provided but not found in PRD → Error with list of available features
- Folder creation fails → Error with permission message

## Notes

- The PRD must exist before running this command
- User stories are extracted from the "User Stories" section of the PRD
- Auto-increment numbering is based on user story order
- If featureName is provided, only that feature's user stories are processed
- If featureName is omitted, all user stories are processed and grouped by feature
- This is the second step in the documentation workflow after PRD generation
