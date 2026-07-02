const fs = require('fs-extra');
const path = require('path');

// Get the root CLI directory (where index.js is located)
const CLI_ROOT_DIR = path.resolve(__dirname, '..', '..');

// Path configurations (should be passed in or use defaults)
const getPaths = (cliDir = CLI_ROOT_DIR, projectDir = process.cwd()) => ({
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
  let inAcceptanceCriteria = false;
  
  for (const line of lines) {
    // Detect user story headers (support both formats)
    // Format 1: "#### User Story 1" (without title)
    // Format 2: "#### User Story 1: CV Upload" (with title)
    const storyMatch = line.match(/####\s+User\s+Story\s+(\d+)(?::\s*(.+))?/i);
    
    if (storyMatch) {
      if (currentStory) {
        userStories.push(currentStory);
      }
      
      const id = parseInt(storyMatch[1]);
      const title = storyMatch[2] ? storyMatch[2].trim() : ''; // Title might be empty
      
      // Generate slug from title or use ID as fallback
      let slug;
      if (title) {
        slug = title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/-+/g, '-') // Replace multiple hyphens with single
          .trim();
      } else {
        slug = `story-${id}`; // Fallback to story-1, story-2, etc.
      }
      
      currentStory = {
        id: id,
        title: title,
        slug: slug,
        asA: '',
        iWant: '',
        soThat: '',
        acceptanceCriteria: []
      };
      inAcceptanceCriteria = false;
    } else if (currentStory) {
      // Extract "As a", "I want", "So that"
      const asAMatch = line.match(/\*\*As a\*\*\s*(.+)/i);
      const iWantMatch = line.match(/\*\*I want\*\*\s*(.+)/i);
      const soThatMatch = line.match(/\*\*So that\*\*\s*(.+)/i);
      
      if (asAMatch) {
        currentStory.asA = asAMatch[1].trim();
      } else if (iWantMatch) {
        currentStory.iWant = iWantMatch[1].trim();
        // If no title from header, generate slug from "I want"
        if (!currentStory.title) {
          currentStory.title = currentStory.iWant.substring(0, 50); // Use first 50 chars as title
          currentStory.slug = currentStory.iWant
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()
            .substring(0, 50); // Limit slug length
        }
      } else if (soThatMatch) {
        currentStory.soThat = soThatMatch[1].trim();
      } else if (line.match(/\*\*Acceptance Criteria\*\*/i)) {
        inAcceptanceCriteria = true;
      } else if (inAcceptanceCriteria && line.match(/^\s*-\s*\[\s*\]\s*(.+)/)) {
        const criteriaMatch = line.match(/^\s*-\s*\[\s*\]\s*(.+)/);
        if (criteriaMatch) {
          currentStory.acceptanceCriteria.push(criteriaMatch[1].trim());
        }
      }
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
