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
**version** · `1.0.0`  
**license** · `unlicensed — all rights reserved`  
**status** · `maintained`

---

## what is this

CLI tool to make development documentation faster and easier.
Generates BRD, Technical Design, Spec Test, and QA Report automatically.
Integrated with Playwright for E2E testing.
Works with AI tool folders: `.windsurf` `.opencode` `.claude` `.antigravity`

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

## quick start

```bash
# 1. go to your project folder
cd /path/to/project

# 2. install all skills & workflows
sdd-gen /install-all-skills

# 3. init docs for a feature
sdd-gen /init user-authentication

# 4. fill in the generated docs, create DESIGN.md

# 5. generate AI implementation prompt
sdd-gen /implement-code user-authentication

# 6. generate & run playwright tests
sdd-gen /qa-test-script user-authentication
sdd-gen /qa-test-run user-authentication
npm run qa-run:user-authentication

# 7. generate QA report
sdd-gen /qa-report user-authentication
```

---

## commands

| command | description | output |
|---|---|---|
| `/install-all-skills` | install all templates, skills, workflows | `skills/` `workflows/` |
| `/init <feature>` | generate all docs at once | BRD + TECHNICAL + SPEC_TEST + REPORT |
| `/brd <feature>` | generate Business Requirements Document | `[feature]-BRD.md` |
| `/technical <feature>` | generate Technical Design Document | `[feature]-TECHNICAL_DESIGN.md` |
| `/spec-test <feature>` | generate Playwright E2E test spec | `[feature]-SPEC_TEST.md` |
| `/implement-code <feature>` | load DESIGN.md, generate AI prompt | stdout |
| `/qa-test-script <feature>` | generate Playwright test script | `tests/[feature].spec.js` |
| `/qa-test-run <feature>` | run Playwright test, update package.json | `qa-run:[feature]` script |
| `/qa-report <feature>` | generate QA Report document | `[feature]-REPORT.md` |

---

## skills & workflows

### cluster 1 — the specs maker
- `sdd-brd` — Business Requirements Document
- `sdd-technical` — Technical Design Document
- `sdd-spec-test` — Playwright E2E Test Spec

### cluster 2 — the code preparator
- `sdd-implement-code` — AI implementation prompt from DESIGN.md

### cluster 3 — the QA engine
- `sdd-qa-test-script` — generate Playwright test script
- `sdd-qa-test-run` — run Playwright test (auto-install)
- `sdd-qa-report` — generate QA Report

> all skills & workflows available for Windsurf Cascade, Claude, OpenCode, and Antigravity.

---

## DESIGN.md lookup order

`/implement-code` searches for DESIGN.md in this order:

```
docs/DESIGN.md
docs/[feature]-DESIGN.md
.windsurf/skills/[feature]-DESIGN.md
.opencode/skills/[feature]-DESIGN.md
.claude/skills/[feature]-DESIGN.md
.antigravity/skills/[feature]-DESIGN.md
```

---

## file structure

```
your-project/
├── .windsurf/
│   ├── _templates/
│   ├── skills/
│   │   ├── sdd-*/              # skill definitions
│   │   ├── [feature]-BRD.md
│   │   └── [feature]-TECHNICAL_DESIGN.md
│   └── workflows/
│       ├── sdd-*.md            # workflow definitions
│       ├── [feature]-SPEC_TEST.md
│       └── [feature]-REPORT.md
├── .opencode/                  # same structure
├── .claude/                    # same structure
├── .antigravity/               # same structure
├── docs/
│   └── DESIGN.md
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
│   ├── brd-template.md
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

## troubleshooting

**`sdd-gen` not found**
```bash
npm link
```

**no AI tool folders found**  
CLI will prompt you to create a folder. pick one: `.windsurf` `.opencode` `.claude` `.antigravity`

**DESIGN.md not found**  
check the lookup order above. make sure the file exists in one of those locations.

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