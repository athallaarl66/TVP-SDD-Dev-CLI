# Test Report

Results of the automated test suite for `sdd-dev-cli`.

| Field | Value |
| --- | --- |
| CLI version | 1.5.0 |
| Command | `npm test` (`node --test`) |
| Date | 2026-10-21 |
| Operating system | Windows 11 (`win32 10.0.26200`) |
| Node.js | v26.7.0 |
| npm | 11.19.0 |
| Result | 59 tests, 59 passed, 0 failed, 0 skipped |

## Recorded output

```text
ℹ tests 59
ℹ suites 0
ℹ pass 59
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

## Coverage by file

| File | Area |
| --- | --- |
| `tests/cli/breakdown.test.js` | `/breakdown-task` file naming and feature derivation |
| `tests/cli/config.test.js` | `sdd.config.json` read/write, whitelist, non-fatal failures |
| `tests/cli/implement-code.test.js` | brief generation, alias dispatch, missing scenario |
| `tests/cli/non-interactive.test.js` | `--yes` flows and framework auto-pick |
| `tests/cli/package.test.js` | tarball contents and a real command run from the package |
| `tests/cli/prompt.test.js` | missing-value handling and non-TTY behaviour |
| `tests/cli/qa-test-run.test.js` | runner exit propagation, shell-string rejection, metacharacter non-execution |
| `tests/cli/release.test.js` | version bump, README history, changelog idempotency |
| `tests/cli/release-preconditions.test.js` | release gates: evidence, security policy, metadata, test gate |
| `tests/cli/safety.test.js` | feature-name validation, path containment, overwrite guard, missing template |
| `tests/cli/test-generation.test.js` | generated-source encoding, skip markers, cross-feature isolation |
| `tests/cli/uat-status.test.js` | UAT report status checks: side effects and process errors | 
| `tests/cli/version.test.js` | `--version` matches `package.json` |
| `tests/cli/docs.test.js` | release documents exist, mermaid blocks are well formed, PRD command list and technical-design file references match the source |

## Not covered by this report

- Behaviour on macOS and Linux was not executed locally; CI runs `npm test` on Node.js 20, 22, and 24 on `ubuntu-latest`.
- No test executes a real Playwright, PHPUnit, xUnit, NUnit, JUnit, pytest, or Go suite. Generated files are checked for syntax and skip markers only.
- `/qa-test-run` is not exercised against a real project test runner.

Re-run and compare; this file is not rewritten by the test command:

```bash
npm test
```
