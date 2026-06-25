const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { getPaths, ensureDirectories } = require('../utils/file');
const { getExistingAIDirectories } = require('../ai-tools');

function registerPrdCommand(program) {
  program
    .command('/prd <featureName>')
    .description('Generate PRD document from template')
    .action(async (featureName) => {
      try {
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
        
        // Generate PRD to docs/features/{featureName}-prd.md
        const outputPath = path.join(paths.DOCS_FEATURES_DIR, `${featureName}-prd.md`);
        await fs.writeFile(outputPath, templateContent, 'utf-8');
        console.log(chalk.green(`✅ PRD document created: ${outputPath}`));
      } catch (error) {
        console.error(chalk.red('Error generating PRD:'), error.message);
        process.exit(1);
      }
    });
}

module.exports = { registerPrdCommand };
