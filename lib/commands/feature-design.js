const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { getPaths, ensureDirectories } = require('../utils/file');

function registerFeatureDesignCommand(program) {
  program
    .command('/feature-design <featureName>')
    .description('Generate feature-level design documentation ({featureName}-DESIGN.md)')
    .action(async (featureName) => {
      try {
        const paths = getPaths();
        await ensureDirectories(paths);
        
        const templatePath = path.join(paths.TEMPLATES_DIR, 'feature-design-template.md');
        
        // Check if template exists
        if (!(await fs.pathExists(templatePath))) {
          console.error(chalk.red('Error: feature-design-template.md not found in CLI templates directory'));
          process.exit(1);
        }
        
        // Read template once
        let templateContent = await fs.readFile(templatePath, 'utf-8');
        
        // Replace {FeatureName} with actual feature name
        templateContent = templateContent.replace(/{FeatureName}/g, featureName);
        
        // Generate {featureName}-DESIGN.md to docs/features/{featureName}/
        const featureDir = path.join(paths.DOCS_FEATURES_DIR, featureName);
        await fs.ensureDir(featureDir);
        const outputPath = path.join(featureDir, `${featureName}-DESIGN.md`);
        await fs.writeFile(outputPath, templateContent, 'utf-8');
        console.log(chalk.green(`✅ Feature Design document created: ${outputPath}`));
        
        console.log(chalk.bold.cyan(`\n📝 Next steps:\n`));
        console.log(chalk.yellow(`1. Fill in the feature design documentation in ${outputPath}`));
        console.log(chalk.yellow(`2. Add ASCII wireframe diagrams for each screen`));
        console.log(chalk.yellow(`3. Define component hierarchy and design specifications`));
        console.log(chalk.yellow(`4. Reference global design system in docs/DESIGN.md\n`));
        
      } catch (error) {
        console.error(chalk.red('Error generating Feature Design:'), error.message);
        process.exit(1);
      }
    });
}

module.exports = { registerFeatureDesignCommand };
