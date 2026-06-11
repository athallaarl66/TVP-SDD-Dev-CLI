const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { getPaths } = require('../utils/file');
const { generateSkillContent } = require('../utils/template');
const { ensureAIDirectories } = require('../ai-tools');

function registerImplementCodeCommand(program) {
  program
    .command('/implement-code <featureName> <num>')
    .description('Generate skill.md with role prompts and trigger implementation using breakdown files')
    .action(async (featureName, num) => {
      try {
        const paths = getPaths();
        
        // Format num with leading zero if needed
        const formattedNum = String(num).padStart(2, '0');
        
        // Check for breakdown files in docs/production/
        const breakdownDir = path.join(paths.DOCS_PRODUCTION_DIR, featureName);
        const prodFile = path.join(breakdownDir, `${featureName}${formattedNum}-prod.md`);
        const techFile = path.join(breakdownDir, `${featureName}${formattedNum}-tech.md`);
        const designFile = path.join(breakdownDir, `${featureName}${formattedNum}-design.md`);
        const testingFile = path.join(breakdownDir, `${featureName}${formattedNum}-testing.md`);
        
        // Check required breakdown files
        if (!(await fs.pathExists(prodFile))) {
          console.error(chalk.red(`Error: Breakdown file not found: ${prodFile}`));
          console.error(chalk.yellow(`Run 'sdd-gen /sdd-breakdown-task <prd-file> ${featureName}' first to generate breakdown files`));
          process.exit(1);
        }
        
        if (!(await fs.pathExists(techFile))) {
          console.error(chalk.red(`Error: Breakdown file not found: ${techFile}`));
          console.error(chalk.yellow(`Run 'sdd-gen /sdd-breakdown-task <prd-file> ${featureName}' first to generate breakdown files`));
          process.exit(1);
        }
        
        console.log(chalk.bold.cyan(`\n🚀 Implementing: ${featureName}${formattedNum}\n`));
        console.log(chalk.yellow(`Found breakdown files in: ${breakdownDir}\n`));
        
        // Try to find DESIGN.md (optional)
        let designPath = null;
        let designLocation = '';
        
        // 1. Check for generic DESIGN.md in docs/
        const genericDesignPath = path.join(paths.PROJECT_DIR, 'docs', 'DESIGN.md');
        if (await fs.pathExists(genericDesignPath)) {
          designPath = genericDesignPath;
          designLocation = 'docs';
        }
        
        // 2. Check for feature-specific DESIGN.md in docs/
        if (!designPath) {
          const featureDesignPath = path.join(paths.PROJECT_DIR, 'docs', `${featureName}-DESIGN.md`);
          if (await fs.pathExists(featureDesignPath)) {
            designPath = featureDesignPath;
            designLocation = 'docs';
          }
        }
        
        // 3. Check AI tool skills folders
        if (!designPath) {
          let existingDirs = await ensureAIDirectories();
          
          for (const aiDir of existingDirs) {
            const potentialPath = path.join(paths.PROJECT_DIR, aiDir, 'skills', `${featureName}-DESIGN.md`);
            if (await fs.pathExists(potentialPath)) {
              designPath = potentialPath;
              designLocation = `${aiDir}/skills`;
              break;
            }
          }
        }
        
        if (designPath) {
          console.log(chalk.green(`✅ Found DESIGN.md: ${designPath}`));
        } else {
          console.log(chalk.yellow(`⚠️  DESIGN.md not found (optional - proceeding without visual tokens)`));
        }
        
        // Generate skill.md file
        let existingDirs = await ensureAIDirectories();
        
        const skillContent = generateSkillContent(featureName, formattedNum, prodFile, techFile, designFile, testingFile, designPath);
        
        // Write skill.md to AI tool skills folders
        for (const aiDir of existingDirs) {
          const skillsPath = path.join(paths.PROJECT_DIR, aiDir, 'skills');
          await fs.ensureDir(skillsPath);
          const skillPath = path.join(skillsPath, `${featureName}${formattedNum}-skill.md`);
          await fs.writeFile(skillPath, skillContent, 'utf-8');
          console.log(chalk.green(`✅ Skill file created: ${skillPath}`));
        }
        
        console.log(chalk.bold.cyan(`\n📝 Skill file generated! Implementation triggered.\n`));
        console.log(chalk.yellow(`The AI agent can now invoke the skill file to implement ${featureName}${formattedNum}.\n`));
        
      } catch (error) {
        console.error(chalk.red('Error generating skill file:'), error.message);
        process.exit(1);
      }
    });
}

module.exports = { registerImplementCodeCommand };
