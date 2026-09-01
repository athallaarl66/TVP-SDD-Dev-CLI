const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { getPaths, ensureDirectories } = require('../utils/file');

function registerDesignSystemCommand(program) {
  program
    .command('/design-system')
    .description('Generate global Design System documentation (DESIGN.md)')
    .action(async () => {
      try {
        const paths = getPaths();
        await ensureDirectories(paths);
        
        const templatePath = path.join(paths.TEMPLATES_DIR, 'design-system-template.md');
        
        // Check if template exists
        if (!(await fs.pathExists(templatePath))) {
          console.error(chalk.red('Error: design-system-template.md not found in CLI templates directory'));
          process.exit(1);
        }
        
        // Read template once
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        
        // Generate DESIGN.md to docs/DESIGN.md
        const outputPath = path.join(paths.DOCS_DIR, 'DESIGN.md');
        await fs.writeFile(outputPath, templateContent, 'utf-8');
        console.log(chalk.green(`✅ Design System document created: ${outputPath}`));
        
        console.log(chalk.bold.cyan(`\n📝 Next steps:\n`));
        console.log(chalk.yellow(`1. Fill in the design system documentation in docs/DESIGN.md`));
        console.log(chalk.yellow(`2. Define your color palette, typography, spacing, and components`));
        console.log(chalk.yellow(`3. Use this as reference for feature-level designs\n`));
        
      } catch (error) {
        console.error(chalk.red('Error generating Design System:'), error.message);
        process.exit(1);
      }
    });
}

module.exports = { registerDesignSystemCommand };
