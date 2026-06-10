---
name: sdd-technical
description: Generate Technical Design Document (TDD) from template. Creates comprehensive technical specs including system architecture, database design, API design, frontend design, security design, performance considerations, scalability design, monitoring & logging, deployment strategy, and testing strategy.
license: MIT
compatibility: Requires TVP-SDD-Dev CLI.
metadata:
  author: Talapvnk
  version: "1.0"
  generatedBy: "1.0"
---

Generate Technical Design Document (TDD) for a feature using the TVP-SDD-Dev CLI.

## What This Skill Does

When invoked, this skill will:
1. Run the command: `sdd-gen /technical <featureName>`
2. Generate a TDD document template in `docs/features/{featureName}/technical.md`
3. The document will also be copied to AI tool folders (.windsurf, .opencode, .claude, .antigravity) if they exist

## When to Use

Use this skill when you need to:
- Define system architecture and technical specifications
- Design database schema and relationships
- Specify API routes and endpoints
- Document frontend architecture and component structure
- Define security requirements and implementations
- Plan performance optimization strategies
- Design scalable system architecture
- Establish monitoring and logging strategies
- Plan deployment and testing approaches

## How to Use

Provide the feature name as input:
```
Feature name: user-authentication
```

The skill will then execute the CLI command and generate the Technical Design document.

## What Gets Generated

The Technical Design document template includes:
- System Architecture
- Database Design
- API Design
- Frontend Design
- Security Design
- Performance Considerations
- Scalability Design
- Monitoring & Logging
- Deployment Strategy
- Testing Strategy

## After Generation

After the Technical Design is generated, you should:
1. Fill in the template with actual technical specifications
2. Define database schema with proper relationships
3. Document API endpoints with request/response formats
4. Specify frontend component architecture
5. Define security measures and authentication flows
6. Plan performance optimization strategies
7. Document deployment procedures

## Notes

- The document is generated to `docs/features/{featureName}/technical.md`
- The document is also copied to AI tool folders if they exist
- The template provides structure - you need to fill in the actual content
- This should be created after PRD to ensure business requirements are met
