#!/usr/bin/env node

const { Command } = require('commander');
const inquirer = require('inquirer');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

const program = new Command();

// Path configurations
const CLI_DIR = __dirname; // Internal CLI directory
const TEMPLATES_DIR = path.join(CLI_DIR, 'templates'); // Internal templates directory
const SKILL_TEMPLATES_DIR = path.join(CLI_DIR, 'skill-templates'); // Internal skill templates directory
const WORKFLOW_TEMPLATES_DIR = path.join(CLI_DIR, 'workflow-templates'); // Internal workflow templates directory
const PROJECT_DIR = process.cwd(); // User's current working directory
const TESTS_DIR = path.join(PROJECT_DIR, 'tests'); // User's tests directory

// AI tool directories
const AI_DIRS = ['.windsurf', '.opencode', '.claude', '.antigravity'];
const AI_SUBDIRS = ['skills', 'workflows', '_templates'];

// Get existing AI tool directories
async function getExistingAIDirectories() {
  const existingDirs = [];
  for (const aiDir of AI_DIRS) {
    const aiDirPath = path.join(PROJECT_DIR, aiDir);
    if (await fs.pathExists(aiDirPath)) {
      existingDirs.push(aiDir);
    }
  }
  return existingDirs;
}

// Prompt user to create AI tool folders if none exist
async function promptForAIFolders() {
  const { selectedFolders } = await inquirer.default.prompt([
    {
      type: 'checkbox',
      name: 'selectedFolders',
      message: 'No AI tool folders found. Which folders do you want to create?',
      choices: AI_DIRS,
      validate: (answer) => {
        if (answer.length < 1) {
          return 'You must choose at least one folder.';
        }
        return true;
      }
    }
  ]);

  // Create selected folders and subdirectories
  for (const folder of selectedFolders) {
    const folderPath = path.join(PROJECT_DIR, folder);
    await fs.ensureDir(folderPath);
    
    for (const subdir of AI_SUBDIRS) {
      await fs.ensureDir(path.join(folderPath, subdir));
    }
    
    console.log(chalk.green(`✅ Created folder: ${folder}/`));
  }

  return selectedFolders;
}

// Ensure directories exist
async function ensureDirectories() {
  // Create tests directory
  await fs.ensureDir(TESTS_DIR);
}

// Command 1: /prd - Generate PRD document
program
  .command('/prd <featureName>')
  .description('Generate PRD document from template')
  .action(async (featureName) => {
    try {
      await ensureDirectories();
      
      let existingDirs = await getExistingAIDirectories();
      if (existingDirs.length === 0) {
        existingDirs = await promptForAIFolders();
      }
      
      const templatePath = path.join(TEMPLATES_DIR, 'prd-template.md');
      
      // Check if template exists
      if (!(await fs.pathExists(templatePath))) {
        console.error(chalk.red('Error: prd-template.md not found in CLI templates directory'));
        process.exit(1);
      }
      
      // Read template once
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      
      // Generate to existing AI tool skills folders
      for (const aiDir of existingDirs) {
        const skillsPath = path.join(PROJECT_DIR, aiDir, 'skills');
        await fs.ensureDir(skillsPath);
        const outputPath = path.join(skillsPath, `${featureName}-PRD.md`);
        await fs.writeFile(outputPath, templateContent, 'utf-8');
        console.log(chalk.green(`✅ PRD document created: ${outputPath}`));
      }
    } catch (error) {
      console.error(chalk.red('Error generating PRD:'), error.message);
      process.exit(1);
    }
  });

// Command 2: /breakdown-task - Parse PRD and generate scenario-level documentation
program
  .command('/breakdown-task <prdFile> [featureName]')
  .description('Parse PRD and generate scenario-level documentation (prod, testing, design, tech)')
  .action(async (prdFile, featureName) => {
    try {
      // Resolve PRD file path
      const prdPath = path.resolve(PROJECT_DIR, prdFile);
      
      // Check if PRD file exists
      if (!(await fs.pathExists(prdPath))) {
        console.error(chalk.red(`Error: PRD file not found: ${prdFile}`));
        console.error(chalk.yellow(`Run 'sdd-gen /prd <featureName>' first to generate the PRD document`));
        process.exit(1);
      }
      
      // Read PRD content
      const prdContent = await fs.readFile(prdPath, 'utf-8');
      
      // Extract feature name from PRD if not provided
      if (!featureName) {
        // Try to extract feature name from PRD filename
        const prdFileName = path.basename(prdFile, '.md');
        featureName = prdFileName.replace('-PRD', '').replace('-prd', '');
        console.log(chalk.yellow(`No feature name provided, using extracted name: ${featureName}`));
      }
      
      // Parse user stories from PRD
      const userStories = parseUserStories(prdContent);
      
      if (userStories.length === 0) {
        console.error(chalk.yellow('Warning: No user stories found in PRD'));
        console.log(chalk.yellow('Make sure your PRD has a "User Stories" section with user story format'));
        process.exit(0);
      }
      
      // Create output directory
      const outputDir = path.join(PROJECT_DIR, 'docs', 'prod', featureName);
      await fs.ensureDir(outputDir);
      
      console.log(chalk.bold.cyan(`\n🚀 Breaking down PRD for: ${featureName}\n`));
      console.log(chalk.yellow(`Found ${userStories.length} user stories\n`));
      
      // Generate files for each user acceptance
      for (let i = 0; i < userStories.length; i++) {
        const num = String(i + 1).padStart(2, '0');
        const story = userStories[i];
        
        console.log(chalk.cyan(`Processing user acceptance ${num}: ${story.title}`));
        
        // Generate prod.md
        const prodTemplatePath = path.join(TEMPLATES_DIR, 'prod-template.md');
        if (await fs.pathExists(prodTemplatePath)) {
          const prodTemplate = await fs.readFile(prodTemplatePath, 'utf-8');
          const prodContent = prodTemplate.replace(/<Feature><num>/g, `${featureName}${num}`);
          const prodPath = path.join(outputDir, `${featureName}${num}-prod.md`);
          await fs.writeFile(prodPath, prodContent, 'utf-8');
          console.log(chalk.green(`  ✅ Created: ${featureName}${num}-prod.md`));
        }
        
        // Generate testing.md
        const testingTemplatePath = path.join(TEMPLATES_DIR, 'testing-template.md');
        if (await fs.pathExists(testingTemplatePath)) {
          const testingTemplate = await fs.readFile(testingTemplatePath, 'utf-8');
          const testingContent = testingTemplate.replace(/<Feature><num>/g, `${featureName}${num}`);
          const testingPath = path.join(outputDir, `${featureName}${num}-testing.md`);
          await fs.writeFile(testingPath, testingContent, 'utf-8');
          console.log(chalk.green(`  ✅ Created: ${featureName}${num}-testing.md`));
        }
        
        // Generate design.md
        const designTemplatePath = path.join(TEMPLATES_DIR, 'design-template.md');
        if (await fs.pathExists(designTemplatePath)) {
          const designTemplate = await fs.readFile(designTemplatePath, 'utf-8');
          const designContent = designTemplate.replace(/<Feature><num>/g, `${featureName}${num}`);
          const designPath = path.join(outputDir, `${featureName}${num}-design.md`);
          await fs.writeFile(designPath, designContent, 'utf-8');
          console.log(chalk.green(`  ✅ Created: ${featureName}${num}-design.md`));
        }
        
        // Generate tech.md
        const techTemplatePath = path.join(TEMPLATES_DIR, 'tech-template.md');
        if (await fs.pathExists(techTemplatePath)) {
          const techTemplate = await fs.readFile(techTemplatePath, 'utf-8');
          const techContent = techTemplate.replace(/<Feature><num>/g, `${featureName}${num}`);
          const techPath = path.join(outputDir, `${featureName}${num}-tech.md`);
          await fs.writeFile(techPath, techContent, 'utf-8');
          console.log(chalk.green(`  ✅ Created: ${featureName}${num}-tech.md`));
        }
      }
      
      console.log(chalk.bold.cyan(`\n📝 Breakdown complete! Files generated in: ${outputDir}\n`));
      console.log(chalk.yellow(`Next steps:\n`));
      console.log(chalk.yellow(`1. Fill in the generated breakdown files with scenario-specific details`));
      console.log(chalk.yellow(`2. Run: sdd-gen /implement-code ${featureName} <num>\n`));
      
    } catch (error) {
      console.error(chalk.red('Error generating breakdown files:'), error.message);
      process.exit(1);
    }
  });

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

// Command 3: /technical - Generate Technical Design document
program
  .command('/technical <featureName>')
  .description('Generate Technical Design document from template')
  .action(async (featureName) => {
    try {
      await ensureDirectories();
      
      let existingDirs = await getExistingAIDirectories();
      if (existingDirs.length === 0) {
        existingDirs = await promptForAIFolders();
      }
      
      const templatePath = path.join(TEMPLATES_DIR, 'technical-template.md');
      
      // Check if template exists
      if (!(await fs.pathExists(templatePath))) {
        console.error(chalk.red('Error: technical-template.md not found in CLI templates directory'));
        process.exit(1);
      }
      
      // Read template once
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      
      // Generate to existing AI tool skills folders
      for (const aiDir of existingDirs) {
        const skillsPath = path.join(PROJECT_DIR, aiDir, 'skills');
        await fs.ensureDir(skillsPath);
        const outputPath = path.join(skillsPath, `${featureName}-TECHNICAL_DESIGN.md`);
        await fs.writeFile(outputPath, templateContent, 'utf-8');
        console.log(chalk.green(`✅ Technical Design document created: ${outputPath}`));
      }
    } catch (error) {
      console.error(chalk.red('Error generating Technical Design:'), error.message);
      process.exit(1);
    }
  });

// Command 3: /spec-test - Generate Spec Test document
program
  .command('/spec-test <featureName>')
  .description('Generate Spec Test document from template')
  .action(async (featureName) => {
    try {
      await ensureDirectories();
      
      let existingDirs = await getExistingAIDirectories();
      if (existingDirs.length === 0) {
        existingDirs = await promptForAIFolders();
      }
      
      const templatePath = path.join(TEMPLATES_DIR, 'spec-test-template.md');
      
      // Check if template exists
      if (!(await fs.pathExists(templatePath))) {
        console.error(chalk.red('Error: spec-test-template.md not found in CLI templates directory'));
        process.exit(1);
      }
      
      // Read template once
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      
      // Generate to existing AI tool workflows folders
      for (const aiDir of existingDirs) {
        const workflowsPath = path.join(PROJECT_DIR, aiDir, 'workflows');
        await fs.ensureDir(workflowsPath);
        const outputPath = path.join(workflowsPath, `${featureName}-SPEC_TEST.md`);
        await fs.writeFile(outputPath, templateContent, 'utf-8');
        console.log(chalk.green(`✅ Spec Test document created: ${outputPath}`));
      }
    } catch (error) {
      console.error(chalk.red('Error generating Spec Test:'), error.message);
      process.exit(1);
    }
  });

// Command 4: /implement-code - Generate skill.md and trigger implementation
program
  .command('/implement-code <featureName> <num>')
  .description('Generate skill.md with role prompts and trigger implementation using breakdown files')
  .action(async (featureName, num) => {
    try {
      // Format num with leading zero if needed
      const formattedNum = String(num).padStart(2, '0');
      
      // Check for breakdown files
      const breakdownDir = path.join(PROJECT_DIR, 'docs', 'prod', featureName);
      const prodFile = path.join(breakdownDir, `${featureName}${formattedNum}-prod.md`);
      const techFile = path.join(breakdownDir, `${featureName}${formattedNum}-tech.md`);
      const designFile = path.join(breakdownDir, `${featureName}${formattedNum}-design.md`);
      const testingFile = path.join(breakdownDir, `${featureName}${formattedNum}-testing.md`);
      
      // Check required breakdown files
      if (!(await fs.pathExists(prodFile))) {
        console.error(chalk.red(`Error: Breakdown file not found: ${prodFile}`));
        console.error(chalk.yellow(`Run 'sdd-gen /breakdown-task <prd-file> ${featureName}' first to generate breakdown files`));
        process.exit(1);
      }
      
      if (!(await fs.pathExists(techFile))) {
        console.error(chalk.red(`Error: Breakdown file not found: ${techFile}`));
        console.error(chalk.yellow(`Run 'sdd-gen /breakdown-task <prd-file> ${featureName}' first to generate breakdown files`));
        process.exit(1);
      }
      
      console.log(chalk.bold.cyan(`\n🚀 Implementing: ${featureName}${formattedNum}\n`));
      console.log(chalk.yellow(`Found breakdown files in: ${breakdownDir}\n`));
      
      // Try to find DESIGN.md (optional)
      let designPath = null;
      let designLocation = '';
      
      // 1. Check for generic DESIGN.md in docs/
      const genericDesignPath = path.join(PROJECT_DIR, 'docs', 'DESIGN.md');
      if (await fs.pathExists(genericDesignPath)) {
        designPath = genericDesignPath;
        designLocation = 'docs';
      }
      
      // 2. Check for feature-specific DESIGN.md in docs/
      if (!designPath) {
        const featureDesignPath = path.join(PROJECT_DIR, 'docs', `${featureName}-DESIGN.md`);
        if (await fs.pathExists(featureDesignPath)) {
          designPath = featureDesignPath;
          designLocation = 'docs';
        }
      }
      
      // 3. Check AI tool skills folders
      if (!designPath) {
        let existingDirs = await getExistingAIDirectories();
        if (existingDirs.length === 0) {
          existingDirs = await promptForAIFolders();
        }
        
        for (const aiDir of existingDirs) {
          const potentialPath = path.join(PROJECT_DIR, aiDir, 'skills', `${featureName}-DESIGN.md`);
          if (await fs.pathExists(potentialPath)) {
            designPath = potentialPath;
            designLocation = `${aiDir}/skills`;
            break;
          }
        }
      }
      
      if (designPath) {
        console.log(chalk.green(`✅ Found DESIGN.md: ${designPath}`));
      } else {
        console.log(chalk.yellow(`⚠️  DESIGN.md not found (optional - proceeding without visual tokens)`));
      }
      
      // Generate skill.md file
      let existingDirs = await getExistingAIDirectories();
      if (existingDirs.length === 0) {
        existingDirs = await promptForAIFolders();
      }
      
      const skillContent = generateSkillContent(featureName, formattedNum, prodFile, techFile, designFile, testingFile, designPath);
      
      // Write skill.md to AI tool skills folders
      for (const aiDir of existingDirs) {
        const skillsPath = path.join(PROJECT_DIR, aiDir, 'skills');
        await fs.ensureDir(skillsPath);
        const skillPath = path.join(skillsPath, `${featureName}${formattedNum}-skill.md`);
        await fs.writeFile(skillPath, skillContent, 'utf-8');
        console.log(chalk.green(`✅ Skill file created: ${skillPath}`));
      }
      
      console.log(chalk.bold.cyan(`\n📝 Skill file generated! Implementation triggered.\n`));
      console.log(chalk.yellow(`The AI agent can now invoke the skill file to implement ${featureName}${formattedNum}.\n`));
      
    } catch (error) {
      console.error(chalk.red('Error generating skill file:'), error.message);
      process.exit(1);
    }
  });

// Helper function to generate skill.md content
function generateSkillContent(featureName, num, prodFile, techFile, designFile, testingFile, designPath) {
  let content = `---
name: implement-${featureName}${num}
description: Implement user acceptance ${num} for ${featureName} based on breakdown files
license: MIT
compatibility: Requires TVP-SDD-Dev CLI.
metadata:
  author: Talapvnk
  version: "1.0"
  generatedBy: "sdd-gen /implement-code"
---

You are a senior IT fullstack software engineer architect with expertise in:

- Database design and optimization
- API development (REST/GraphQL)
- Frontend development with reactive state management
- SEO optimization and metadata
- Security best practices
- Performance optimization
- Testing and quality assurance

## Task

Implement user acceptance ${num} for feature "${featureName}" following the specifications in the breakdown files.

## Required Files

Read and implement based on these files:

1. **Production Requirements**: \`${prodFile}\`
   - User acceptance criteria
   - Business value and success metrics
   - User persona and journey

2. **Technical Specifications**: \`${techFile}\`
   - API endpoints
   - Database changes
   - Permissions and dependencies
   - Impact analysis

`;

  // Add optional files
  if (designFile) {
    content += `3. **Design Specifications**: \`${designFile}\` (if exists)
   - Wireframe and design references
   - UI components and visual guidelines

`;
  }

  if (testingFile) {
    content += `4. **Testing Scenarios**: \`${testingFile}\` (if exists)
   - Test cases and edge cases
   - Acceptance criteria verification

`;
  }

  // Add DESIGN.md if exists
  if (designPath) {
    content += `## Visual Design Tokens

Use the following visual tokens from DESIGN.md as mandatory standards:

\`\`\`
(Read DESIGN.md content from: ${designPath})
\`\`\`

`;
  }

  content += `## Implementation Requirements

Implement FULL SLICE CODE PRODUCTION including:

1. **Database**
   - Create/modify tables as specified
   - Add seed data if required
   - Create migrations

2. **API**
   - Implement all specified endpoints
   - Add proper error handling
   - Implement authentication/authorization if required

3. **Frontend UI Components**
   - Build reactive UI components
   - Implement state management
   - Follow design specifications
   - Ensure responsive design

4. **SEO Metadata**
   - Add proper meta tags
   - Implement structured data if required
   - Ensure proper semantic HTML

5. **Testing**
   - Follow testing scenarios from breakdown files
   - Handle edge cases

## Notes

- Follow the business logic and technical specifications from the breakdown files
- Use visual tokens from DESIGN.md if available
- Ensure code is production-ready and follows best practices
- Add proper error handling and validation
- Write clean, maintainable, and well-documented code
`;

  return content;
}

// Command 5: /qa-test-script - Generate Playwright test script from SPEC_TEST
program
  .command('/qa-test-script <featureName>')
  .description('Generate Playwright test script from SPEC_TEST document')
  .action(async (featureName) => {
    try {
      await ensureDirectories();
      
      let existingDirs = await getExistingAIDirectories();
      if (existingDirs.length === 0) {
        existingDirs = await promptForAIFolders();
      }
      
      // Try to find SPEC_TEST.md in any AI tool workflows folder
      let specTestPath = null;
      for (const aiDir of existingDirs) {
        const potentialPath = path.join(PROJECT_DIR, aiDir, 'workflows', `${featureName}-SPEC_TEST.md`);
        if (await fs.pathExists(potentialPath)) {
          specTestPath = potentialPath;
          break;
        }
      }
      
      if (!specTestPath) {
        console.error(chalk.red(`Error: ${featureName}-SPEC_TEST.md not found in AI tool workflows folders`));
        console.error(chalk.yellow(`Run 'sdd-gen /spec-test ${featureName}' first to generate the spec test document`));
        process.exit(1);
      }
      
      const testScriptPath = path.join(TESTS_DIR, `${featureName}.spec.js`);
      
      // Read SPEC_TEST content
      const specTestContent = await fs.readFile(specTestPath, 'utf-8');
      
      // Generate Playwright test script
      const playwrightScript = generatePlaywrightScript(featureName, specTestContent);
      
      // Write test script
      await fs.writeFile(testScriptPath, playwrightScript, 'utf-8');
      
      console.log(chalk.green(`✅ Playwright test script created: ${testScriptPath}`));
    } catch (error) {
      console.error(chalk.red('Error generating test script:'), error.message);
      process.exit(1);
    }
  });

// Helper function to generate Playwright script from SPEC_TEST content
function generatePlaywrightScript(featureName, specTestContent) {
  return `const { test, expect } = require('@playwright/test');

// Auto-generated from ${featureName}-SPEC_TEST.md
// Spec Test Content:
/*
${specTestContent}
*/

test.describe('${featureName} Tests', () => {
  test('should load the page', async ({ page }) => {
    // TODO: Implement test based on SPEC_TEST requirements
    await page.goto('/');
    await expect(page).toHaveTitle(/.*/);
  });

  // Add more tests based on SPEC_TEST.md requirements
  // test('should perform specific action', async ({ page }) => {
  //   // Implementation
  // });
});
`;
}

// Helper function to install Playwright if not present
async function ensurePlaywrightInstalled() {
  const packageJsonPath = path.join(PROJECT_DIR, 'package.json');
  
  if (!(await fs.pathExists(packageJsonPath))) {
    console.error(chalk.red('Error: package.json not found in project directory'));
    process.exit(1);
  }
  
  const packageJson = await fs.readJson(packageJsonPath);
  const devDeps = packageJson.devDependencies || {};
  
  if (!devDeps['@playwright/test']) {
    console.log(chalk.yellow('📦 Installing @playwright/test...'));
    const { execSync } = require('child_process');
    try {
      execSync('npm install --save-dev @playwright/test', { cwd: PROJECT_DIR, stdio: 'inherit' });
      console.log(chalk.green('✅ @playwright/test installed'));
      
      console.log(chalk.yellow('📦 Installing Playwright browsers...'));
      execSync('npx playwright install', { cwd: PROJECT_DIR, stdio: 'inherit' });
      console.log(chalk.green('✅ Playwright browsers installed'));
    } catch (error) {
      console.error(chalk.red('Error installing Playwright:'), error.message);
      process.exit(1);
    }
  }
}

// Command 6: /qa-test-run - Execute Playwright test and add to package.json
program
  .command('/qa-test-run <featureName>')
  .description('Execute Playwright test and add script to package.json')
  .action(async (featureName) => {
    try {
      const testScriptPath = path.join(TESTS_DIR, `${featureName}.spec.js`);
      const packageJsonPath = path.join(PROJECT_DIR, 'package.json');
      
      // Check if test script exists
      if (!(await fs.pathExists(testScriptPath))) {
        console.error(chalk.red(`Error: ${featureName}.spec.js not found in tests directory`));
        console.error(chalk.yellow(`Run 'sdd-gen /qa-test-script ${featureName}' first to generate the test script`));
        process.exit(1);
      }
      
      // Check if package.json exists
      if (!(await fs.pathExists(packageJsonPath))) {
        console.error(chalk.red('Error: package.json not found in project directory'));
        process.exit(1);
      }
      
      // Ensure Playwright is installed
      await ensurePlaywrightInstalled();
      
      // Read package.json
      const packageJson = await fs.readJson(packageJsonPath);
      
      // Add test script to package.json
      const scriptName = `qa-run:${featureName}`;
      packageJson.scripts = packageJson.scripts || {};
      packageJson.scripts[scriptName] = `npx playwright test tests/${featureName}.spec.js`;
      
      // Write updated package.json
      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
      
      console.log(chalk.green(`✅ Test script added to package.json: "${scriptName}"`));
      console.log(chalk.yellow(`\nTo run the test, execute: npm run ${scriptName}`));
      console.log(chalk.yellow(`Or run directly: npx playwright test tests/${featureName}.spec.js`));
      
    } catch (error) {
      console.error(chalk.red('Error setting up test run:'), error.message);
      process.exit(1);
    }
  });

// Command 7: /qa-report - Generate QA Report document
program
  .command('/qa-report <featureName>')
  .description('Generate QA Report document from template')
  .action(async (featureName) => {
    try {
      await ensureDirectories();
      
      let existingDirs = await getExistingAIDirectories();
      if (existingDirs.length === 0) {
        existingDirs = await promptForAIFolders();
      }
      
      const templatePath = path.join(TEMPLATES_DIR, 'qa-report-template.md');
      
      // Check if template exists
      if (!(await fs.pathExists(templatePath))) {
        console.error(chalk.red('Error: qa-report-template.md not found in CLI templates directory'));
        process.exit(1);
      }
      
      // Read template once
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      
      // Generate to existing AI tool workflows folders
      for (const aiDir of existingDirs) {
        const workflowsPath = path.join(PROJECT_DIR, aiDir, 'workflows');
        await fs.ensureDir(workflowsPath);
        const outputPath = path.join(workflowsPath, `${featureName}-REPORT.md`);
        await fs.writeFile(outputPath, templateContent, 'utf-8');
        console.log(chalk.green(`✅ QA Report document created: ${outputPath}`));
      }
    } catch (error) {
      console.error(chalk.red('Error generating QA Report:'), error.message);
      process.exit(1);
    }
  });

// Command 8: /install-all-skills - Install all templates, skills, and workflows to AI tool folders
program
  .command('/install-all-skills')
  .description('Install all templates, skills, and workflows to AI tool folders')
  .action(async () => {
    try {
      let existingDirs = await getExistingAIDirectories();
      if (existingDirs.length === 0) {
        existingDirs = await promptForAIFolders();
      }
      
      console.log(chalk.bold.cyan(`
████████╗██╗   ██╗██████╗       ███████╗██████╗ ██████╗
╚══██╔══╝██║   ██║██╔══██╗      ██╔════╝██╔══██╗██╔══██╗
   ██║   ██║   ██║██████╔╝█████╗███████╗██║  ██║██║  ██║
   ██║   ╚██╗ ██╔╝██╔═══╝ ╚════╝╚════██║██║  ██║██║  ██║
   ██║    ╚████╔╝ ██║            ███████║██████╔╝██████╔╝
   ╚═╝     ╚═══╝  ╚═╝            ╚══════╝╚═════╝ ╚═════╝

                  D E V  ·  C L I
`));
      
      console.log(chalk.gray(`authored by Talapvnk · version 1.0.0 · unlicensed\n`));
      
      console.log(chalk.bold.cyan(`🚀 Installing all skills to AI tool folders: ${existingDirs.join(', ')}\n`));
      
      // Copy CLI templates to each AI tool's _templates folder
      for (const aiDir of existingDirs) {
        const templatesTargetPath = path.join(PROJECT_DIR, aiDir, '_templates');
        await fs.ensureDir(templatesTargetPath);
        
        // Copy all templates from CLI templates directory
        const cliTemplates = await fs.readdir(TEMPLATES_DIR);
        for (const templateFile of cliTemplates) {
          const srcPath = path.join(TEMPLATES_DIR, templateFile);
          const destPath = path.join(templatesTargetPath, templateFile);
          await fs.copy(srcPath, destPath);
          console.log(chalk.green(`✅ Copied template: ${aiDir}/_templates/${templateFile}`));
        }
      }
      
      // Copy skill definitions to each AI tool's skills folder
      const skillTemplates = await fs.readdir(SKILL_TEMPLATES_DIR);
      for (const aiDir of existingDirs) {
        const skillsTargetPath = path.join(PROJECT_DIR, aiDir, 'skills');
        await fs.ensureDir(skillsTargetPath);
        
        for (const skillTemplate of skillTemplates) {
          const skillSrcPath = path.join(SKILL_TEMPLATES_DIR, skillTemplate);
          const skillDestPath = path.join(skillsTargetPath, skillTemplate);
          
          // Copy entire skill folder
          await fs.copy(skillSrcPath, skillDestPath);
          console.log(chalk.green(`✅ Copied skill: ${aiDir}/skills/${skillTemplate}/`));
        }
      }
      
      // Copy workflow definitions to each AI tool's workflows folder
      const workflowTemplates = await fs.readdir(WORKFLOW_TEMPLATES_DIR);
      for (const aiDir of existingDirs) {
        const workflowsTargetPath = path.join(PROJECT_DIR, aiDir, 'workflows');
        await fs.ensureDir(workflowsTargetPath);
        
        for (const workflowTemplate of workflowTemplates) {
          const workflowSrcPath = path.join(WORKFLOW_TEMPLATES_DIR, workflowTemplate);
          const workflowDestPath = path.join(workflowsTargetPath, workflowTemplate);
          
          // Copy workflow file
          await fs.copy(workflowSrcPath, workflowDestPath);
          console.log(chalk.green(`✅ Copied workflow: ${aiDir}/workflows/${workflowTemplate}`));
        }
      }
      
      console.log(chalk.bold.cyan(`\n📝 Installation complete! Templates, skills, and workflows are now in:`));
      for (const aiDir of existingDirs) {
        console.log(chalk.yellow(`  - ${aiDir}/_templates/ (document templates)`));
        console.log(chalk.yellow(`  - ${aiDir}/skills/ (AI skill definitions)`));
        console.log(chalk.yellow(`  - ${aiDir}/workflows/ (AI workflow definitions)`));
      }
      console.log(chalk.yellow(`\nDocumentation will be generated to:`));
      console.log(chalk.yellow(`  - ${existingDirs[0]}/skills/ (PRD, Technical Design)`));
      console.log(chalk.yellow(`  - ${existingDirs[0]}/workflows/ (Spec Test, QA Report)\n`));
      
    } catch (error) {
      console.error(chalk.red('Error installing skills:'), error.message);
      process.exit(1);
    }
  });

// Command 9: /init - Generate all documentation at once
program
  .command('/init <featureName>')
  .description('Generate all documentation (PRD, Technical, Spec Test, QA Report) at once')
  .action(async (featureName) => {
    try {
      await ensureDirectories();
      
      let existingDirs = await getExistingAIDirectories();
      if (existingDirs.length === 0) {
        existingDirs = await promptForAIFolders();
      }
      
      console.log(chalk.bold.cyan(`\n🚀 Initializing documentation for: ${featureName}\n`));
      console.log(chalk.yellow(`Found AI tool folders: ${existingDirs.join(', ')}\n`));
      
      const templates = [
        { name: 'PRD', template: 'prd-template.md', output: `${featureName}-PRD.md`, subdir: 'skills' },
        { name: 'Technical Design', template: 'technical-template.md', output: `${featureName}-TECHNICAL_DESIGN.md`, subdir: 'skills' },
        { name: 'Spec Test', template: 'spec-test-template.md', output: `${featureName}-SPEC_TEST.md`, subdir: 'workflows' },
        { name: 'QA Report', template: 'qa-report-template.md', output: `${featureName}-REPORT.md`, subdir: 'workflows' }
      ];
      
      for (const doc of templates) {
        const templatePath = path.join(TEMPLATES_DIR, doc.template);
        
        if (!(await fs.pathExists(templatePath))) {
          console.error(chalk.red(`❌ Error: ${doc.template} not found in CLI templates directory`));
          continue;
        }
        
        // Read template once
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        
        // Generate to existing AI tool folders
        for (const aiDir of existingDirs) {
          const subdirPath = path.join(PROJECT_DIR, aiDir, doc.subdir);
          await fs.ensureDir(subdirPath);
          const outputPath = path.join(subdirPath, doc.output);
          await fs.writeFile(outputPath, templateContent, 'utf-8');
          console.log(chalk.green(`✅ ${doc.name} created: ${outputPath}`));
        }
      }
      
      console.log(chalk.bold.cyan(`\n📝 Documentation initialized! Next steps:\n`));
      console.log(chalk.yellow(`1. Fill in the generated documents in ${existingDirs[0]}/skills/ and ${existingDirs[0]}/workflows/ folders`));
      console.log(chalk.yellow(`2. Create ${existingDirs[0]}/skills/${featureName}-DESIGN.md with visual specifications`));
      console.log(chalk.yellow(`3. Run: sdd-gen /implement-code ${featureName}`));
      console.log(chalk.yellow(`4. Run: sdd-gen /qa-test-script ${featureName}`));
      console.log(chalk.yellow(`5. Run: sdd-gen /qa-test-run ${featureName}\n`));
      
    } catch (error) {
      console.error(chalk.red('Error initializing documentation:'), error.message);
      process.exit(1);
    }
  });

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
