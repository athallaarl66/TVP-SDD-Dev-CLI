const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { getPaths, ensureDirectories, fillDocTemplate } = require('../utils/file');
const { getExistingAIDirectories } = require('../ai-tools');
const { promptOrFail, offerNextSteps, doneStep } = require('../utils/prompt');

function registerPrdCommand(program) {
  program
    .command('/prd [featureName]')
    .description('Generate PRD document from template')
    .action(async (featureName) => {
      try {
        featureName = await promptOrFail(featureName, 'Enter feature name:', 'sdd-gen /prd <featureName>');
        const paths = getPaths();
        await ensureDirectories(paths);
        
        const templatePath = path.join(paths.TEMPLATES_DIR, 'prd-template.md');
        
        // Check if template exists
        if (!(await fs.pathExists(templatePath))) {
          console.error(chalk.red('Error: prd-template.md not found in CLI templates directory'));
          process.exit(1);
        }
        
        // Read template once
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        
        // Fill template with feature name, project name, and dates
        const prdContent = await fillDocTemplate(templateContent, featureName, paths.PROJECT_DIR);
        
        // Generate PRD to docs/features/{featureName}-prd.md
        const outputPath = path.join(paths.DOCS_FEATURES_DIR, `${featureName}-prd.md`);
        await fs.writeFile(outputPath, prdContent, 'utf-8');
        console.log(chalk.green(`✅ PRD document created: ${outputPath}`));

        await offerNextSteps([
          {
            label: '📄 Generate Technical Design',
            value: 'technical',
            cmd: `sdd-gen /technical ${featureName}`
          },
          {
            label: '📑 Breakdown PRD to scenarios',
            value: 'breakdown',
            cmd: `sdd-gen /breakdown-task docs/features/${featureName}-prd.md ${featureName}`
          },
          doneStep()
        ]);
      } catch (error) {
        console.error(chalk.red('Error generating PRD:'), error.message);
        process.exit(1);
      }
    });
}

module.exports = { registerPrdCommand };
