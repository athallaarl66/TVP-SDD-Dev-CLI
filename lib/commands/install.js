const inquirer = require('inquirer');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const { getPaths } = require('../utils/file');
const { AI_SUBDIRS, checkAndMigrateWindsurf, getTargetDirectories } = require('../ai-tools');

function registerInstallCommand(program) {
  program
    .command('/install-all-skills')
    .description('Install all templates, skills, and workflows to AI tool folders')
    .action(async () => {
      try {
        const paths = getPaths();
        
        // Check for legacy .windsurf first
        await checkAndMigrateWindsurf();
        
        console.log(chalk.bold.cyan(`\n🎯 Select AI Tools to Install Skills\n`));

        const { selectedTools } = await inquirer.default.prompt([
          {
            type: 'checkbox',
            name: 'selectedTools',
            message: 'Which AI tools do you want to install skills to?',
            choices: [
              { name: '🌊 Devin Cascade', value: '.devin' },
              { name: '🔓 OpenCode', value: '.opencode' },
              { name: '🤖 Claude', value: '.claude' },
              { name: '🚀 Antigravity', value: '.agent' }
            ],
            default: ['.devin']
          }
        ]);

        if (selectedTools.length === 0) {
          console.log(chalk.yellow('⚠️  No AI tools selected. Exiting...\n'));
          return;
        }

        const targetTools = [...selectedTools];

        console.log(chalk.bold.cyan(`
████████╗██╗   ██╗██████╗       ███████╗██████╗ ██████╗
╚══██╔══╝██║   ██║██╔══██╗      ██╔════╝██╔══██╗██╔══██╗
   ██║   ██║   ██║██████╔╝█████╗███████╗██║  ██║██║  ██║
   ██║   ╚██╗ ██╔╝██╔═══╝ ╚════╝╚════██║██║  ██║██║  ██║
   ██║    ╚████╔╝ ██║            ███████║██████╔╝██████╔╝
   ╚═╝     ╚═══╝  ╚═╝            ╚══════╝╚═════╝ ╚═════╝

                  D E V  ·  C L I
`));
        console.log(chalk.gray(`authored by Talapvnk · version 1.3.0 · unlicensed\n`));

        // Setup folder structure dulu
        const setupSpinner = ora('Preparing folder structure...').start();
        for (const tool of targetTools) {
          const folderPath = path.join(paths.PROJECT_DIR, tool);
          await fs.ensureDir(folderPath);
          for (const subdir of AI_SUBDIRS) {
            await fs.ensureDir(path.join(folderPath, subdir));
          }
        }
        setupSpinner.succeed(`Folder structure ready for: ${targetTools.join(', ')}`);

        // Helper buat copy satu kategori (templates/skills/workflows)
        const copyCategory = async ({ label, sourceDir, targetSubdir, isFolder = false }) => {
          const items = await fs.readdir(sourceDir);
          let total = 0;

          for (const aiDir of targetTools) {
            const targetPath = path.join(paths.PROJECT_DIR, aiDir, targetSubdir);
            await fs.ensureDir(targetPath);

            for (const item of items) {
              const srcPath = path.join(sourceDir, item);
              const destPath = path.join(targetPath, item);

              // Skip if source is a directory but we're expecting files (or vice versa)
              const srcStat = await fs.stat(srcPath);
              if (isFolder && !srcStat.isDirectory()) continue;
              if (!isFolder && srcStat.isDirectory()) continue;

              const spinner = ora(`[${aiDir}] Copying ${label}: ${item}`).start();
              await fs.copy(srcPath, destPath);
              spinner.succeed(`[${aiDir}] ${item}${isFolder ? '/' : ''}`);
              total++;
            }
          }

          return total;
        };

        console.log(chalk.bold.cyan(`\nInstalling templates, skills, and workflows to AI tool folders...\n`));

        const templatesCount = await copyCategory({
          label: 'template',
          sourceDir: paths.TEMPLATES_DIR,
          targetSubdir: '_templates'
        });

        const skillsCount = await copyCategory({
          label: 'skill',
          sourceDir: paths.SKILL_TEMPLATES_DIR,
          targetSubdir: 'skills',
          isFolder: true
        });

        const workflowsCount = await copyCategory({
          label: 'workflow',
          sourceDir: paths.WORKFLOW_TEMPLATES_DIR,
          targetSubdir: 'workflows'
        });

        // Summary
        console.log(chalk.bold.green(`\nInstallation complete\n`));
        console.log(chalk.white(`  Tools targeted : ${selectedTools.join(', ')}`));
        console.log(chalk.white(`  Templates      : ${templatesCount} file(s) copied`));
        console.log(chalk.white(`  Skills         : ${skillsCount} folder(s) copied`));
        console.log(chalk.white(`  Workflows      : ${workflowsCount} file(s) copied\n`));

        console.log(chalk.bold.cyan(`Output locations:`));
        for (const aiDir of selectedTools) {
          console.log(chalk.yellow(`  - ${aiDir}/_templates/`));
          console.log(chalk.yellow(`  - ${aiDir}/skills/`));
          console.log(chalk.yellow(`  - ${aiDir}/workflows/`));
        }

        console.log(chalk.gray(`\nDocumentation will be generated to docs/ folder:`));
        console.log(chalk.gray(`  - docs/features/    (PRD, Technical Design, Feature Design)`));
        console.log(chalk.gray(`  - docs/production/  (Breakdown files, Skill files)`));
        console.log(chalk.gray(`  - docs/test-reports/ (Spec Test, QA Report)\n`));

      } catch (error) {
        console.error(chalk.red('Error installing skills:'), error.message);
        process.exit(1);
      }
    });
}

module.exports = { registerInstallCommand };
