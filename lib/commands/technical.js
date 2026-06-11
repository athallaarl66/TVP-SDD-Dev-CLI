const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { getPaths, ensureDirectories } = require('../utils/file');
const { ensureAIDirectories } = require('../ai-tools');

function registerTechnicalCommand(program) {
  program
    .command('/technical <featureName>')
    .description('Generate Technical Design document from template')
    .action(async (featureName) => {
      try {
        const paths = getPaths();
        await ensureDirectories(paths);
        
        let existingDirs = await ensureAIDirectories();
        
        const templatePath = path.join(paths.TEMPLATES_DIR, 'technical-template.md');
        
        // Check if template exists
        if (!(await fs.pathExists(templatePath))) {
          console.error(chalk.red('Error: technical-template.md not found in CLI templates directory'));
          process.exit(1);
        }
        
        // Read template once
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        
        // Generate to existing AI tool skills folders
        for (const aiDir of existingDirs) {
          const skillsPath = path.join(paths.PROJECT_DIR, aiDir, 'skills');
          await fs.ensureDir(skillsPath);
          const outputPath = path.join(skillsPath, `${featureName}-TECHNICAL_DESIGN.md`);
          await fs.writeFile(outputPath, templateContent, 'utf-8');
          console.log(chalk.green(`✅ Technical Design document created: ${outputPath}`));
        }
      } catch (error) {
        console.error(chalk.red('Error generating Technical Design:'), error.message);
        process.exit(1);
      }
    });
}

module.exports = { registerTechnicalCommand };
