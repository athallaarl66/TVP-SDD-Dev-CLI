---
name: "SDD: Technical"
description: "Generate Technical Design Document (TDD) from template. Creates comprehensive technical specs including system architecture, database design, API design, frontend design, security design, performance considerations, scalability design, monitoring & logging, deployment strategy, and testing strategy."
category: Workflow
tags: [workflow, documentation, technical, architecture, design]
---

Generate Technical Design Document (TDD) for a feature using the TVP-SDD-Dev CLI.

## What This Workflow Does

When invoked, this workflow will:
1. Run the command: `sdd-gen /technical <featureName>`
2. Generate a TDD document template in `docs/features/{featureName}/technical.md`
3. The document will also be copied to AI tool folders (.devin, .opencode, .claude, .antigravity) if they exist

## Input

Provide the feature name as input:
```
Feature name: user-authentication
```

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

## Next Steps

After completing the Technical Design document:
1. Generate Spec Test: `sdd-gen /spec-test <featureName>`
2. Create DESIGN.md for visual specifications
3. Generate implementation prompt: `sdd-gen /implement-code <featureName>`
