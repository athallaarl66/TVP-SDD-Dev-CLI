const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { getPaths, ensureDirectories } = require('../utils/file');
const { ensureAIDirectories } = require('../ai-tools');

function registerSpecTestCommand(program) {
  program
    .command('/spec-test <featureName>')
    .description('Generate Spec Test document from template')
    .action(async (featureName) => {
      try {
        const paths = getPaths();
        await ensureDirectories(paths);
        
        let existingDirs = await ensureAIDirectories();
        
        const templatePath = path.join(paths.TEMPLATES_DIR, 'spec-test-template.md');
        
        // Check if template exists
        if (!(await fs.pathExists(templatePath))) {
          console.error(chalk.red('Error: spec-test-template.md not found in CLI templates directory'));
          process.exit(1);
        }
        
        // Read template once
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        
        // Generate to existing AI tool workflows folders
        for (const aiDir of existingDirs) {
          const workflowsPath = path.join(paths.PROJECT_DIR, aiDir, 'workflows');
          await fs.ensureDir(workflowsPath);
          const outputPath = path.join(workflowsPath, `${featureName}-SPEC_TEST.md`);
          await fs.writeFile(outputPath, templateContent, 'utf-8');
          console.log(chalk.green(`✅ Spec Test document created: ${outputPath}`));
        }
      } catch (error) {
        console.error(chalk.red('Error generating Spec Test:'), error.message);
        process.exit(1);
      }
    });
}

module.exports = { registerSpecTestCommand };
