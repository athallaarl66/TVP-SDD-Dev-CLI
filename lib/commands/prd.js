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
        
        // Create feature directory in docs/features/
        const featureDir = path.join(paths.DOCS_FEATURES_DIR, featureName);
        await fs.ensureDir(featureDir);
        
        // Generate PRD to docs/features/{featureName}/prd.md
        const outputPath = path.join(featureDir, 'prd.md');
        await fs.writeFile(outputPath, templateContent, 'utf-8');
        console.log(chalk.green(`✅ PRD document created: ${outputPath}`));
        
        // Also generate to AI tool skills folders if they exist
        let existingDirs = await getExistingAIDirectories();
        for (const aiDir of existingDirs) {
          const skillsPath = path.join(paths.PROJECT_DIR, aiDir, 'skills');
          await fs.ensureDir(skillsPath);
          const aiOutputPath = path.join(skillsPath, `${featureName}-PRD.md`);
          await fs.writeFile(aiOutputPath, templateContent, 'utf-8');
          console.log(chalk.green(`✅ PRD also copied to: ${aiOutputPath}`));
        }
      } catch (error) {
        console.error(chalk.red('Error generating PRD:'), error.message);
        process.exit(1);
      }
    });
}

module.exports = { registerPrdCommand };
