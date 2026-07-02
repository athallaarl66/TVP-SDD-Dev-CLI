const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { getPaths } = require('../utils/file');
const { generateSkillContent } = require('../utils/template');
const { ensureAIDirectories } = require('../ai-tools');

function registerImplementCodeCommand(program) {
  program
    .command('/implement-code <featureName> <slug>')
    .description('Generate skill.md with role prompts and trigger implementation using breakdown files')
    .action(async (featureName, slug) => {
      try {
        const paths = getPaths();
        
        // Check for breakdown files in docs/production/
        const breakdownDir = path.join(paths.DOCS_PRODUCTION_DIR, featureName);
        const prodFile = path.join(breakdownDir, `${featureName}-${slug}-prod.md`);
        const techFile = path.join(breakdownDir, `${featureName}-${slug}-tech.md`);
        const designFile = path.join(breakdownDir, `${featureName}-${slug}-design.md`);
        const testingFile = path.join(breakdownDir, `${featureName}-${slug}-testing.md`);
        
        // Check required breakdown files
        if (!(await fs.pathExists(prodFile))) {
          console.error(chalk.red(`Error: Breakdown file not found: ${prodFile}`));
          console.error(chalk.yellow(`Run 'sdd-gen /sdd-breakdown-task <prd-file> ${featureName}' first to generate breakdown files`));
          console.error(chalk.yellow(`Available breakdown files in ${breakdownDir}:`));
          const files = await fs.readdir(breakdownDir);
          const breakdownFiles = files.filter(f => f.endsWith('-prod.md'));
          breakdownFiles.forEach(f => console.log(chalk.gray(`  - ${f}`)));
          process.exit(1);
        }
        
        if (!(await fs.pathExists(techFile))) {
          console.error(chalk.red(`Error: Breakdown file not found: ${techFile}`));
          console.error(chalk.yellow(`Run 'sdd-gen /sdd-breakdown-task <prd-file> ${featureName}' first to generate breakdown files`));
          process.exit(1);
        }
        
        console.log(chalk.bold.cyan(`\n🚀 Implementing: ${featureName} - ${slug}\n`));
        console.log(chalk.yellow(`Found breakdown files in: ${breakdownDir}\n`));
        
        // Try to find DESIGN.md (optional)
        let designPath = null;
        
        // 1. Check for generic DESIGN.md in docs/
        const genericDesignPath = path.join(paths.PROJECT_DIR, 'docs', 'DESIGN.md');
        if (await fs.pathExists(genericDesignPath)) {
          designPath = genericDesignPath;
        }
        
        // 2. Check for feature-specific design.md in docs/features/
        if (!designPath) {
          const featureDesignPath = path.join(paths.DOCS_FEATURES_DIR, `${featureName}-design.md`);
          if (await fs.pathExists(featureDesignPath)) {
            designPath = featureDesignPath;
          }
        }
        
        // 3. Check docs/features/ folder (nested)
        if (!designPath) {
          const featureDirDesignPath = path.join(paths.DOCS_FEATURES_DIR, featureName, 'design.md');
          if (await fs.pathExists(featureDirDesignPath)) {
            designPath = featureDirDesignPath;
          }
        }
        
        if (designPath) {
          console.log(chalk.green(`✅ Found DESIGN.md: ${designPath}`));
        } else {
          console.log(chalk.yellow(`⚠️  DESIGN.md not found (optional - proceeding without visual tokens)`));
        }
        
        // Generate skill.md file to docs/production/{featureName}/
        const skillContent = generateSkillContent(featureName, slug, prodFile, techFile, designFile, testingFile, designPath);
        const skillPath = path.join(breakdownDir, `${featureName}-${slug}-skill.md`);
        await fs.writeFile(skillPath, skillContent, 'utf-8');
        console.log(chalk.green(`✅ Skill file created: ${skillPath}`));
        
        console.log(chalk.bold.cyan(`\n📝 Skill file generated!\n`));
        console.log(chalk.yellow(`Skill file location: ${skillPath}\n`));
        
      } catch (error) {
        console.error(chalk.red('Error generating skill file:'), error.message);
        process.exit(1);
      }
    });
}

module.exports = { registerImplementCodeCommand };
