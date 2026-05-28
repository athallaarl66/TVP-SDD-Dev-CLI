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
const PROJECT_DIR = process.cwd(); // User's current working directory
const DOCS_DIR = path.join(PROJECT_DIR, 'docs'); // User's docs directory
const TESTS_DIR = path.join(PROJECT_DIR, 'tests'); // User's tests directory

// Ensure directories exist
async function ensureDirectories() {
  await fs.ensureDir(DOCS_DIR);
  await fs.ensureDir(TESTS_DIR);
}

// Command 1: /brd - Generate BRD document
program
  .command('/brd <featureName>')
  .description('Generate BRD document from template')
  .action(async (featureName) => {
    try {
      await ensureDirectories();
      
      const templatePath = path.join(TEMPLATES_DIR, 'brd-template.md');
      const outputPath = path.join(DOCS_DIR, `${featureName}-BRD.md`);
      
      // Check if template exists
      if (!(await fs.pathExists(templatePath))) {
        console.error(chalk.red('Error: brd-template.md not found in CLI templates directory'));
        process.exit(1);
      }
      
      // Read template and write to user's docs
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      await fs.writeFile(outputPath, templateContent, 'utf-8');
      
      console.log(chalk.green(`✅ BRD document created: ${outputPath}`));
    } catch (error) {
      console.error(chalk.red('Error generating BRD:'), error.message);
      process.exit(1);
    }
  });

// Command 2: /technical - Generate Technical Design document
program
  .command('/technical <featureName>')
  .description('Generate Technical Design document from template')
  .action(async (featureName) => {
    try {
      await ensureDirectories();
      
      const templatePath = path.join(TEMPLATES_DIR, 'technical-template.md');
      const outputPath = path.join(DOCS_DIR, `${featureName}-TECHNICAL_DESIGN.md`);
      
      // Check if template exists
      if (!(await fs.pathExists(templatePath))) {
        console.error(chalk.red('Error: technical-template.md not found in CLI templates directory'));
        process.exit(1);
      }
      
      // Read template and write to user's docs
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      await fs.writeFile(outputPath, templateContent, 'utf-8');
      
      console.log(chalk.green(`✅ Technical Design document created: ${outputPath}`));
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
      
      const templatePath = path.join(TEMPLATES_DIR, 'spec-test-template.md');
      const outputPath = path.join(DOCS_DIR, `${featureName}-SPEC_TEST.md`);
      
      // Check if template exists
      if (!(await fs.pathExists(templatePath))) {
        console.error(chalk.red('Error: spec-test-template.md not found in CLI templates directory'));
        process.exit(1);
      }
      
      // Read template and write to user's docs
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      await fs.writeFile(outputPath, templateContent, 'utf-8');
      
      console.log(chalk.green(`✅ Spec Test document created: ${outputPath}`));
    } catch (error) {
      console.error(chalk.red('Error generating Spec Test:'), error.message);
      process.exit(1);
    }
  });

// Command 4: /implement-code - Load DESIGN.md and generate AI prompt
program
  .command('/implement-code <featureName>')
  .description('Load DESIGN.md and generate AI implementation prompt')
  .action(async (featureName) => {
    try {
      const designPath = path.join(DOCS_DIR, `${featureName}-DESIGN.md`);
      
      // Check if DESIGN.md exists
      if (!(await fs.pathExists(designPath))) {
        console.error(chalk.red('Error: File DESIGN.md wajib ada sebagai acuan visual!'));
        console.error(chalk.yellow(`Expected path: ${designPath}`));
        process.exit(1);
      }
      
      // Read DESIGN.md content
      const designContent = await fs.readFile(designPath, 'utf-8');
      
      // Generate and display the AI prompt
      console.log(chalk.bold('\n🎨 DESIGN TOKENS LOADED! Silakan jalankan AI Agent (Windsurf Cascade / Claude / OpenCode) dengan prompt berikut:\n'));
      console.log(chalk.bold.white('\'Woi AI, gunakan token visual, warna, dan layout dari DESIGN.md berikut sebagai standar wajib:'));
      console.log(chalk.bold.cyan('\n' + designContent));
      console.log(chalk.bold.white('\nSekarang, silakan kamu baca secara MANUAL file `./docs/' + featureName + '-BRD.md` dan `./docs/' + featureName + '-TECHNICAL_DESIGN.md`. Implementasikan FULL SLICE CODE PRODUCTION (Database, API, Frontend UI Component dengan reactive state, dan SEO Metadata sekaligus) mengikuti alur bisnis dan teknis dari kedua file tersebut!\'\n'));
      
    } catch (error) {
      console.error(chalk.red('Error loading DESIGN.md:'), error.message);
      process.exit(1);
    }
  });

// Command 5: /qa-test-script - Generate Playwright test script from SPEC_TEST
program
  .command('/qa-test-script <featureName>')
  .description('Generate Playwright test script from SPEC_TEST document')
  .action(async (featureName) => {
    try {
      await ensureDirectories();
      
      const specTestPath = path.join(DOCS_DIR, `${featureName}-SPEC_TEST.md`);
      const testScriptPath = path.join(TESTS_DIR, `${featureName}.spec.js`);
      
      // Check if SPEC_TEST.md exists
      if (!(await fs.pathExists(specTestPath))) {
        console.error(chalk.red(`Error: ${featureName}-SPEC_TEST.md not found in docs directory`));
        process.exit(1);
      }
      
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
      
      const templatePath = path.join(TEMPLATES_DIR, 'qa-report-template.md');
      const outputPath = path.join(DOCS_DIR, `${featureName}-REPORT.md`);
      
      // Check if template exists
      if (!(await fs.pathExists(templatePath))) {
        console.error(chalk.red('Error: qa-report-template.md not found in CLI templates directory'));
        process.exit(1);
      }
      
      // Read template and write to user's docs
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      await fs.writeFile(outputPath, templateContent, 'utf-8');
      
      console.log(chalk.green(`✅ QA Report document created: ${outputPath}`));
    } catch (error) {
      console.error(chalk.red('Error generating QA Report:'), error.message);
      process.exit(1);
    }
  });

// Command 8: /init - Generate all documentation at once
program
  .command('/init <featureName>')
  .description('Generate all documentation (BRD, Technical, Spec Test, QA Report) at once')
  .action(async (featureName) => {
    try {
      await ensureDirectories();
      
      console.log(chalk.bold.cyan(`\n🚀 Initializing documentation for: ${featureName}\n`));
      
      const templates = [
        { name: 'BRD', template: 'brd-template.md', output: `${featureName}-BRD.md` },
        { name: 'Technical Design', template: 'technical-template.md', output: `${featureName}-TECHNICAL_DESIGN.md` },
        { name: 'Spec Test', template: 'spec-test-template.md', output: `${featureName}-SPEC_TEST.md` },
        { name: 'QA Report', template: 'qa-report-template.md', output: `${featureName}-REPORT.md` }
      ];
      
      for (const doc of templates) {
        const templatePath = path.join(TEMPLATES_DIR, doc.template);
        const outputPath = path.join(DOCS_DIR, doc.output);
        
        if (!(await fs.pathExists(templatePath))) {
          console.error(chalk.red(`❌ Error: ${doc.template} not found in CLI templates directory`));
          continue;
        }
        
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        await fs.writeFile(outputPath, templateContent, 'utf-8');
        
        console.log(chalk.green(`✅ ${doc.name} created: ${outputPath}`));
      }
      
      console.log(chalk.bold.cyan(`\n📝 Documentation initialized! Next steps:\n`));
      console.log(chalk.yellow(`1. Fill in the generated documents in docs/ folder`));
      console.log(chalk.yellow(`2. Create docs/${featureName}-DESIGN.md with visual specifications`));
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
