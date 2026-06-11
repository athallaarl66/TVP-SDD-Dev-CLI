const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { getPaths, ensureDirectories, parseUserStories } = require('../utils/file');

function registerBreakdownCommand(program) {
  program
    .command('/sdd-breakdown-task <prdFile> [featureName]')
    .description('Parse PRD and generate scenario-level documentation (prod, testing, design, tech)')
    .action(async (prdFile, featureName) => {
      try {
        const paths = getPaths();
        
        // Resolve PRD file path
        const prdPath = path.resolve(paths.PROJECT_DIR, prdFile);
        
        // Check if PRD file exists
        if (!(await fs.pathExists(prdPath))) {
          console.error(chalk.red(`Error: PRD file not found: ${prdFile}`));
          console.error(chalk.yellow(`Run 'sdd-gen /prd <featureName>' first to generate the PRD document`));
          process.exit(1);
        }
        
        // Read PRD content
        const prdContent = await fs.readFile(prdPath, 'utf-8');
        
        // Extract feature name from PRD if not provided
        if (!featureName) {
          // Try to extract feature name from PRD filename
          const prdFileName = path.basename(prdFile, '.md');
          featureName = prdFileName.replace('-PRD', '').replace('-prd', '');
          console.log(chalk.yellow(`No feature name provided, using extracted name: ${featureName}`));
        }
        
        // Parse user stories from PRD
        const userStories = parseUserStories(prdContent);
        
        if (userStories.length === 0) {
          console.error(chalk.yellow('Warning: No user stories found in PRD'));
          console.log(chalk.yellow('Make sure your PRD has a "User Stories" section with user story format'));
          console.log(chalk.yellow('Continuing without generating breakdown files...'));
          return;
        }
        
        // Create output directory in docs/production/
        const outputDir = path.join(paths.DOCS_PRODUCTION_DIR, featureName);
        await fs.ensureDir(outputDir);
        
        console.log(chalk.bold.cyan(`\n🚀 Breaking down PRD for: ${featureName}\n`));
        console.log(chalk.yellow(`Found ${userStories.length} user stories\n`));
        
        // Generate files for each user acceptance
        for (let i = 0; i < userStories.length; i++) {
          const num = String(i + 1).padStart(2, '0');
          const story = userStories[i];
          
          console.log(chalk.cyan(`Processing user acceptance ${num}: ${story.title}`));
          
          // Generate prod.md
          const prodTemplatePath = path.join(paths.TEMPLATES_DIR, 'prod-template.md');
          if (await fs.pathExists(prodTemplatePath)) {
            const prodTemplate = await fs.readFile(prodTemplatePath, 'utf-8');
            const prodContent = prodTemplate.replace(/<Feature><num>/g, `${featureName}${num}`);
            const prodPath = path.join(outputDir, `${featureName}${num}-prod.md`);
            await fs.writeFile(prodPath, prodContent, 'utf-8');
            console.log(chalk.green(`  ✅ Created: ${featureName}${num}-prod.md`));
          }
          
          // Generate testing.md
          const testingTemplatePath = path.join(paths.TEMPLATES_DIR, 'testing-template.md');
          if (await fs.pathExists(testingTemplatePath)) {
            const testingTemplate = await fs.readFile(testingTemplatePath, 'utf-8');
            const testingContent = testingTemplate.replace(/<Feature><num>/g, `${featureName}${num}`);
            const testingPath = path.join(outputDir, `${featureName}${num}-testing.md`);
            await fs.writeFile(testingPath, testingContent, 'utf-8');
            console.log(chalk.green(`  ✅ Created: ${featureName}${num}-testing.md`));
          }
          
          // Generate design.md
          const designTemplatePath = path.join(paths.TEMPLATES_DIR, 'design-template.md');
          if (await fs.pathExists(designTemplatePath)) {
            const designTemplate = await fs.readFile(designTemplatePath, 'utf-8');
            const designContent = designTemplate.replace(/<Feature><num>/g, `${featureName}${num}`);
            const designPath = path.join(outputDir, `${featureName}${num}-design.md`);
            await fs.writeFile(designPath, designContent, 'utf-8');
            console.log(chalk.green(`  ✅ Created: ${featureName}${num}-design.md`));
          }
          
          // Generate tech.md
          const techTemplatePath = path.join(paths.TEMPLATES_DIR, 'tech-template.md');
          if (await fs.pathExists(techTemplatePath)) {
            const techTemplate = await fs.readFile(techTemplatePath, 'utf-8');
            const techContent = techTemplate.replace(/<Feature><num>/g, `${featureName}${num}`);
            const techPath = path.join(outputDir, `${featureName}${num}-tech.md`);
            await fs.writeFile(techPath, techContent, 'utf-8');
            console.log(chalk.green(`  ✅ Created: ${featureName}${num}-tech.md`));
          }
        }
        
        console.log(chalk.bold.cyan(`\n📝 Breakdown complete! Files generated in: ${outputDir}\n`));
        console.log(chalk.yellow(`Next steps:\n`));
        console.log(chalk.yellow(`1. Fill in the generated breakdown files with scenario-specific details`));
        console.log(chalk.yellow(`2. Run: sdd-gen /implement-code ${featureName} <num>\n`));
        
      } catch (error) {
        console.error(chalk.red('Error generating breakdown files:'), error.message);
        process.exit(1);
      }
    });
}

module.exports = { registerBreakdownCommand };
