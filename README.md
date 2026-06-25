```
████████╗██╗   ██╗██████╗       ███████╗██████╗ ██████╗
╚══██╔══╝██║   ██║██╔══██╗      ██╔════╝██╔══██╗██╔══██╗
   ██║   ██║   ██║██████╔╝█████╗███████╗██║  ██║██║  ██║
   ██║   ╚██╗ ██╔╝██╔═══╝ ╚════╝╚════██║██║  ██║██║  ██║
   ██║    ╚████╔╝ ██║            ███████║██████╔╝██████╔╝
   ╚═╝     ╚═══╝  ╚═╝            ╚══════╝╚═════╝ ╚═════╝

                  D E V  ·  C L I
```

> *generate docs. drown in automation. ship faster.*

---

**authored by** · `Talapvnk`  
**version** · `1.1.1`  
**license** · `unlicensed — all rights reserved`  
**status** · `maintained`

---

## what is this

CLI tool to make development documentation faster and easier.
Generates PRD, Technical Design, Spec Test, and QA Report automatically.
Breaks down PRD into scenario-level documentation for granular implementation.
Integrated with Playwright for E2E testing.
Works with AI tool folders: `.devin` `.opencode` `.claude` `.antigravity`
Includes Design System and Feature Design documentation.

---

## install

```bash
git clone <repository-url>
cd TVP-sdd-cli
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
sdd-gen /spec-test <feature-name>

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

# 3. generate PRD for a feature
sdd-gen /prd user-authentication

# 4. fill in the PRD with user stories

# 5. breakdown PRD into scenario-level docs
sdd-gen /breakdown-task docs/features/user-authentication-prd.md user-authentication

# 6. fill in the breakdown files (prod, tech, design, testing)

# 7. generate feature-level design
sdd-gen /feature-design user-authentication

# 8. generate skill.md and trigger implementation
sdd-gen /implement-code user-authentication 01

# 9. generate & run playwright tests
sdd-gen /qa-test-script user-authentication
sdd-gen /qa-test-run user-authentication
npm run qa-run:user-authentication

# 10. generate QA report
sdd-gen /qa-report user-authentication
```

---

## commands

| command | description | output |
|---|---|---|
| `/install-all-skills` | install skills & workflows to AI tool folders (for AI tools) | `.devin/skills/` `.devin/workflows/` etc. |
| `/design-system` | generate global Design System documentation | `docs/DESIGN.md` |
| `/feature-design <feature>` | generate feature-level design documentation | `docs/features/{feature}-design.md` |
| `/init <feature>` | generate all docs at once to docs/ folder | PRD + TECH + SPEC_TEST + REPORT |
| `/prd <feature>` | generate Product Requirements Document to docs/ | `docs/features/{feature}-prd.md` |
| `/breakdown-task <prd-file> [feature]` | parse PRD, generate scenario-level docs to docs/ | `docs/production/{feature}/` |
| `/technical <feature>` | generate Technical Design document to docs/ | `docs/features/{feature}-technical.md` |
| `/spec-test <feature>` | generate Playwright E2E test spec to docs/ | `docs/test-reports/{feature}/{feature}-spec-test.md` |
| `/implement-code <feature> <num>` | generate skill.md to docs/ | `docs/production/{feature}/{feature}<num>-skill.md` |
| `/qa-test-script <feature>` | generate Playwright test script to tests/ | `tests/{feature}.spec.js` |
| `/qa-test-run <feature>` | run Playwright test, update package.json | `qa-run:{feature}` script |
| `/qa-report <feature>` | generate QA Report document to docs/ | `docs/test-reports/{feature}/{feature}-qa-report.md` |

---

## skills & workflows

### cluster 1 — the specs maker
- `sdd-prd` — Product Requirements Document
- `sdd-technical` — Technical Design Document
- `sdd-spec-test` — Playwright E2E Test Spec

### cluster 2 — the breakdown preparator
- `sdd-breakdown-task` — Parse PRD, generate scenario-level docs

### cluster 3 — the code preparator
- `sdd-implement-code` — Generate skill.md with role prompts, trigger implementation

### cluster 4 — the QA engine
- `sdd-qa-test-script` — generate Playwright test script
- `sdd-qa-test-run` — run Playwright test (auto-install)
- `sdd-qa-report` — generate QA Report

> all skills & workflows available for Devin Cascade, Claude, OpenCode, and Antigravity.

---

## DESIGN.md lookup order (optional)

`/implement-code` optionally searches for DESIGN.md in this order for visual tokens:

```
docs/DESIGN.md
docs/[feature]-DESIGN.md
.devin/skills/[feature]-DESIGN.md
.opencode/skills/[feature]-DESIGN.md
.claude/skills/[feature]-DESIGN.md
.antigravity/skills/[feature]-DESIGN.md
```

> DESIGN.md is optional. Features can be implemented using breakdown files (prod, tech) without visual design documents.

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
│   │       ├── [feature]01-prod.md
│   │       ├── [feature]01-tech.md
│   │       ├── [feature]01-design.md
│   │       ├── [feature]01-testing.md
│   │       └── [feature]01-skill.md
│   └── test-reports/
│       └── [feature]/
│           ├── [feature]-spec-test.md
│           └── [feature]-qa-report.md
├── tests/
│   └── [feature].spec.js
└── package.json
```

---

## cli source structure

```
TVP-sdd-cli/
├── index.js
├── package.json
├── templates/
│   ├── prd-template.md
│   ├── prod-template.md
│   ├── testing-template.md
│   ├── design-template.md
│   ├── tech-template.md
│   ├── technical-template.md
│   ├── spec-test-template.md
│   └── qa-report-template.md
├── skill-templates/
│   └── sdd-*/
├── workflow-templates/
│   └── sdd-*.md
└── README.md
```

---

## version history

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2026-06-25 | Added Design System and Feature Design documentation |
| | | - Added `/design-system` command for global design system |
| | | - Added `/feature-design` command for feature-level design |
| | | - All documentation commands generate to `docs/` folder |
| | | - `/install-all-skills` installs to AI tool folders (`.devin`, `.opencode`, `.claude`, `.antigravity`) |
| | | - Updated naming convention: flat features folder `{feature}-prd.md`, `{feature}-technical.md`, `{feature}-design.md` |
| | | - Breakdown files order: `prod`, `tech`, `design`, `testing` |
| 1.0.0 | 2026-06-25 | Initial release |
| | | - Windsurf → Devin migration with automatic detection |
| | | - Modular command structure (`lib/commands/`) |
| | | - Bug fixes for ora compatibility and path resolution |

---

## troubleshooting

**`sdd-gen` not found**
```bash
npm link
```

**no AI tool folders found**  
CLI will prompt you to create a folder. pick one: `.devin` `.opencode` `.claude` `.antigravity`

**DESIGN.md not found**  
DESIGN.md is optional. If not found, implementation will proceed using breakdown files only. Check the lookup order above if you want to include visual tokens.

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
// © Talapvnk — unlicensed. don't copy without asking.
```