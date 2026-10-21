const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { getPaths, ensureDirectories, fillDocTemplate, writeGeneratedFile } = require('../utils/file');
const { resolveFeatureName, offerNextSteps, doneStep } = require('../utils/prompt');
const { writeConfig } = require('../utils/config');

function registerTechnicalCommand(program, getOpts) {
  program
    .command('/technical [featureName]')
    .description('Generate Technical Design document from template')
    .action(async (featureName) => {
      try {
        const opts = getOpts();
        const paths = getPaths();
        featureName = await resolveFeatureName(featureName, {
          yes: opts.yes,
          paths,
          message: 'Enter feature name:',
          usage: 'sdd-gen /technical <featureName>'
        });
        writeConfig({ lastFeature: featureName }, paths.PROJECT_DIR);
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
        const replaced = await writeGeneratedFile(docsOutputPath, techContent, {
          rootDir: paths.DOCS_FEATURES_DIR,
          force: Boolean(opts.force),
          label: 'Technical Design document'
        });
        console.log(chalk.green(`✅ Technical Design document ${replaced ? 'replaced' : 'created'}: ${docsOutputPath}`));

        await offerNextSteps([
          {
            label: '📑 Breakdown PRD to scenarios',
            value: 'breakdown',
            args: ['/breakdown-task', `docs/features/${featureName}-prd.md`, featureName]
          },
          {
            label: '🎨 Generate Feature Design',
            value: 'feature-design',
            args: ['/feature-design', featureName]
          },
          doneStep()
        ], opts.yes);
      } catch (error) {
        console.error(chalk.red('Error generating Technical Design:'), error.message);
        process.exit(1);
      }
    });
}

module.exports = { registerTechnicalCommand };
