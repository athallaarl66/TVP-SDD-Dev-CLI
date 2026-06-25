const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { getPaths, ensureDirectories } = require('../utils/file');

function registerTechnicalCommand(program) {
  program
    .command('/technical <featureName>')
    .description('Generate Technical Design document from template')
    .action(async (featureName) => {
      try {
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
        
        // Generate to docs/features/{featureName}-technical.md
        const docsOutputPath = path.join(paths.DOCS_FEATURES_DIR, `${featureName}-technical.md`);
        await fs.writeFile(docsOutputPath, templateContent, 'utf-8');
        console.log(chalk.green(`✅ Technical Design document created: ${docsOutputPath}`));
      } catch (error) {
        console.error(chalk.red('Error generating Technical Design:'), error.message);
        process.exit(1);
      }
    });
}

module.exports = { registerTechnicalCommand };
