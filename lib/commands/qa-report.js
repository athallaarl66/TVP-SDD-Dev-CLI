const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { getPaths, ensureDirectories } = require('../utils/file');
const { getExistingAIDirectories } = require('../ai-tools');

function registerQAReportCommand(program) {
  program
    .command('/qa-report <featureName>')
    .description('Generate QA Report document from template')
    .action(async (featureName) => {
      try {
        const paths = getPaths();
        await ensureDirectories(paths);
        
        const templatePath = path.join(paths.TEMPLATES_DIR, 'qa-report-template.md');
        
        // Check if template exists
        if (!(await fs.pathExists(templatePath))) {
          console.error(chalk.red('Error: qa-report-template.md not found in CLI templates directory'));
          process.exit(1);
        }
        
        // Read template once
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        
        // Create feature directory in docs/test-reports/
        const testReportDir = path.join(paths.DOCS_TEST_REPORTS_DIR, featureName);
        await fs.ensureDir(testReportDir);
        
        // Generate QA Report to docs/test-reports/{featureName}/{featureName}-qa-report.md
        const outputPath = path.join(testReportDir, `${featureName}-qa-report.md`);
        await fs.writeFile(outputPath, templateContent, 'utf-8');
        console.log(chalk.green(`✅ QA Report document created: ${outputPath}`));
      } catch (error) {
        console.error(chalk.red('Error generating QA Report:'), error.message);
        process.exit(1);
      }
    });
}

module.exports = { registerQAReportCommand };
