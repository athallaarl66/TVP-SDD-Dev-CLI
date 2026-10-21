# Changelog

## [Unreleased]

### Security
- **Shell-free command execution**: `/qa-test-run` and interactive next-step prompts pass an executable plus an argument array (`shell: false`) instead of building a command string. On Windows, `npx`/`npm` are resolved to their `-cli.js` entry points and run through `node`; only `mvn` still needs `cmd.exe`, with every argument quoted.
- **Feature names and output paths validated**: names containing `/`, `\`, `..`, or shell metacharacters are rejected before any file is written; every generated path is checked to stay inside `docs/` or `tests/`.
- **Overwrite guard**: generation commands refuse to replace an existing file without `--force`.

### Changed
- **Generated tests are honest**: specification text is emitted as line comments (with PHP's `?>` neutralised), and the placeholder body is explicitly skipped (`test.skip`, `markTestSkipped`, `@Disabled`, `t.Skip`, `pytest.skip`) with an `AUTO-GENERATED PLACEHOLDER` warning, so an unwritten test cannot report a pass.
- **`/implement-code` matching**: scenario files are selected by feature slug and scenario number together, so two features that reuse the same scenario number no longer mix into one brief.
- **`/qa-test-run` help text**: describes running the detected framework's generated file rather than implying every framework runs.

### Documentation
- README: Node.js 20+ prerequisite, per-step outputs, `/init` versus `/breakdown-task`, overwrite behavior, failure-state recovery table, framework matrix separating parse-verified output from template-only output, and installation guidance without elevated permissions.
- Added `CONTRIBUTING.md`; linked it and the evidence documents from the README.
- **Evidence reports moved to `docs/test-report/`** (`test-report.md`, `uat-report.md`). README, `docs/prd.md`, `docs/uat-plan.md`, `docs/release-checklist.md`, and the release gate point at the new paths. Both reports are maintained by hand: `npm test` and `npm run uat` print results but never rewrite them.
- SECURITY.md states the real execution model (`shell: false`, with the Windows `mvn` `cmd.exe` exception), the actual supported-version situation (no tagged or published release yet), and the available reporting fallback (`package.json` carries no private email).

## [1.5.0] - 2026-09-24

### Added
- **`/implement-code` CLI command**: Promotes the implement-code flow from AI skill to shell command. `sdd-gen /implement-code <scenario-number> [feature]` (alias `/sdd-implement-code`) generates an implementation brief for a numbered user-story scenario from its breakdown files (`-prod`, `-tech`, `-design`, `-testing`).
- **`--yes` non-interactive mode**: `sdd-gen --yes <command>` runs headless with defaults (feature derived from PRD file or config, detected test framework), safe for CI/scripts; no prompts, no hangs.
- **`sdd-review-code` skill/workflow**: Reviews an implemented scenario against breakdown docs, emits `ready-for-qa` gate, supports `skip=<comma roles>`.
- **Project config persistence**: `sdd.config.json` (project type, test framework, last feature) used as defaults before prompting; explicit args win over config.
- **Automated tests**: Real `npm test` suite (breaking change — old stub removed) covering prompt fallback, breakdown, exit-code propagation, config, implement-code, version, release helpers.

### Changed
- **`--version` / `-v`** now reads from `package.json` via single source (`lib/utils/version.js`).
- **Release automation**: `npm run release:patch|minor|major` bumps version in `package.json`, README (`**version**`, `**last updated**`, `## version history` row), and CHANGELOG together.

## [1.4.0] - 2026-09-24

### Added
- **Interactive CLI**: Commands (`/prd`, `/technical`, `/feature-design`, `/breakdown-task`, `/qa-*`) now prompt for missing feature name and offer next-step radio guidance when run in a terminal; safe in non-TTY (usage error instead of hanging)
- **`sdd-implement-code` skill/workflow**: Implement a single numbered user-story scenario from the breakdown files (`-prod`, `-tech`, `-design`, `-testing`), with optional global context from `-technical.md`

### Changed
- **Renamed `/sdd-breakdown-task` → `/breakdown-task`** (`/sdd-breakdown-task` kept as alias for backward compatibility)
- **Synced `sdd-*` skills, workflows, and templates into `.opencode/`** for all installed AI tool folders

### Fixed
- **`/qa-test-run`**: Test failure now propagates a non-zero exit code instead of swallowing it
- **`/install-all-skills`**: Banner version read from `package.json` instead of hardcoded
- **Docs**: `/init` output now correctly documented as PRD + Technical + Spec Test + QA Report; removed dead `/spec-test` reference from generated `docs/README.md`

## [1.3.6] - 2026-09-11

### Added
- **Go testing support**: Full support for Go testing framework including detection, template generation, and execution
- **Multi-framework test runner**: `sdd-gen /qa-test-run` now auto-detects and runs all supported frameworks (Playwright, Jest, PHPUnit, xUnit, NUnit, JUnit, pytest, Go testing)
- **Auto-fill templates**: PRD, Technical Design, and all init templates now pre-filled with feature name, project name, and current date
- **Sequential breakdown numbering**: PRD breakdown files now numbered by user story order (`<feature>-<no>-<slug>-prod.md`)

### Fixed
- **Breakdown task**: Feature name extraction now supports both flat (`<feature>-prd.md`) and folder (`<feature>/prd.md`) layouts
- **QA test run**: Previously only ran Playwright tests, now supports all frameworks
- **Template consistency**: All generated templates now follow consistent naming conventions

### Updated
- **Supported frameworks table**: Added Go testing to all documentation (README.md, skill templates, workflow templates)
- **Command documentation**: Updated help text and examples throughout
- **File structure examples**: Updated to reflect new sequential numbering pattern

### Skills & Workflows
- Updated `sdd-qa-test-script`: Added Go testing to supported frameworks list
- Updated `sdd-qa-test-run`: Now auto-detects framework from generated test file
- Updated `sdd-prd`: Templates now pre-filled with feature/project name and date
- Updated `sdd-breakdown-task`: Added numbering support and layout detection

## [1.3.5] - 2025-XX-XX
- Previous stable version
