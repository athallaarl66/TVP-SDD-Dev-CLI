const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { getPaths, ensureDirectories } = require('../utils/file');
const { ensureAIDirectories } = require('../ai-tools');

function registerInitCommand(program) {
  program
    .command('/init <featureName>')
    .description('Generate all documentation (PRD, Technical, Spec Test, QA Report) at once')
    .action(async (featureName) => {
      try {
        const paths = getPaths();
        await ensureDirectories(paths);
        
        let existingDirs = await ensureAIDirectories();
        
        console.log(chalk.bold.cyan(`\n🚀 Initializing documentation for: ${featureName}\n`));
        console.log(chalk.yellow(`Found AI tool folders: ${existingDirs.join(', ')}\n`));
        
        const templates = [
          { name: 'PRD', template: 'prd-template.md', output: `${featureName}-PRD.md`, subdir: 'skills' },
          { name: 'Technical Design', template: 'technical-template.md', output: `${featureName}-TECHNICAL_DESIGN.md`, subdir: 'skills' },
          { name: 'Spec Test', template: 'spec-test-template.md', output: `${featureName}-SPEC_TEST.md`, subdir: 'workflows' },
          { name: 'QA Report', template: 'qa-report-template.md', output: `${featureName}-REPORT.md`, subdir: 'workflows' }
        ];
        
        for (const doc of templates) {
          const templatePath = path.join(paths.TEMPLATES_DIR, doc.template);
          
          if (!(await fs.pathExists(templatePath))) {
            console.error(chalk.red(`❌ Error: ${doc.template} not found in CLI templates directory`));
            continue;
          }
          
          // Read template once
          const templateContent = await fs.readFile(templatePath, 'utf-8');
          
          // Generate to existing AI tool folders
          for (const aiDir of existingDirs) {
            const subdirPath = path.join(paths.PROJECT_DIR, aiDir, doc.subdir);
            await fs.ensureDir(subdirPath);
            const outputPath = path.join(subdirPath, doc.output);
            await fs.writeFile(outputPath, templateContent, 'utf-8');
            console.log(chalk.green(`✅ ${doc.name} created: ${outputPath}`));
          }
        }
        
        console.log(chalk.bold.cyan(`\n📝 Documentation initialized! Next steps:\n`));
        if (existingDirs.length > 0) {
          console.log(chalk.yellow(`1. Fill in the generated documents in ${existingDirs[0]}/skills/ and ${existingDirs[0]}/workflows/ folders`));
          console.log(chalk.yellow(`2. Create ${existingDirs[0]}/skills/${featureName}-DESIGN.md with visual specifications`));
        }
        console.log(chalk.yellow(`3. Run: sdd-gen /implement-code ${featureName}`));
        console.log(chalk.yellow(`4. Run: sdd-gen /qa-test-script ${featureName}`));
        console.log(chalk.yellow(`5. Run: sdd-gen /qa-test-run ${featureName}\n`));
        
      } catch (error) {
        console.error(chalk.red('Error initializing documentation:'), error.message);
        process.exit(1);
      }
    });
}

module.exports = { registerInitCommand };
