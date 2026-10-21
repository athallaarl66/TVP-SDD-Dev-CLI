# UAT Report

Executed UAT for `sdd-dev-cli` against a packed tarball (not the working tree).

| Field | Value |
| --- | --- |
| CLI version | 1.5.0 |
| Runner | `npm run uat` (`scripts/uat.js`) |
| Date | 2026-10-21 |
| Operating system | Windows 11 (`win32 10.0.26200`) |
| Node.js | v26.7.0 |
| npm | 11.19.0 |
| Result | 18 passed, 0 failed, 1 skipped (19 checks). The skipped check is `2.13 /qa-test-run` — not a pass. |

The runner packs the CLI, extracts the tarball into a scratch directory, links
the repository's installed dependencies, and executes every public command in
an empty sample project. It prints its results and never edits this file; the
rows below are recorded by hand after a run. Re-run it with:

```bash
npm run uat
npm run uat -- --json docs/test-report/uat-results.json
```

## Preparation

| ID | Check | Result | Evidence |
| --- | --- | --- | --- |
| 1.3 | `sdd-gen --version` | PASS | prints `1.5.0` |
| 1.4 | `sdd-gen --help` | PASS | command list rendered |

## Command checks

| ID | Command | Result | Evidence |
| --- | --- | --- | --- |
| 2.1 | `sdd-gen --yes /prd user-auth` | PASS | `docs/features/user-auth-prd.md` |
| 2.2 | `sdd-gen --yes /technical user-auth` | PASS | `docs/features/user-auth-technical.md` |
| 2.3 | `sdd-gen --yes /feature-design user-auth` | PASS | `docs/features/user-auth-design.md` |
| 2.4 | `sdd-gen --yes /design-system` | PASS | `docs/DESIGN.md` |
| 2.5 | `sdd-gen --yes /qa-report user-auth` | PASS | `docs/test-reports/user-auth/user-auth-qa-report.md` |
| 2.6 | `sdd-gen --yes /init billing` | PASS | `docs/features/billing-prd.md` and the other three documents |
| 2.7 | repeat 2.1 without `--force` | PASS | exit `1`, existing file preserved |
| 2.8 | repeat 2.1 with `--force` | PASS | exit `0`, file replaced |
| 2.9 | `sdd-gen /breakdown-task <prd> onboarding` | PASS | four scenario files (`prod`, `tech`, `design`, `testing`) |
| 2.10 | `sdd-gen /implement-code 01 onboarding` | PASS | brief contains the User Story copied from `-prod.md` |
| 2.11 | `sdd-gen --yes /qa-test-script onboarding` | PASS | skipped placeholder test file plus warning text |
| 2.12 | `sdd-gen --yes /install-all-skills` | PASS | `.devin`, `.opencode`, `.claude`, `.antigravity`, `.hermes` populated |
| 2.13 | `sdd-gen /qa-test-run onboarding` | SKIP | needs a working project test runner; Playwright would download browsers. Argument handling is covered by `tests/cli/qa-test-run.test.js`. |

## Negative checks

| ID | Input | Result | Evidence |
| --- | --- | --- | --- |
| 3.1 | `--yes /prd ../escape` | PASS | exit `1`, `Invalid feature name "../escape"`, no file outside `docs/` |
| 3.2 | `--yes /prd "x; touch <marker>"` | PASS | exit `1`, marker file never created |
| 3.3 | `sdd.config.json` with `testFramework: "nope"` | PASS | exit `1`, `unsupported testFramework`, no `tests/` directory |
| 3.4 | `/init` from an install without `qa-report-template.md` | PASS | exit `1`, no documentation written |

## Known limitations of this run

- Only Windows 11 with Node.js 26 was executed. CI covers Node.js 20, 22, and 24 on Linux via `npm test`; the UAT runner itself has not been executed on macOS or Linux in this run.
- `/qa-test-run` was not exercised end to end; the runner argument handling and exit-code propagation are unit tested.
- `/install-all-skills` was verified by directory presence, not by inspecting every copied file.
