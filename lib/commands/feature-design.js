const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { getPaths, ensureDirectories } = require('../utils/file');
const { resolveFeatureName, offerNextSteps, doneStep } = require('../utils/prompt');
const { writeConfig } = require('../utils/config');

function registerFeatureDesignCommand(program, getOpts) {
  program
    .command('/feature-design [featureName]')
    .description('Generate feature-level design documentation ({featureName}-DESIGN.md)')
    .action(async (featureName) => {
      try {
        const opts = getOpts();
        const paths = getPaths();
        featureName = await resolveFeatureName(featureName, {
          yes: opts.yes,
          paths,
          message: 'Enter feature name:',
          usage: 'sdd-gen /feature-design <featureName>'
        });
        writeConfig({ lastFeature: featureName }, paths.PROJECT_DIR);
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
        
        // Generate design.md to docs/features/{featureName}-design.md
        const outputPath = path.join(paths.DOCS_FEATURES_DIR, `${featureName}-design.md`);
        await fs.writeFile(outputPath, templateContent, 'utf-8');
        console.log(chalk.green(`✅ Feature Design document created: ${outputPath}`));
        
        console.log(chalk.bold.cyan(`\n📝 Next steps:\n`));
        console.log(chalk.yellow(`1. Fill in the feature design documentation in ${outputPath}`));
        console.log(chalk.yellow(`2. Add ASCII wireframe diagrams for each screen`));
        console.log(chalk.yellow(`3. Define component hierarchy and design specifications`));
        console.log(chalk.yellow(`4. Reference global design system in docs/DESIGN.md\n`));

        await offerNextSteps([
          {
            label: '🧪 Generate QA Test Script',
            value: 'qa-test-script',
            cmd: `sdd-gen /qa-test-script ${featureName}`
          },
          {
            label: '📝 Generate QA Report',
            value: 'qa-report',
            cmd: `sdd-gen /qa-report ${featureName}`
          },
          doneStep()
        ], opts.yes);
        
      } catch (error) {
        console.error(chalk.red('Error generating Feature Design:'), error.message);
        process.exit(1);
      }
    });
}

module.exports = { registerFeatureDesignCommand };
