# TVP-SDD-Dev CLI

**Software Development Documentation CLI Tool**

A global CLI tool for streamlining software development documentation workflow. Generate standardized BRD, Technical Design, Test Specifications, and QA Reports with Playwright E2E testing integration.

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

2. Initialize all documentation at once:
```bash
sdd-gen /init user-authentication
```

3. Fill in the generated documents in `docs/` folder

4. Create visual design tokens:
```bash
# Create docs/user-authentication-DESIGN.md with visual specifications
```

5. Generate AI implementation prompt:
```bash
sdd-gen /implement-code user-authentication
```

6. Generate and setup Playwright tests:
```bash
sdd-gen /qa-test-script user-authentication
sdd-gen /qa-test-run user-authentication
npm run qa-run:user-authentication
```

7. Generate QA report after testing:
```bash
sdd-gen /qa-report user-authentication
```

### Individual Commands

If you prefer to generate documents individually:

## 🔧 Commands

### `/init <featureName>`
Generate all documentation (BRD, Technical, Spec Test, QA Report) at once.

**Output:** 
- `docs/[featureName]-BRD.md`
- `docs/[featureName]-TECHNICAL_DESIGN.md`
- `docs/[featureName]-SPEC_TEST.md`
- `docs/[featureName]-REPORT.md`

**Example:**
```bash
sdd-gen /init user-authentication
```

**What it does:**
- Generates all documentation templates in one command
- Creates necessary directories automatically
- Shows next steps for implementation

---

### `/brd <featureName>`
Generate Business Requirements Document from template.

**Output:** `docs/[featureName]-BRD.md`

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

**Output:** `docs/[featureName]-TECHNICAL_DESIGN.md`

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

**Output:** `docs/[featureName]-SPEC_TEST.md`

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

**Prerequisite:** `docs/[featureName]-DESIGN.md` must exist

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

**Prerequisite:** `docs/[featureName]-SPEC_TEST.md` must exist

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
- Adds `qa-run:[featureName]` script to package.json
- Provides command to run: `npm run qa-run:[featureName]`
- Alternative: `npx playwright test tests/[featureName].spec.js`

---

### `/qa-report <featureName>`
Generate QA Report document from template.

**Output:** `docs/[featureName]-REPORT.md`

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
├── docs/
│   ├── [featureName]-BRD.md
│   ├── [featureName]-TECHNICAL_DESIGN.md
│   ├── [featureName]-SPEC_TEST.md
│   ├── [featureName]-DESIGN.md (manual)
│   └── [featureName]-REPORT.md
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
# 1. Initialize all documentation at once
sdd-gen /init user-authentication

# 2. Fill in the generated documents with your requirements
# - docs/user-authentication-BRD.md
# - docs/user-authentication-TECHNICAL_DESIGN.md
# - docs/user-authentication-SPEC_TEST.md
# - docs/user-authentication-REPORT.md

# 3. Create visual design tokens
# Create docs/user-authentication-DESIGN.md with colors, layout, etc.

# 4. Generate AI prompt for implementation
sdd-gen /implement-code user-authentication
# Copy the output and paste to your AI agent

# 5. Generate test script
sdd-gen /qa-test-script user-authentication

# 6. Customize the test script in tests/user-authentication.spec.js

# 7. Setup test runner
sdd-gen /qa-test-run user-authentication

# 8. Run tests
npm run qa-run:user-authentication

# 9. Generate QA report after testing
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

### Template not found
Ensure you're in the CLI directory and templates exist:
```bash
ls templates/
```

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
