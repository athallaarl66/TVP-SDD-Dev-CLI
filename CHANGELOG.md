# Changelog

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
