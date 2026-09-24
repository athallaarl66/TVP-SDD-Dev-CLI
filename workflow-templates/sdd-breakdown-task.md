---
name: "SDD: Breakdown Task"
description: "Parse PRD and generate scenario-level documentation. Creates granular docs per user acceptance including production requirements, testing scenarios, design specifications, and technical specifications using templates."
category: Workflow
tags: [workflow, documentation, breakdown, scenarios, implementation]
---

Parse Product Requirements Document (PRD) and generate scenario-level documentation for each user acceptance using the TVP-SDD-Dev CLI.

## What This Workflow Does

When invoked, this workflow will:
1. Run the command: `sdd-gen /breakdown-task <prd-file-path> [featureName]`
2. Parse the PRD.md file to extract user stories and acceptance criteria
3. Create folder structure: `docs/production/<feature-name>/`
4. Generate 4 files per user acceptance (numbered by PRD order):
   - `<feature>-<no>-<story-slug>-prod.md` - User acceptance from production perspective
   - `<feature>-<no>-<story-slug>-testing.md` - Testing scenarios
   - `<feature>-<no>-<story-slug>-design.md` - Wireframe + Figma/Sketch links
   - `<feature>-<no>-<story-slug>-tech.md` - API specs, seed data, permissions

Numbering (`<no>`) follows the user-story order in the PRD, so the files sort in implementation sequence.

## Input

Provide the PRD file path and optionally a feature name:
```
PRD file path: docs/features/user-authentication-prd.md
Feature name (optional): user-authentication
```

If feature name is omitted, it is extracted from the PRD filename (e.g. `user-authentication-prd.md` → `user-authentication`). Both flat (`<feature>-prd.md`) and folder (`<feature>/prd.md`) layouts are supported.

## What Gets Generated

For each user acceptance in the PRD, the following files are generated:

### Production Requirements (`<feature>-<no>-<story-slug>-prod.md`)
- User acceptance criteria
- Business value
- Success metrics
- User persona
- User journey
- Edge cases and constraints

### Testing Scenarios (`<feature>-<no>-<story-slug>-testing.md`)
- Test cases with Given/When/Then format
- Edge cases
- Negative testing
- Performance testing
- Security testing
- Acceptance criteria verification

### Design Specifications (`<feature>-<no>-<story-slug>-design.md`)
- Wireframe descriptions
- Figma/Sketch links
- UI components
- Visual guidelines (color, typography, spacing)
- Responsive design
- Animation and interactions
- Accessibility requirements

### Technical Specifications (`<feature>-<no>-<story-slug>-tech.md`)
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
│   ├── <feature>-<no>-<story-slug>-prod.md
│   ├── <feature>-<no>-<story-slug>-testing.md
│   ├── <feature>-<no>-<story-slug>-design.md
│   └── <feature>-<no>-<story-slug>-tech.md
```

Example:
```
docs/production/
├── user-authentication/
│   ├── user-authentication-01-cv-upload-prod.md
│   ├── user-authentication-01-cv-upload-testing.md
│   ├── user-authentication-01-cv-upload-design.md
│   └── user-authentication-01-cv-upload-tech.md
│   ├── user-authentication-02-verify-identity-prod.md
│   ├── user-authentication-02-verify-identity-testing.md
│   ├── user-authentication-02-verify-identity-design.md
│   └── user-authentication-02-verify-identity-tech.md
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
- Folder creation fails → Error with permission message

## Notes

- The PRD must exist before running this command
- User stories are extracted from the "User Stories" section of the PRD
- If featureName is omitted, it is extracted from the PRD filename
- This is the second step in the documentation workflow after PRD generation
