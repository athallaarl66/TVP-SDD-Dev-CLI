const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { getPaths, ensureDirectories } = require('../utils/file');

function registerInitCommand(program) {
  program
    .command('/init <featureName>')
    .description('Generate all documentation (PRD, Technical, Spec Test, QA Report) at once')
    .action(async (featureName) => {
      try {
        const paths = getPaths();
        await ensureDirectories(paths);
        
        console.log(chalk.bold.cyan(`\n🚀 Initializing documentation for: ${featureName}\n`));
        
        const templates = [
          { name: 'PRD', template: 'prd-template.md', docsOutput: 'prd.md', docsDir: 'features' },
          { name: 'Technical Design', template: 'technical-template.md', docsOutput: 'technical.md', docsDir: 'features' },
          { name: 'Spec Test', template: 'spec-test-template.md', docsOutput: `${featureName}-spec-test.md`, docsDir: 'test-reports' },
          { name: 'QA Report', template: 'qa-report-template.md', docsOutput: `${featureName}-qa-report.md`, docsDir: 'test-reports' }
        ];
        
        for (const doc of templates) {
          const templatePath = path.join(paths.TEMPLATES_DIR, doc.template);
          
          if (!(await fs.pathExists(templatePath))) {
            console.error(chalk.red(`❌ Error: ${doc.template} not found in CLI templates directory`));
            continue;
          }
          
          // Read template once
          const templateContent = await fs.readFile(templatePath, 'utf-8');
          
          // Generate to docs folder
          if (doc.docsDir === 'test-reports') {
            const testReportDir = path.join(paths.DOCS_TEST_REPORTS_DIR, featureName);
            await fs.ensureDir(testReportDir);
            const docsOutputPath = path.join(testReportDir, doc.docsOutput);
            await fs.writeFile(docsOutputPath, templateContent, 'utf-8');
            console.log(chalk.green(`✅ ${doc.name} created: ${docsOutputPath}`));
          } else {
            // Generate to docs/features/{featureName}-{doc.docsOutput}.md
            const docsOutputPath = path.join(paths.DOCS_FEATURES_DIR, `${featureName}-${doc.docsOutput}.md`);
            await fs.writeFile(docsOutputPath, templateContent, 'utf-8');
            console.log(chalk.green(`✅ ${doc.name} created: ${docsOutputPath}`));
          }
        }
        
        console.log(chalk.bold.cyan(`\n📝 Documentation initialized! Next steps:\n`));
        console.log(chalk.yellow(`1. Fill in the generated documents in docs/features/ and docs/test-reports/ folders`));
        console.log(chalk.yellow(`2. Run: sdd-gen /feature-design ${featureName} to create feature-level design`));
        console.log(chalk.yellow(`3. Run: sdd-gen /implement-code ${featureName}`));
        console.log(chalk.yellow(`4. Run: sdd-gen /qa-test-script ${featureName}`));
        console.log(chalk.yellow(`5. Run: sdd-gen /qa-test-run ${featureName}\n`));
        
      } catch (error) {
        console.error(chalk.red('Error initializing documentation:'), error.message);
        process.exit(1);
      }
    });
}

module.exports = { registerInitCommand };
