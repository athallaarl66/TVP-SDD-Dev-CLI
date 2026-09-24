---
name: sdd-review-code
description: Review an implemented user story scenario (or all scenarios) against its breakdown files (prod, tech, design, testing) before QA. Emits a ready-for-qa gate when no blocking findings remain. Optionally skip unchanged roles with skip=<comma-separated roles>.
license: MIT
compatibility: Requires TVP-SDD-Dev CLI.
metadata:
  author: Talapvnk
  version: "1.0"
  generatedBy: "1.0"
---

Review one or all implemented user story scenarios against the breakdown files using the TVP-SDD-Dev CLI workflow. This is the gate between implementation (`sdd-implement-code`) and QA (`sdd-qa-test-script` / `sdd-qa-test-run`).

## What This Skill Does

When invoked, this skill will:
1. Take a feature name and a scenario number (`all` for every scenario)
2. Locate the scenario's breakdown files: `docs/production/<feature>/<feature>-<no>-<slug>-{prod,tech,design,testing}.md`
3. Review the implemented code in `src/` (or the project's main source tree) against each file
4. Report per-file status: clear / issues found / blocking
5. Emit `ready-for-qa` only when no blocking findings remain

## When to Use

Use this skill when you need to:
- Verify an implemented scenario still satisfies its PRD acceptance criteria
- Check API/database/security specs in `-tech.md` match the code
- Confirm the UI matches `-design.md` guidance
- Confirm test cases in `-testing.md` are covered (and passing)
- Gate a feature before moving to `/qa-test-script` and `/qa-test-run`

## How to Use

```
Feature name: user-authentication
Scenario number: 01        # or "all" for every scenario
skip: tech,design           # optional: omit unchanged role docs, no spaces
```

## File Lookup

For feature `user-authentication` and scenario `01`, the review reads:

```
docs/production/user-authentication/
├── user-authentication-01-<story-slug>-prod.md      → user story + acceptance criteria
├── user-authentication-01-<story-slug>-tech.md      → API, DB, permissions, security
├── user-authentication-01-<story-slug>-design.md    → wireframe, UI components
└── user-authentication-01-<story-slug>-testing.md   → test cases (Given/When/Then)
```

Optionally reads `docs/features/user-authentication-technical.md` for global architecture context when present.

## Review Checklist

For each included role doc, walk the file section by section and verify the code:

1. **prod**: every acceptance criterion is implemented and demonstrable. Mark each `- [ ]` as `- [x]` in `-prod.md` only when verified.
2. **tech**: API routes, request/response shapes, database schema, permissions, and security constraints match. Flag any deviation as blocking unless an explicit reason is documented.
3. **design**: screens, components, and states match `-design.md` guidance. Cosmetic mismatches are non-blocking.
4. **testing**: every test case in `-testing.md` has a runnable equivalent in the generated test script; run it and record pass/fail. Failing cases are blocking.

## Output Format

```
Scenario 01 — user-authentication
  [prod]    clear | issues | BLOCKING
  [tech]    ...
  [design]  ...
  [testing] ...
Verdict: ready-for-qa | not-ready
Blocking findings: N
```

## Error Handling

- No breakdown files match → report the expected path and tell the user to run `sdd-gen /breakdown-task <prd-file> <feature>` first
- Scenario number not found but others exist → list available scenario numbers
- `skip` lists a role that does not exist → warn and ignore that entry
- `docs/features/<feature>-technical.md` missing → proceed without global context (optional)

## Notes

- One review invocation covers one scenario, or all with `all`
- Emit `ready-for-qa` only when zero blocking findings remain
- This is the fourth step in the workflow: PRD → breakdown → implement → **review** → test