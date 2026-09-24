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

---

**version** · `1.5.0`  
**license** · `MIT`  
**status** · `maintained`  
**last updated** · `2026-09-24`

---

## what is this

CLI tool to make development documentation faster and easier.
Generates PRD, Technical Design, and QA Report automatically.
Breaks down PRD into scenario-level documentation for granular implementation.
Integrated with Playwright for E2E testing.
Works with AI tool folders: `.devin` `.opencode` `.claude` `.antigravity`
Includes Design System and Feature Design documentation.

---

## install

```bash
git clone <repository-url>
cd TVP-SDD-Dev-CLI
npm install
npm link

# verify
sdd-gen --help
```

> requires Node.js >= 14.0.0

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

- `/install-all-skills` → Installs skills/workflows to AI tool folders (`.devin`, `.opencode`, `.claude`, `.antigravity`) for AI tools
- Documentation commands → Generate documentation to `docs/` folder for human reference

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

# 5. breakdown PRD into scenario-level docs
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

---

## commands

| command                                       | description                                                                | output                                                         |
| --------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `/install-all-skills`                         | install skills & workflows to AI tool folders (for AI tools)               | `.devin/skills/` `.devin/workflows/` etc.                      |
| `/design-system`                              | generate global Design System documentation                                | `docs/DESIGN.md`                                               |
| `/feature-design <feature>`                   | generate feature-level design documentation                                | `docs/features/{feature}-design.md`                            |
| `/init <feature>`                             | generate all docs at once to docs/ folder                                  | PRD + Technical + Spec Test + QA Report                        |
| `/prd <feature>`                              | generate Product Requirements Document to docs/                            | `docs/features/{feature}-prd.md`                               |
| `/breakdown-task <prd-file> [feature]`        | parse PRD, generate scenario-level docs to docs/                           | `docs/production/{feature}/` (numbered per PRD order)          |
| `/implement-code <scenario-number> [feature]` | generate implementation brief for a numbered scenario from breakdown files | `docs/production/{feature}/{feature}-{no}-{slug}-implement.md` |
| `/technical <feature>`                        | generate Technical Design document to docs/                                | `docs/features/{feature}-technical.md`                         |
| `/qa-test-script <feature>`                   | generate test script (Playwright or Unit) to tests/                        | `tests/{feature}.spec.ts` or `tests/{feature}.test.ts`         |
| `/qa-test-run <feature>`                      | detect framework from generated test file and run it                       | run output                                                     |
| `/qa-report <feature>`                        | generate QA Report document to docs/                                       | `docs/test-reports/{feature}/{feature}-qa-report.md`           |

**Global flags:**

- `--yes` / `-y` — non-interactive mode: skip prompts, use defaults (safe for CI/scripts)
- `--version` / `-v` — print the CLI version from `package.json`
- `/implement-code` and `/sdd-implement-code` are aliases (like `/breakdown-task` / `/sdd-breakdown-task`)

---

## supported test frameworks

| Framework            | Extension   | Convention                               | Run Command                           |
| -------------------- | ----------- | ---------------------------------------- | ------------------------------------- |
| Playwright (E2E)     | `.spec.ts`  | `tests/<feature>.spec.ts`                | `npm run qa-run:<feature>`            |
| Jest (JS/TS/JSX/TSX) | `.test.ts`  | `tests/<feature>.test.ts`                | `npx jest <feature>`                  |
| PHPUnit (Laravel)    | `Test.php`  | `tests/Feature/<Feature>Test.php`        | `php artisan test --filter=<feature>` |
| xUnit (.NET)         | `Tests.cs`  | `tests/<Feature>Tests.cs`                | `dotnet test --filter <feature>`      |
| NUnit (.NET)         | `Tests.cs`  | `tests/<Feature>Tests.cs`                | `dotnet test --filter <feature>`      |
| JUnit 5 (Java)       | `Test.java` | `tests/src/test/java/<Feature>Test.java` | `mvn test -Dtest=<feature>Test`       |
| pytest (Python)      | `_test.py`  | `tests/test_<feature>.py`                | `pytest tests/test_<feature>.py`      |
| Go testing           | `_test.go`  | `tests/<feature>_test.go`                | `go test -v ./tests/...`              |

> `/qa-test-script` auto-detects your project type and prompts for framework selection.
> `/qa-test-run` auto-detects the framework from the generated test file and runs the correct command.

---

## skills & workflows

### cluster 1 — the specs maker

- `sdd-prd` — Product Requirements Document
- `sdd-technical` — Technical Design Document

### cluster 2 — the breakdown preparator & implementer

- `sdd-breakdown-task` — Parse PRD, generate scenario-level docs
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

> all skills & workflows available for Devin Cascade, Claude, OpenCode, and Antigravity.

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
| 1.5.0   | 2026-09-24 | Hardened CLI tooling: `--yes`, `/implement-code`, config, tests, release                                                                        |
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

## troubleshooting

**`sdd-gen` not found**

```bash
npm link
```

**no AI tool folders found**  
CLI will prompt you to create a folder. pick one: `.devin` `.opencode` `.claude` `.antigravity`

**DESIGN.md not found**  
DESIGN.md is optional. If not found, implementation will proceed using breakdown files only.

**breakdown files not found**  
Run `sdd-gen /breakdown-task <prd-file> <feature>` first to generate scenario-level documentation.

**permission denied**

```bash
sudo npm link
```

---

## references

- [Playwright Docs](https://playwright.dev/)
- [Commander.js](https://www.npmjs.com/package/commander)
- [Inquirer.js](https://www.npmjs.com/package/inquirer)

---

```
 © Talapvnk — unlicensed.
```
