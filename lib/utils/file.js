const fs = require('fs-extra');
const path = require('path');

// Get the root CLI directory (where index.js is located).
// SDD_CLI_ROOT overrides it so tests can simulate a broken install.
const CLI_ROOT_DIR = process.env.SDD_CLI_ROOT
  ? path.resolve(process.env.SDD_CLI_ROOT)
  : path.resolve(__dirname, '..', '..');

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

// Feature names become path segments, so they must be a single safe slug.
const FEATURE_NAME_RE = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

class CliError extends Error {
  constructor(message, exitCode = 1) {
    super(message);
    this.name = 'CliError';
    this.exitCode = exitCode;
  }
}

function validateFeatureName(name) {
  if (typeof name !== 'string' || name.trim() === '') {
    throw new CliError('Feature name is required.');
  }
  const value = name.trim();
  if (value.length > 100 || !FEATURE_NAME_RE.test(value)) {
    throw new CliError(
      `Invalid feature name "${value}": use letters, digits, "-" or "_" only (no paths).`
    );
  }
  return value;
}

function assertInside(rootDir, targetPath) {
  const root = path.resolve(rootDir);
  const target = path.resolve(targetPath);
  const rel = path.relative(root, target);
  if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new CliError(`Refusing to write outside ${root}: ${target}`);
  }
  return target;
}

async function resolveThroughExistingLinks(targetPath) {
  let current = path.resolve(targetPath);
  const missing = [];
  while (true) {
    try {
      await fs.lstat(current);
      break;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const parent = path.dirname(current);
      if (parent === current) throw error;
      missing.push(path.basename(current));
      current = parent;
    }
  }
  const realCurrent = await fs.realpath(current);
  return path.resolve(realCurrent, ...missing.reverse());
}

async function assertResolvedInside(rootDir, targetPath) {
  const [realRoot, realTarget] = await Promise.all([
    resolveThroughExistingLinks(rootDir),
    resolveThroughExistingLinks(targetPath)
  ]);
  const relative = path.relative(realRoot, realTarget);
  const comparable = process.platform === 'win32' ? relative.toLowerCase() : relative;
  if (!comparable || comparable === '..' || comparable.startsWith(`..${path.sep}`) || path.isAbsolute(comparable)) {
    throw new CliError(`Refusing to write through a filesystem link outside ${realRoot}: ${realTarget}`);
  }
  return realTarget;
}

// Write a generated file inside rootDir. Existing files are preserved unless
// `force` is set, so a repeated command cannot destroy user edits by accident.
// Returns true when an existing file was replaced.
async function writeGeneratedFile(filePath, content, { rootDir, force = false, label = 'File' } = {}) {
  assertInside(rootDir, filePath);
  await assertResolvedInside(rootDir, filePath);
  const exists = await fs.pathExists(filePath);
  if (exists && !force) {
    throw new CliError(`${label} already exists: ${filePath}\nUse --force to overwrite it.`);
  }
  await fs.outputFile(filePath, content, 'utf-8');
  return exists;
}

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
- **production/** - Epic-nested story breakdown files at docs/production/<feature>/<epic-slug>/<story-no>-<story-slug>/ with prod.md, tech.md, design.md, testing.md; legacy flat files remain readable
- **test-reports/** - QA test reports and spec test documents

## Usage

Documentation is generated using the TVP-SDD-Dev CLI commands:
- \`sdd-gen /prd <featureName>\` - Generate PRD
- \`sdd-gen /technical <featureName>\` - Generate Technical Design
- \`sdd-gen /breakdown-task <prd-file> [featureName]\` - Generate scenario breakdowns
- \`sdd-gen /implement-code <scenario-number> [featureName]\` - Generate implementation brief
- \`sdd-gen /qa-test-script <featureName>\` - Generate test script
- \`sdd-gen /qa-report <featureName>\` - Generate QA Report
`;
    await fs.writeFile(docsReadmePath, docsReadmeContent, 'utf-8');
  }
}

function safeSlug(value, fallback, limit = 50) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, limit)
    .replace(/-+$/g, '');
  if (slug) return slug;
  const safeFallback = String(fallback)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, limit)
    .replace(/-+$/g, '');
  return safeFallback || 'item';
}

// Helper function to parse user stories from PRD
function parseUserStories(prdContent) {
  const userStories = [];
  const lines = prdContent.split(/\r?\n/);
  let currentStory = null;
  let currentEpic = null;
  let currentEpicSlug = null;
  const usedEpicSlugs = new Set();
  let inAcceptanceCriteria = false;
  
  for (const line of lines) {
    const epicMatch = line.match(/^###\s+Epic\s+\d+\s*:\s*(.+)$/i);
    if (epicMatch) {
      if (currentStory) userStories.push(currentStory);
      currentStory = null;
      currentEpic = epicMatch[1].trim();
      const baseSlug = safeSlug(currentEpic, 'epic');
      currentEpicSlug = baseSlug;
      let suffix = 2;
      while (usedEpicSlugs.has(currentEpicSlug)) {
        const suffixText = String(suffix++);
        const prefix = baseSlug.slice(0, 49 - suffixText.length).replace(/-+$/g, '');
        currentEpicSlug = `${prefix}-${suffixText}`;
      }
      usedEpicSlugs.add(currentEpicSlug);
      inAcceptanceCriteria = false;
      continue;
    }
    if (/^#{1,3}\s/.test(line)) {
      if (currentStory) userStories.push(currentStory);
      currentStory = null;
      currentEpic = null;
      currentEpicSlug = null;
      inAcceptanceCriteria = false;
      continue;
    }
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
      
      const slug = safeSlug(title, `story-${id}`);
      
      currentStory = {
        id: id,
        title: title,
        slug: slug,
        epicTitle: currentEpic,
        epicSlug: currentEpicSlug,
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
          currentStory.slug = safeSlug(currentStory.iWant, `story-${currentStory.id}`);
        }
      } else if (soThatMatch) {
        currentStory.soThat = soThatMatch[1].trim();
      } else if (line.match(/\*\*Acceptance Criteria:?\*\*:?/i)) {
        inAcceptanceCriteria = true;
      } else if (inAcceptanceCriteria) {
        const criteriaMatch = line.match(/^\s*-\s*\[([ xX])\]\s*(.+)/);
        if (criteriaMatch) {
          const text = criteriaMatch[2].trim();
          const idMatch = text.match(/\bAC-[A-Z0-9][A-Z0-9-]*-\d+-\d+\b/);
          currentStory.acceptanceCriteria.push({
            text,
            checked: criteriaMatch[1].toLowerCase() === 'x',
            id: idMatch ? idMatch[0] : null
          });
        } else if (line.trim() !== '') {
          inAcceptanceCriteria = false;
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

// Fill common template placeholders (feature name, project name, dates)
async function fillDocTemplate(content, featureName, projectDir) {
  const today = new Date().toISOString().slice(0, 10);
  let projectName = '[Project Name]';
  const pkgPath = path.join(projectDir, 'package.json');
  if (await fs.pathExists(pkgPath)) {
    try {
      const pkg = await fs.readJson(pkgPath);
      if (pkg.name) projectName = pkg.name;
    } catch (e) {
      // Ignore malformed package.json
    }
  }
  return content
    .replace(/\[Feature Name\]/g, featureName)
    .replace(/\[Feature\]/g, featureName)
    .replace(/\[Project Name\]/g, projectName)
    .replace(/\[YYYY-MM-DD\]/g, today);
}

module.exports = {
  CLI_ROOT_DIR,
  FEATURE_NAME_RE,
  CliError,
  validateFeatureName,
  assertInside,
  assertResolvedInside,
  writeGeneratedFile,
  getPaths,
  ensureDirectories,
  parseUserStories,
  ensurePlaywrightInstalled,
  fillDocTemplate
};
