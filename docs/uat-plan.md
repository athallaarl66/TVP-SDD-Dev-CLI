# UAT Plan

Manual acceptance checks for a published `sdd-dev-cli` build. Run this plan
against a packed tarball so the shipped files are the ones under test.

Automated equivalent: `npm run uat` (see `scripts/uat.js`) performs steps
1.3 through 3.4 against a packed tarball and prints a pass/fail table. Use the
manual steps below when you need to inspect output by hand or on an OS the
runner has not covered yet.

- CLI under test: version from `sdd-gen --version` (must equal `package.json`)
- Environment to record: operating system, Node.js version, date
- Result to record per step: exit code, generated paths, and any warning text

## 1. Preparation

| Step | Command | Expected |
| --- | --- | --- |
| 1.1 | `npm pack --pack-destination <dir>` | tarball created; no test or `docs/` files inside |
| 1.2 | `tar -xzf <tarball> -C <dir>` then `npm install --prefix <dir>/package` | dependencies install from the published metadata |
| 1.3 | `sdd-gen --version` | prints the packaged version and exits `0` |
| 1.4 | `sdd-gen --help` | lists every command in section 2 and exits `0` |

## 2. Command checks

Run every command in an empty sample project (a directory with a
`package.json`) unless the step says otherwise.

| # | Command | Prerequisite | Expected |
| --- | --- | --- | --- |
| 2.1 | `sdd-gen --yes /prd user-auth` | empty project | `docs/features/user-auth-prd.md` created, exit `0` |
| 2.2 | `sdd-gen --yes /technical user-auth` | — | `docs/features/user-auth-technical.md` created |
| 2.3 | `sdd-gen --yes /feature-design user-auth` | — | `docs/features/user-auth-design.md` created |
| 2.4 | `sdd-gen --yes /design-system` | — | `docs/DESIGN.md` created |
| 2.5 | `sdd-gen --yes /qa-report user-auth` | — | `docs/test-reports/user-auth/user-auth-qa-report.md` created |
| 2.6 | `sdd-gen --yes /init billing` | — | PRD, technical, spec test, and QA report for `billing` created |
| 2.7 | repeat 2.1 without `--force` | 2.1 already ran | exit `1`, message names the existing file, file unchanged |
| 2.8 | repeat 2.1 with `--force` | 2.7 already ran | exit `0`, file replaced |
| 2.9 | `sdd-gen /breakdown-task <prd> onboarding` | PRD containing a `#### User Story 1:` block | four `docs/production/onboarding/…-{prod,tech,design,testing}.md` files |
| 2.10 | `sdd-gen /implement-code 01 onboarding` | 2.9 already ran | `…-01-<slug>-implement.md` with a filled `## User Story` section |
| 2.11 | `sdd-gen --yes /qa-test-script onboarding` | 2.9 already ran | a test file under `tests/` containing a skipped placeholder and a warning |
| 2.12 | `sdd-gen --yes /install-all-skills` | — | `.devin/`, `.opencode/`, `.claude/`, `.antigravity/`, `.hermes/` populated; a second run keeps existing files |
| 2.13 | `sdd-gen /qa-test-run onboarding` | project has a working test runner | test command runs and its exit code is propagated |

## 3. Negative checks

| # | Input | Expected |
| --- | --- | --- |
| 3.1 | `sdd-gen --yes /prd ../escape` | exit `1`, "Invalid feature name", nothing written outside `docs/` |
| 3.2 | `sdd-gen --yes /prd "a; touch pwned"` | exit `1`, no command executed |
| 3.3 | `sdd.config.json` with `{"testFramework":"nope"}` then `/qa-test-script` | exit `1`, no directories or config changes |
| 3.4 | `/init` from an install missing `qa-report-template.md` | exit `1`, "No documentation was generated" |

## 4. Sign-off

A release is acceptable only when every row in sections 2 and 3 has a recorded
result and section 1 confirms the tarball contents. Record the run in
`docs/test-report/uat-report.md`.
