```
████████╗██╗   ██╗██████╗       ███████╗██████╗ ██████╗
╚══██╔══╝██║   ██║██╔══██╗      ██╔════╝██╔══██╗██╔══██╗
   ██║   ██║   ██║██████╔╝█████╗███████╗██║  ██║██║  ██║
   ██║   ╚██╗ ██╔╝██╔═══╝ ╚════╝╚════██║██║  ██║██║  ██║
   ██║    ╚████╔╝ ██║            ███████║██████╔╝██████╔╝
   ╚═╝     ╚═══╝  ╚═╝            ╚══════╝╚═════╝ ╚═════╝

                  D E V  ·  C L I
```

> _generate docs. drown in automation. ship faster._

[![CI](https://github.com/athallaarl66/TVP-SDD-Dev-CLI/actions/workflows/ci.yml/badge.svg)](https://github.com/athallaarl66/TVP-SDD-Dev-CLI/actions/workflows/ci.yml) [![npm](https://img.shields.io/npm/v/sdd-dev-cli.svg)](https://www.npmjs.com/package/sdd-dev-cli) [![license](https://img.shields.io/github/license/athallaarl66/TVP-SDD-Dev-CLI.svg)](LICENSE) [![node](https://img.shields.io/node/v/sdd-dev-cli.svg)](package.json)

**Generate a PRD, a technical design, and QA test scaffolds from one CLI — no API key, no AI service, no database.**
Plain Markdown lands in your repo. Works with `.claude` `.cursor` `.devin` `.opencode` `.antigravity` `.hermes`.

---

## what is this

CLI tool to make development documentation faster and easier.
Generates PRD, Technical Design, and QA Report automatically.
Breaks down Epic-grouped PRDs into nested, story-level implementation docs.
Generates test scaffolds for multiple frameworks, not only Playwright.
Integrated with Playwright for E2E testing.
Works with AI tool folders: `.devin` `.opencode` `.claude` `.antigravity` `.hermes`
Includes Design System and Feature Design documentation.

---

## install

Requires **Node.js 20 or newer** (see `engines` in `package.json`).

```bash
npm install -g sdd-dev-cli

# verify
sdd-gen --help
sdd-gen --version   # prints the installed version
```

Templates, skills, and workflows ship inside the package, so the install downloads nothing else. Do **not** use `sudo npm install -g` or `--unsafe-perm`: root-owned files break later updates. If the global install fails with `EACCES`, point npm at a user-owned prefix instead of escalating:

```bash
# Unix
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"

# Windows (cmd)
npm config set prefix "%USERPROFILE%\npm-global"
# then add %USERPROFILE%\npm-global to PATH

npm install -g sdd-dev-cli
```

Installing from a local checkout (for contributing) works too:

```bash
git clone https://github.com/athallaarl66/TVP-SDD-Dev-CLI.git
cd TVP-SDD-Dev-CLI
npm ci
npm link          # puts `sdd-gen` on your PATH
```

On Windows, use Git Bash or PowerShell; both work. Every install step runs entirely inside the current user's profile, and the CLI never asks for administrator rights.

---

## how to run

After installation, you can use the CLI from any project directory:

```bash
# From your project directory
cd /path/to/your-project

# Step 1: Install skills & workflows to AI tool folders (for AI tools)
sdd-gen /install-all-skills

# Step 2: Generate global design system (first time setup)
sdd-gen /design-system

# Step 3: Generate documentation to docs/ folder
sdd-gen /prd <feature-name>
sdd-gen /technical <feature-name>
sdd-gen /feature-design <feature-name>

# Or generate all at once
sdd-gen /init <feature-name>
```

**Important:**

- `/install-all-skills` → Installs skills/workflows to AI tool folders (`.devin`, `.opencode`, `.claude`, `.antigravity`, `.hermes`) for AI tools
- Documentation commands → Generate documentation to `docs/` folder for human reference

**`/init` is not `/breakdown-task`.** `/init <feature>` writes the four feature-level documents in one pass (PRD, technical design, feature test plan, QA report draft) and stops there. It never reads a PRD and never creates scenario files. `/breakdown-task <prd-file> [feature]` is a separate step that parses a finished Epic-grouped PRD and writes `prod.md`, `tech.md`, `design.md`, and `testing.md` per story into `docs/production/<feature>/<epic-slug>/<story-no>-<story-slug>/`. `/implement-code` and `/qa-test-script` also read existing flat breakdowns during transition; no automatic migration occurs. Typical order: `/init` (or the individual generators) → fill in the PRD → `/breakdown-task` → `/implement-code`.

---

## quick start

```bash
# 1. go to your project folder
cd /path/to/project

# 2. generate global design system (first time setup)
sdd-gen /design-system

# 3. generate PRD for a feature (template auto-filled with feature name & date)
sdd-gen /prd user-authentication

# 4. fill in the PRD with user stories

# 5. breakdown Epic-grouped PRD into nested story docs
sdd-gen /breakdown-task docs/features/user-authentication-prd.md user-authentication

# 6. fill in the breakdown files (prod, tech, design, testing)

# 7. generate architectural technical design
sdd-gen /technical user-authentication

# 8. generate feature-level design
sdd-gen /feature-design user-authentication

# 9. generate & run tests (Playwright or Unit Tests)
sdd-gen /qa-test-script user-authentication
# → choose: Playwright (E2E) or Unit Test (Jest, PHPUnit, xUnit, NUnit, JUnit, pytest, Go)
sdd-gen /qa-test-run user-authentication   # runs detected framework's test command
npm run qa-run:user-authentication         # for Node-based frameworks (Playwright, Jest)

# 10. generate QA report
sdd-gen /qa-report user-authentication
```

What each step writes, so you can check progress without reading the source:

| Step | Writes | Next step |
| --- | --- | --- |
| `/design-system` | `docs/DESIGN.md` | optional; only `sdd-implement-code` reads it |
| `/prd <feature>` | `docs/features/<feature>-prd.md` | fill in user stories, then `/breakdown-task` |
| `/breakdown-task` | `docs/production/<feature>/<epic-slug>/<story-no>-<story-slug>/{prod,tech,design,testing}.md` | fill in each story file, then `/implement-code` |
| `/technical`, `/feature-design` | `docs/features/<feature>-technical.md`, `docs/features/<feature>-design.md` | reference only |
| `/qa-test-script` | `tests/<framework-specific file>` (skipped placeholder) | write assertions, then `/qa-test-run` |
| `/qa-test-run` | runner output in your terminal; exit code mirrored | `/qa-report` |
| `/qa-report` | `docs/test-reports/<feature>/<feature>-qa-report.md` | done |
| `/coverage [feature]` | coverage report for acceptance-criteria IDs in nested docs/tests | add IDs to legacy PRDs with `--backfill`; opt into a threshold with `--min <percent>` |

Generated PRD criteria use `AC-<FEATURE>-<STORY>-<N>` IDs. `/coverage` scans nested documentation and tests; comment-only mentions do not count. Run `sdd-gen /coverage [feature] --json` for automation.

If a step refuses with `already exists`, the file was not touched: read it, then rerun with `--force` only if you intend to lose the current content. Every failure state and its recovery is listed in [failure states and recovery](#failure-states-and-recovery).

---

## commands

| command                                       | description                                                                | output                                                         |
| --------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `/install-all-skills`                         | install skills & workflows to AI tool folders (for AI tools)               | `.devin/skills/` `.devin/workflows/` etc.                      |
| `/design-system`                              | generate global Design System documentation                                | `docs/DESIGN.md`                                               |
| `/feature-design <feature>`                   | generate feature-level design documentation                                | `docs/features/{feature}-design.md`                            |
| `/init <feature>`                             | generate PRD, technical design, feature test plan, and QA report draft       | four feature-level documents                                    |
| `/prd <feature>`                              | generate Product Requirements Document to docs/                            | `docs/features/{feature}-prd.md`                               |
| `/breakdown-task <prd-file> [feature]`        | parse Epic-grouped PRD, generate four story docs                           | `docs/production/{feature}/{epic-slug}/{story-no}-{story-slug}/` |
| `/implement-code <scenario-number> [feature]` | generate implementation brief from nested or legacy breakdown files        | nested: story folder `implement.md`; legacy: feature-root brief |
| `/technical <feature>`                        | generate Technical Design document to docs/                                | `docs/features/{feature}-technical.md`                         |
| `/qa-test-script <feature>`                   | generate test script (Playwright or Unit) to tests/                        | `tests/{feature}.spec.ts` or `tests/{feature}.test.ts`         |
| `/qa-test-run <feature>`                      | detect framework from generated test file and run it                       | run output                                                     |
| `/qa-report <feature>`                        | generate framework-neutral, unexecuted QA report draft                    | `docs/test-reports/{feature}/{feature}-qa-report.md`           |
| `/coverage [feature]` | report acceptance-criteria references in nested docs/tests; `--json`, `--min`, `--backfill` | coverage summary; explicit PRD backfill                         |
| `/context check` / `/context build [feature]` | check tracked document freshness or build bounded context; `--budget <characters>`, `--terse` | check report or `docs/context/<feature>.md` |
| `/doctor` | read-only runtime, context, coverage, and MCP setup diagnostics | diagnostic report |
| `mcp` | start MCP JSON-RPC server over stdio | agent-client protocol stream |

`/remember` manages local, per-checkout memory in `.sdd/memory/`. Use `sdd-gen /remember add --kind ADR --content "Decision"`, then `sdd-gen /remember confirm ADR-001`. Use `recall`, `history ADR-001`, or `supersede ADR-001 --content "Replacement"` to inspect or update history. MCP exposes `sdd_remember` and `sdd_recall`. New entries are drafts; only confirmed, current, relevant entries enter context. Shared checkouts share memory; sync, export/import, and per-user isolation are not supported.

### MCP setup

MCP server runs locally from the project directory. Add this configuration to your MCP client and restart the client:

```json
{
  "mcpServers": {
    "sdd-gen": {
      "command": "sdd-gen",
      "args": ["mcp"]
    }
  }
}
```

The server uses stdio and does not require an API key, network service, or MCP SDK. Configure the client to launch it with the project directory as its working directory: paths resolve from there. Run `sdd-gen /doctor` for read-only local setup checks.

```bash
sdd-gen /context check
sdd-gen /context build user-authentication --budget 24000 --terse
sdd-gen /doctor
```

Use an MCP client that supports stdio servers. Place the JSON under that client's project or user configuration; client config paths vary by application.


**Global flags:**

- `--yes` / `-y` — non-interactive mode: skip prompts, use defaults (safe for CI/scripts)
- `--force` / `-f` — replace files a command would otherwise refuse to overwrite
- `--version` / `-v` — print the CLI version from `package.json`
- `/implement-code` and `/sdd-implement-code` are aliases (like `/breakdown-task` / `/sdd-breakdown-task`)

---

## overwrite behavior

Generation commands are non-destructive by default. Same rule everywhere:

| Situation | What happens |
| --- | --- |
| Target file does not exist | written |
| Target file exists, no `--force` | command refuses, prints `already exists: <path>` and writes nothing else |
| Target file exists, `--force` / `-f` | replaced, and the command reports how many files it replaced |
| `/install-all-skills`, skill or workflow already present in an AI tool folder | kept, printed as `kept existing ... (use --force to overwrite)` |

`/breakdown-task` writes a nested file set per user story; existing targets are left alone unless `--force` is set. Generated writes reject output paths that resolve through a symlink or junction outside the permitted root, including with `--force`; links resolving inside the root follow the normal overwrite rule. Nothing is deleted by any command.

---

## supported test frameworks

`/qa-test-script` generates a **skeleton**: the spec text is copied into the file as line comments, and the single test body is skipped (`test.skip`, `markTestSkipped`, `@Disabled`, `t.Skip`, `pytest.skip`) until a human writes real assertions. A generated file therefore never reports a green run on its own.

| Framework | Generated file | Setup required in your project | `/qa-test-run` command | Verified by this repo's tests |
| --- | --- | --- | --- | --- |
| Playwright (E2E) | `tests/<feature>.spec.ts` | `@playwright/test` (installed on first run) | `npx playwright test tests/<feature>.spec.ts` (also saved as `npm run qa-run:<feature>`) | source parses as JavaScript; skip marker |
| Jest (JS/TS/JSX/TSX) | `tests/<feature>.test.ts` | `jest` in the project | `npx jest tests/<feature>.test.ts` (also saved as `npm run qa-run:<feature>`) | source parses as JavaScript; skip marker |
| PHPUnit (Laravel) | `tests/Feature/<Feature>Test.php` | Laravel app with `php artisan test` | `php artisan test --filter=<feature>` | source is comment-safe (`?>` neutralised); skip marker |
| xUnit (.NET) | `tests/<Feature>Tests.cs` | `dotnet` SDK + test project | `dotnet test --filter <feature>` | template only — no compiler in CI |
| NUnit (.NET) | `tests/<Feature>Tests.cs` | `dotnet` SDK + test project | `dotnet test --filter <feature>` | template only — no compiler in CI |
| JUnit 5 (Java) | `tests/src/test/java/<Feature>Test.java` | Maven + JUnit 5 dependency | `mvn test -Dtest=<Feature>Test` | template only — no compiler in CI |
| pytest (Python) | `tests/test_<feature_underscored>.py` | `pytest` module available | `python -m pytest tests/test_<feature_underscored>.py` | source parses as Python; skip marker |
| Go testing | `tests/<feature_underscored>_test.go` | Go toolchain, `tests/` package | `go test -v ./tests/...` | template only — no compiler in CI |

Verification status is intentionally split three ways:

- **parses** — the generated file is fed to a real parser in `tests/cli/test-generation.test.js`.
- **skip marker** — the placeholder is asserted to be skipped/disabled rather than passing.
- **template only** — the file is generated and escaped, but CI installs no C#, Java, or Go toolchain, so it is not compiled.

No test in this repository executes a real PHPUnit, Jest, Playwright, xUnit, NUnit, JUnit, pytest, or Go suite; `npm test` verifies generation and the runner's exit-code plumbing only. Do not read "supported" as "proven against a real project suite".

> `/qa-test-script` auto-detects your project type and prompts for framework selection; with `--yes` it reuses `sdd.config.json` or the detected framework.
> `/qa-test-run` picks the first matching generated test file for the feature, runs that runner, and propagates its exit code.
> On Windows, `npx`/`npm` are `.cmd` shims, so the CLI runs npm's own `npx-cli.js`/`npm-cli.js` through `node` instead of spawning a shell. `mvn` is the one remaining shim that needs `cmd.exe`; its arguments are quoted because they come from a validated slug.

---

## skills & workflows

### cluster 1 — the specs maker

- `sdd-prd` — Product Requirements Document
- `sdd-technical` — Technical Design Document

### cluster 2 — the breakdown preparator & implementer

- `sdd-breakdown-task` — Parse Epic-grouped PRD, generate nested story docs
- `sdd-implement-code` — Implement a numbered user story scenario from breakdown files

### cluster 3 — the reviewers

- `sdd-review-code` — Review an implemented scenario against breakdown docs (prod/tech/design/testing), emits `ready-for-qa` gate

### cluster 4 — the QA engine

- `sdd-qa-test-script` — generate test script (Playwright or Unit Tests)
- `sdd-qa-test-run` — run generated test (framework auto-detected)
- `sdd-qa-report` — generate QA Report

### cluster 5 — the designers

- `sdd-design-system` — generate global Design System documentation
- `sdd-feature-design` — generate feature-level design documentation

> all skills & workflows available for Devin Cascade, Claude, OpenCode, Antigravity, and Hermes.

---

## file structure

```
your-project/
├── .devin/
│   ├── _templates/
│   ├── skills/
│   │   └── sdd-*/              # skill definitions
│   └── workflows/
│       └── sdd-*.md            # workflow definitions
├── .opencode/                  # same structure
├── .claude/                    # same structure
├── .antigravity/               # same structure
├── .hermes/                    # same structure
├── docs/
│   ├── DESIGN.md               # global design system
│   ├── features/
│   │   ├── {feature}-prd.md
│   │   ├── {feature}-technical.md
│   │   └── {feature}-design.md
│   ├── production/
│   │   └── [feature]/
│   │       ├── [feature]-[no]-[story-slug]-prod.md
│   │       ├── [feature]-[no]-[story-slug]-tech.md
│   │       ├── [feature]-[no]-[story-slug]-design.md
│   │       ├── [feature]-[no]-[story-slug]-testing.md
│   │       └── [feature]-[no]-[story-slug]-implement.md   # from /implement-code
│   └── test-reports/
│       └── [feature]/
│           ├── [feature]-spec-test.md     # from /init
│           └── [feature]-qa-report.md
├── tests/
│   ├── [feature].spec.ts       # Playwright E2E
│   ├── [feature].test.ts       # Jest (JS/TS)
│   ├── Feature/[feature]Test.php  # PHPUnit (Laravel)
│   ├── [feature]Tests.cs       # xUnit/NUnit (.NET)
│   ├── src/test/java/[feature]Test.java  # JUnit (Java)
│   └── test_[feature].py       # pytest (Python)
│   └── [feature]_test.go       # Go testing
└── package.json
```

---

## cli source structure

```
TVP-SDD-Dev-CLI/
├── index.js
├── package.json
├── templates/
│   ├── prd-template.md
│   ├── prod-template.md
│   ├── testing-template.md
│   ├── design-template.md
│   ├── tech-template.md
│   ├── technical-template.md
│   ├── design-system-template.md
│   ├── feature-design-template.md
│   └── qa-report-template.md
├── skill-templates/
│   └── sdd-*/
├── workflow-templates/
│   └── sdd-*.md
└── README.md
```

---

## version history

| Version | Date       | Changes                                                                                                                                         |
| ------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.5.2   | 2026-11-05 | Manifest freshness, context bundles, local memory, MCP server, diagnostics, and CI context gate |
| 1.5.1   | 2026-11-04 | Epic-nested story docs, acceptance-criteria coverage, safer generation, QA drafts, and startup improvements |
| 1.5.0   | 2026-10-21 | First published release: shell-free test execution, honest placeholders, `--yes`, `/implement-code`, config, tests, release gates |
| 1.4.0   | 2026-09-24 | Interactive CLI and implement-code skill                                                                                                        |
|         |            | - `/prd`, `/technical`, `/feature-design`, `/breakdown-task`, `/qa-*` prompt for missing args and offer next-step radio guidance (non-TTY safe) |
|         |            | - Added `sdd-implement-code` skill/workflow: implement a numbered user-story scenario from breakdown files                                      |
|         |            | - Renamed `/sdd-breakdown-task` → `/breakdown-task` (alias kept)                                                                                |
|         |            | - `/qa-test-run` propagates test failure exit code                                                                                              |
|         |            | - Synced `sdd-*` skills/workflows/templates to `.opencode/`                                                                                     |
|         |            | - Docs fixes: `/init` output, dead `/spec-test` reference                                                                                       |
| 1.3.6   | 2026-09-11 | Go support and qa workflow improvements                                                                                                         |
|         |            | - Added Go testing framework support (detection, template, run)                                                                                 |
|         |            | - `/qa-test-run` auto-detects and runs all supported frameworks                                                                                 |
|         |            | - Templates pre-filled with feature name, project name, date                                                                                    |
|         |            | - PRD breakdown numbered by user story order (`{feature}-{no}-{slug}-{type}.md`)                                                                |
| 1.3.0   | 2026-07-27 | Multi-framework test support and TypeScript migration                                                                                           |
|         |            | - Migrated QA test script output from `.spec.js` to `.spec.ts`                                                                                  |
|         |            | - Added multi-framework unit test support (Jest, PHPUnit, xUnit, NUnit, JUnit, pytest)                                                          |
|         |            | - Auto-detects project type and prompts for framework selection                                                                                 |
|         |            | - Added `/design-system` and `/feature-design` skill templates                                                                                  |
|         |            | - Fixed skill templates to reference `docs/` instead of AI tool workflows                                                                       |
|         |            | - Updated all test references from `.spec.js` to `.spec.ts`                                                                                     |
|         |            | - Cleanup: removed stray files from `.devin/skills/`                                                                                            |
|         |            | - Standardized all paths to `docs/` directory                                                                                                   |
| 1.2.0   | 2026-07-02 | Improve breakdown task with slug-based naming and story extraction                                                                              |
|         |            | - Enhanced parseUserStories() to extract title, As a, I want, So that, acceptance criteria                                                      |
|         |            | - Generate meaningful slugs from user story titles for file naming                                                                              |
|         |            | - Breakdown files now use slug-based naming: {feature}-{story-slug}-{type}.md                                                                   |
|         |            | - Templates inject story-specific content (title, As a, I want, So that, acceptance criteria)                                                   |
|         |            | - Added validation for PRD format before breakdown                                                                                              |
|         |            | - Added story → file mapping summary after breakdown                                                                                            |
|         |            | - Updated /implement-code to use slug instead of num                                                                                            |
|         |            | - Support both PRD formats (with and without title in header)                                                                                   |
| 1.1.1   | 2026-06-25 | Update features folder to flat structure                                                                                                        |
|         |            | - Changed features folder from nested to flat structure                                                                                         |
|         |            | - /prd outputs to docs/features/{feature}-prd.md (flat)                                                                                         |
|         |            | - /technical outputs to docs/features/{feature}-technical.md (flat)                                                                             |
|         |            | - /feature-design outputs to docs/features/{feature}-design.md (flat)                                                                           |
|         |            | - /init outputs all to flat features folder                                                                                                     |
|         |            | - Production and test-reports remain nested (scenario-level)                                                                                    |
| 1.1.0   | 2026-06-25 | Added Design System and Feature Design documentation                                                                                            |
|         |            | - Added `/design-system` command for global design system                                                                                       |
|         |            | - Added `/feature-design` command for feature-level design                                                                                      |
|         |            | - All documentation commands generate to `docs/` folder                                                                                         |
|         |            | - `/install-all-skills` installs to AI tool folders (`.devin`, `.opencode`, `.claude`, `.antigravity`)                                          |
|         |            | - Breakdown files order: `prod`, `tech`, `design`, `testing`                                                                                    |
| 1.0.0   | 2026-06-25 | Initial release                                                                                                                                 |
|         |            | - Windsurf → Devin migration with automatic detection                                                                                           |
|         |            | - Modular command structure (`lib/commands/`)                                                                                                   |
|         |            | - Bug fixes for ora compatibility and path resolution                                                                                           |

---

## failure states and recovery

Every refusal names the file or value at fault and the command to run next.

| State you see | Cause | Recovery |
| --- | --- | --- |
| `already exists: <path>` | generated file present, no `--force` | review the file, then rerun with `--force` (or move the file away) |
| `Feature name ... is invalid` | name is empty, has `/`, `\`, `..`, or a shell metacharacter | use a slug such as `user-authentication`; nothing was written |
| `Error: No test file found for "<feature>" in tests/ directory` | `/qa-test-run` ran before generation | run `sdd-gen /qa-test-script <feature>` first |
| `Error: no breakdown files found` | `/implement-code` ran before `/breakdown-task` | run `sdd-gen /breakdown-task <prd-file> <feature>` first |
| generated test reports `skipped` | placeholder has no assertions yet (by design) | replace the skipped body with real acceptance-criteria checks |
| `Unsupported test framework` | `sdd.config.json` or the prompt carried an unknown framework | delete `testFramework` from `sdd.config.json` and re-run `/qa-test-script` |
| command exits non-zero after the runner ran | the project's own test suite failed | fix the project code/tests; the CLI mirrors the runner's exit code instead of hiding it |
| `Could not run <runner>` | runner executable not on `PATH` | install the runner (`npm i -D jest`, `composer require --dev phpunit/phpunit`, `pip install pytest`, …) |

Missing templates (`templates/…`) abort the command before any file is written; reinstall the CLI (`npm install && npm link`) to restore them.

---

## troubleshooting

**`sdd-gen` not found**

```bash
npm link
```

If `npm link` reports `EACCES`, set a user-owned npm prefix as shown in [install](#install) rather than running it with `sudo`.

**no AI tool folders found**  
CLI will prompt you to create a folder. pick one: `.devin` `.opencode` `.claude` `.antigravity` `.hermes`

**DESIGN.md not found**  
DESIGN.md is optional. If not found, implementation will proceed using breakdown files only.

**breakdown files not found**  
Run `sdd-gen /breakdown-task <prd-file> <feature>` first to generate scenario-level documentation.

**permission denied**  
Do not escalate. Point npm at a writable prefix (`npm config set prefix "$HOME/.npm-global"`) and add its `bin` directory to `PATH`. Steps are in [install](#install).

---

## project docs

Shipped in the repository, not in the npm tarball:

- [docs/prd.md](docs/prd.md) — problem, users, command inventory, safety promises
- [docs/technical-design.md](docs/technical-design.md) — module map, generation pipeline, safety model, diagrams
- [docs/uat-plan.md](docs/uat-plan.md) — manual acceptance checks for a build
- [docs/test-report/uat-report.md](docs/test-report/uat-report.md) — last executed UAT run with versions and results
- [docs/test-report/test-report.md](docs/test-report/test-report.md) — last automated test run with counts
- [docs/release-checklist.md](docs/release-checklist.md) — gate list before tagging a release
- [SECURITY.md](SECURITY.md) — supported versions and private vulnerability reporting
- [CONTRIBUTING.md](CONTRIBUTING.md) — local setup, test commands, and pull request expectations

Re-run the evidence before a release. Both commands print their results; neither
rewrites the Markdown reports, so update the recorded versions and counts by hand:

```bash
npm test                                                  # → docs/test-report/test-report.md
npm run uat                                               # → docs/test-report/uat-report.md
npm run uat -- --json docs/test-report/uat-results.json   # machine-readable summary
```

---

## references

- [Playwright Docs](https://playwright.dev/)
- [Commander.js](https://www.npmjs.com/package/commander)
- [Inquirer.js](https://www.npmjs.com/package/inquirer)

---

```
 © Talapvnk — MIT.
```
