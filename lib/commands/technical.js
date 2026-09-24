const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { getPaths, ensureDirectories, fillDocTemplate } = require('../utils/file');
const { promptOrFail, offerNextSteps, doneStep } = require('../utils/prompt');

function registerTechnicalCommand(program) {
  program
    .command('/technical [featureName]')
    .description('Generate Technical Design document from template')
    .action(async (featureName) => {
      try {
        featureName = await promptOrFail(featureName, 'Enter feature name:', 'sdd-gen /technical <featureName>');
        const paths = getPaths();
        await ensureDirectories(paths);
        
        const templatePath = path.join(paths.TEMPLATES_DIR, 'technical-template.md');
        
        // Check if template exists
        if (!(await fs.pathExists(templatePath))) {
          console.error(chalk.red('Error: technical-template.md not found in CLI templates directory'));
          process.exit(1);
        }
        
        // Read template once
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        
        // Fill template with feature name, project name, and dates
        const techContent = await fillDocTemplate(templateContent, featureName, paths.PROJECT_DIR);
        
        // Generate to docs/features/{featureName}-technical.md
        const docsOutputPath = path.join(paths.DOCS_FEATURES_DIR, `${featureName}-technical.md`);
        await fs.writeFile(docsOutputPath, techContent, 'utf-8');
        console.log(chalk.green(`✅ Technical Design document created: ${docsOutputPath}`));

        await offerNextSteps([
          {
            label: '📑 Breakdown PRD to scenarios',
            value: 'breakdown',
            cmd: `sdd-gen /breakdown-task docs/features/${featureName}-prd.md ${featureName}`
          },
          {
            label: '🎨 Generate Feature Design',
            value: 'feature-design',
            cmd: `sdd-gen /feature-design ${featureName}`
          },
          doneStep()
        ]);
      } catch (error) {
        console.error(chalk.red('Error generating Technical Design:'), error.message);
        process.exit(1);
      }
    });
}

module.exports = { registerTechnicalCommand };
