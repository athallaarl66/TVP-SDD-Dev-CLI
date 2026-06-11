const fs = require('fs-extra');
const path = require('path');

// Path configurations (should be passed in or use defaults)
const getPaths = (cliDir = __dirname, projectDir = process.cwd()) => ({
  CLI_DIR: cliDir,
  TEMPLATES_DIR: path.join(cliDir, 'templates'),
  SKILL_TEMPLATES_DIR: path.join(cliDir, 'skill-templates'),
  WORKFLOW_TEMPLATES_DIR: path.join(cliDir, 'workflow-templates'),
  PROJECT_DIR: projectDir,
  TESTS_DIR: path.join(projectDir, 'tests'),
  DOCS_DIR: path.join(projectDir, 'docs'),
  DOCS_FEATURES_DIR: path.join(projectDir, 'docs', 'features'),
  DOCS_PRODUCTION_DIR: path.join(projectDir, 'docs', 'production'),
  DOCS_TEST_REPORTS_DIR: path.join(projectDir, 'docs', 'test-reports')
});

// Ensure directories exist
async function ensureDirectories(paths) {
  const {
    TESTS_DIR,
    DOCS_DIR,
    DOCS_FEATURES_DIR,
    DOCS_PRODUCTION_DIR,
    DOCS_TEST_REPORTS_DIR
  } = paths;

  // Create tests directory
  await fs.ensureDir(TESTS_DIR);
  
  // Create docs directory structure
  await fs.ensureDir(DOCS_DIR);
  await fs.ensureDir(DOCS_FEATURES_DIR);
  await fs.ensureDir(DOCS_PRODUCTION_DIR);
  await fs.ensureDir(DOCS_TEST_REPORTS_DIR);
  
  // Create docs/README.md if it doesn't exist
  const docsReadmePath = path.join(DOCS_DIR, 'README.md');
  if (!(await fs.pathExists(docsReadmePath))) {
    const docsReadmeContent = `# Documentation

This directory contains all project documentation organized by type.

## Structure

- **features/** - Product Requirements Documents (PRD) and Technical Design documents
- **production/** - Scenario-level breakdown files (prod, testing, design, tech)
- **test-reports/** - QA test reports and spec test documents

## Usage

Documentation is generated using the TVP-SDD-Dev CLI commands:
- \`sdd-gen /prd <featureName>\` - Generate PRD
- \`sdd-gen /technical <featureName>\` - Generate Technical Design
- \`sdd-gen /sdd-breakdown-task <prd-file> [featureName]\` - Generate scenario breakdowns
- \`sdd-gen /spec-test <featureName>\` - Generate Spec Test
- \`sdd-gen /qa-report <featureName>\` - Generate QA Report
`;
    await fs.writeFile(docsReadmePath, docsReadmeContent, 'utf-8');
  }
}

// Helper function to parse user stories from PRD
function parseUserStories(prdContent) {
  const userStories = [];
  const lines = prdContent.split('\n');
  let currentStory = null;
  
  for (const line of lines) {
    // Detect user story headers (e.g., "#### User Story 1" or "### User Story: Login")
    const storyMatch = line.match(/####\s+User\s+Story\s+(\d+)/i) || line.match(/###\s+User\s+Story:\s*(.+)/i);
    
    if (storyMatch) {
      if (currentStory) {
        userStories.push(currentStory);
      }
      currentStory = {
        title: storyMatch[2] || `Story ${storyMatch[1]}`,
        content: ''
      };
    } else if (currentStory) {
      currentStory.content += line + '\n';
    }
  }
  
  if (currentStory) {
    userStories.push(currentStory);
  }
  
  return userStories;
}

// Helper function to install Playwright if not present
async function ensurePlaywrightInstalled(projectDir) {
  const packageJsonPath = path.join(projectDir, 'package.json');
  
  if (!(await fs.pathExists(packageJsonPath))) {
    console.error('Error: package.json not found in project directory');
    process.exit(1);
  }
  
  const packageJson = await fs.readJson(packageJsonPath);
  const devDeps = packageJson.devDependencies || {};
  
  if (!devDeps['@playwright/test']) {
    console.log('📦 Installing @playwright/test...');
    const { execSync } = require('child_process');
    try {
      execSync('npm install --save-dev @playwright/test', { cwd: projectDir, stdio: 'inherit' });
      console.log('✅ @playwright/test installed');
      
      console.log('📦 Installing Playwright browsers...');
      execSync('npx playwright install', { cwd: projectDir, stdio: 'inherit' });
      console.log('✅ Playwright browsers installed');
    } catch (error) {
      console.error('Error installing Playwright:', error.message);
      process.exit(1);
    }
  }
}

module.exports = {
  getPaths,
  ensureDirectories,
  parseUserStories,
  ensurePlaywrightInstalled
};
