# TVP-SDD-Dev CLI

**Software Development Documentation CLI Tool**

A global CLI tool for streamlining software development documentation workflow. Generate standardized BRD, Technical Design, Test Specifications, and QA Reports with Playwright E2E testing integration. Works with AI tool folders (.windsurf, .opencode, .claude, .antigravity).

## 🎯 What is TVP-SDD-Dev CLI?

TVP-SDD-Dev CLI is a command-line tool that helps developers and teams create standardized documentation for software development projects. It provides templates and automation for:

- **Business Requirements Document (BRD)** - Define business objectives and requirements
- **Technical Design Document (TDD)** - Architectural and technical specifications
- **Software Test Specification (STS)** - Playwright E2E test planning
- **QA Reports** - Test execution and issue tracking
- **AI Implementation Prompts** - Generate prompts for AI-assisted coding

## 🚀 Installation

### Prerequisites

- Node.js >= 14.0.0
- npm or yarn

### Install from Source

1. Clone this repository:
```bash
git clone <repository-url>
cd TVP-sdd-cli
```

2. Install dependencies:
```bash
npm install
```

3. Link globally:
```bash
npm link
```

4. Verify installation:
```bash
sdd-gen --help
```

## 📖 Usage

### Quick Start (Simplified Workflow)

1. Navigate to your project directory:
```bash
cd /path/to/your/project
```

2. Install all skills/templates to AI tool folders:
```bash
sdd-gen /install-all-skills
```

3. Initialize all documentation at once:
```bash
sdd-gen /init user-authentication
```

4. Fill in the generated documents in AI tool folders (skills/, workflows/)

5. Create visual design tokens:
```bash
# Create docs/DESIGN.md (generic) or .windsurf/skills/user-authentication-DESIGN.md
```

6. Generate AI implementation prompt:
```bash
sdd-gen /implement-code user-authentication
```

7. Generate and setup Playwright tests:
```bash
sdd-gen /qa-test-script user-authentication
sdd-gen /qa-test-run user-authentication
npm run qa-run:user-authentication
```

8. Generate QA report after testing:
```bash
sdd-gen /qa-report user-authentication
```

## 🔧 Commands

### `/install-all-skills`
Install all templates to AI tool folders.

**What it does:**
- Prompts to create AI tool folders if none exist (.windsurf, .opencode, .claude, .antigravity)
- Copies all CLI templates to each AI tool's `_templates/` folder
- Creates necessary subdirectories (skills/, workflows/, _templates/)

**Example:**
```bash
sdd-gen /install-all-skills
```

---

### `/init <featureName>`
Generate all documentation (BRD, Technical, Spec Test, QA Report) at once.

**Output:** 
- `.windsurf/skills/[featureName]-BRD.md`
- `.windsurf/skills/[featureName]-TECHNICAL_DESIGN.md`
- `.windsurf/workflows/[featureName]-SPEC_TEST.md`
- `.windsurf/workflows/[featureName]-REPORT.md`
- (Also generates to other AI tool folders if they exist)

**Example:**
```bash
sdd-gen /init user-authentication
```

**What it does:**
- Prompts to create AI tool folders if none exist
- Generates all documentation templates in one command
- Creates necessary subdirectories automatically
- Shows next steps for implementation

---

### `/brd <featureName>`
Generate Business Requirements Document from template.

**Output:** `.windsurf/skills/[featureName]-BRD.md` (and other AI tool folders)

**Example:**
```bash
sdd-gen /brd user-authentication
```

**Template includes:**
- Executive Summary
- Stakeholder Analysis
- Functional & Non-Functional Requirements
- User Interface Requirements
- Data Requirements
- Integration Requirements
- Business Rules
- Risks & Mitigation
- Success Metrics

---

### `/technical <featureName>`
Generate Technical Design Document from template.

**Output:** `.windsurf/skills/[featureName]-TECHNICAL_DESIGN.md` (and other AI tool folders)

**Example:**
```bash
sdd-gen /technical user-authentication
```

**Template includes:**
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

---

### `/spec-test <featureName>`
Generate Playwright E2E Test Specification from template.

**Output:** `.windsurf/workflows/[featureName]-SPEC_TEST.md` (and other AI tool folders)

**Example:**
```bash
sdd-gen /spec-test user-authentication
```

**Template includes:**
- Playwright Configuration
- Page Object Model Structure
- E2E Test Cases (User Flows, Form Validation, Navigation, API Integration, Responsive, Accessibility, Performance)
- Test Data Management
- Test Execution Commands
- CI/CD Integration
- Reporting & Debugging

---

### `/implement-code <featureName>`
Load DESIGN.md and generate AI implementation prompt.

**Prerequisite:** DESIGN.md must exist in one of these locations:
- `docs/DESIGN.md` (generic for entire project)
- `docs/[featureName]-DESIGN.md` (feature-specific)
- `.windsurf/skills/[featureName]-DESIGN.md`
- `.opencode/skills/[featureName]-DESIGN.md`
- `.claude/skills/[featureName]-DESIGN.md`
- `.antigravity/skills/[featureName]-DESIGN.md`

**Example:**
```bash
sdd-gen /implement-code user-authentication
```

**Output:** Terminal prompt for AI agents (Windsurf Cascade, Claude, OpenCode)

**What it does:**
- Reads DESIGN.md for visual tokens
- Generates prompt combining design specs with BRD and Technical Design references
- Provides instructions for full slice code implementation

---

### `/qa-test-script <featureName>`
Generate Playwright test script from SPEC_TEST document.

**Prerequisite:** `[featureName]-SPEC_TEST.md` must exist in AI tool workflows folder

**Output:** `tests/[featureName].spec.js`

**Example:**
```bash
sdd-gen /qa-test-script user-authentication
```

**What it does:**
- Reads SPEC_TEST.md content
- Generates Playwright test script with basic structure
- Includes test describe block and placeholder tests

---

### `/qa-test-run <featureName>`
Execute Playwright test and add script to package.json.

**Prerequisite:** `tests/[featureName].spec.js` must exist

**Output:** Adds script to `package.json` and provides execution command

**Example:**
```bash
sdd-gen /qa-test-run user-authentication
```

**What it does:**
- Auto-installs @playwright/test if not present
- Auto-installs Playwright browsers if not present
- Adds `qa-run:[featureName]` script to package.json
- Provides command to run: `npm run qa-run:[featureName]`

---

### `/qa-report <featureName>`
Generate QA Report document from template.

**Output:** `.windsurf/workflows/[featureName]-REPORT.md` (and other AI tool folders)

**Example:**
```bash
sdd-gen /qa-report user-authentication
```

**Template includes:**
- Test Execution Summary
- Test Results Overview
- Browser Test Results
- Failed Tests
- Flaky Tests
- Performance Metrics
- Coverage Report
- Artifacts (Screenshots, Videos, Traces)
- Issues Found
- Fixes Applied
- Regression Tests
- Ship Readiness

## 📁 Generated File Structure

```
your-project/
├── .windsurf/
│   ├── _templates/
│   │   ├── brd-template.md
│   │   ├── technical-template.md
│   │   ├── spec-test-template.md
│   │   └── qa-report-template.md
│   ├── skills/
│   │   ├── [featureName]-BRD.md
│   │   ├── [featureName]-TECHNICAL_DESIGN.md
│   │   └── [featureName]-DESIGN.md (manual)
│   └── workflows/
│       ├── [featureName]-SPEC_TEST.md
│       └── [featureName]-REPORT.md
├── .opencode/ (same structure as .windsurf)
├── .claude/ (same structure as .windsurf)
├── .antigravity/ (same structure as .windsurf)
├── docs/
│   └── DESIGN.md (optional, generic design tokens)
├── tests/
│   └── [featureName].spec.js
└── package.json (updated with qa-run script)
```

## 🛠️ Development

### Project Structure

```
TVP-sdd-cli/
├── index.js              # Main CLI entry point
├── package.json          # Dependencies and configuration
├── templates/            # Master templates
│   ├── brd-template.md
│   ├── technical-template.md
│   ├── spec-test-template.md
│   └── qa-report-template.md
└── README.md            # This file
```

### Dependencies

- `commander` - CLI framework
- `inquirer` - Interactive command-line prompts
- `fs-extra` - File system operations
- `chalk` - Terminal styling

### Modifying Templates

Edit files in the `templates/` directory to customize documentation templates. Changes will be reflected in all future generated documents.

## 📝 Example Workflow

Let's say you're building a "user-authentication" feature:

```bash
# 1. Install all skills/templates to AI tool folders
sdd-gen /install-all-skills

# 2. Initialize all documentation at once
sdd-gen /init user-authentication

# 3. Fill in the generated documents with your requirements
# - .windsurf/skills/user-authentication-BRD.md
# - .windsurf/skills/user-authentication-TECHNICAL_DESIGN.md
# - .windsurf/workflows/user-authentication-SPEC_TEST.md
# - .windsurf/workflows/user-authentication-REPORT.md

# 4. Create visual design tokens
# Create docs/DESIGN.md with colors, layout, etc.
# OR create .windsurf/skills/user-authentication-DESIGN.md

# 5. Generate AI prompt for implementation
sdd-gen /implement-code user-authentication
# Copy the output and paste to your AI agent

# 6. Generate test script
sdd-gen /qa-test-script user-authentication

# 7. Customize the test script in tests/user-authentication.spec.js

# 8. Setup test runner (auto-installs Playwright)
sdd-gen /qa-test-run user-authentication

# 9. Run tests
npm run qa-run:user-authentication

# 10. Generate QA report after testing
sdd-gen /qa-report user-authentication
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT

## 🆘 Troubleshooting

### Command not found
If `sdd-gen` command is not found, try:
```bash
npm link
```

### No AI tool folders found
If you see "No AI tool folders found", the CLI will prompt you to create them. Select one or more of:
- .windsurf
- .opencode
- .claude
- .antigravity

### Template not found
Ensure you're in the CLI directory and templates exist:
```bash
ls templates/
```

### DESIGN.md not found
The CLI searches for DESIGN.md in multiple locations:
1. `docs/DESIGN.md` (generic)
2. `docs/[featureName]-DESIGN.md` (feature-specific)
3. `.windsurf/skills/[featureName]-DESIGN.md`
4. `.opencode/skills/[featureName]-DESIGN.md`
5. `.claude/skills/[featureName]-DESIGN.md`
6. `.antigravity/skills/[featureName]-DESIGN.md`

### Permission denied
On some systems, you may need to run with elevated permissions:
```bash
sudo npm link
```

## 🔗 Links

- [Playwright Documentation](https://playwright.dev/)
- [Commander.js Documentation](https://www.npmjs.com/package/commander)
- [Inquirer.js Documentation](https://www.npmjs.com/package/inquirer)

---

**Built with ❤️ for efficient software development workflows**
