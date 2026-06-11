const inquirer = require('inquirer');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');

// AI tool directories
const AI_DIRS = ['.devin', '.opencode', '.claude', '.antigravity'];
const AI_SUBDIRS = ['skills', 'workflows', '_templates'];
const LEGACY_WINDSURF_DIR = '.windsurf';

// Get project directory (should be passed in or use process.cwd)
const PROJECT_DIR = process.cwd();

// Get existing AI tool directories
async function getExistingAIDirectories() {
  const existingDirs = [];
  for (const aiDir of AI_DIRS) {
    const aiDirPath = path.join(PROJECT_DIR, aiDir);
    if (await fs.pathExists(aiDirPath)) {
      existingDirs.push(aiDir);
    }
  }
  return existingDirs;
}

// Check for legacy .windsurf directory and prompt for migration
async function checkAndMigrateWindsurf() {
  const windsurfPath = path.join(PROJECT_DIR, LEGACY_WINDSURF_DIR);
  
  if (await fs.pathExists(windsurfPath)) {
    const devinPath = path.join(PROJECT_DIR, '.devin');
    
    // Check if .devin already exists
    if (await fs.pathExists(devinPath)) {
      console.log(chalk.yellow(`⚠️  Both .windsurf and .devin directories exist.`));
      console.log(chalk.yellow(`   We recommend using .devin. You may want to remove .windsurf manually.`));
      return;
    }
    
    // Prompt user for migration
    const { shouldMigrate } = await inquirer.default.prompt([
      {
        type: 'confirm',
        name: 'shouldMigrate',
        message: 'We detected a .windsurf directory. Windsurf is now called Devin. Would you like us to rename it to .devin automatically?',
        default: true
      }
    ]);
    
    if (shouldMigrate) {
      const spinner = ora('Migrating .windsurf to .devin...').start();
      try {
        await fs.rename(windsurfPath, devinPath);
        spinner.succeed('Successfully migrated .windsurf to .devin');
        console.log(chalk.green('✅ Migration complete! Your AI tool folder is now .devin'));
      } catch (error) {
        spinner.fail('Migration failed');
        console.error(chalk.red('Error during migration:'), error.message);
        console.log(chalk.yellow('You can manually rename .windsurf to .devin if needed.'));
      }
    } else {
      console.log(chalk.yellow('⚠️  Skipping migration. .windsurf will not be recognized by default.'));
      console.log(chalk.yellow('   You can manually rename it to .devin later.'));
    }
  }
}

// Prompt user to create AI tool folders if none exist
async function promptForAIFolders() {
  // Check for legacy .windsurf first
  await checkAndMigrateWindsurf();
  
  const { selectedFolders } = await inquirer.default.prompt([
    {
      type: 'checkbox',
      name: 'selectedFolders',
      message: 'No AI tool folders found. Which folders do you want to create?',
      choices: AI_DIRS,
      validate: (answer) => {
        if (answer.length < 1) {
          return 'You must choose at least one folder.';
        }
        return true;
      }
    }
  ]);

  // Create selected folders and subdirectories
  for (const folder of selectedFolders) {
    const folderPath = path.join(PROJECT_DIR, folder);
    await fs.ensureDir(folderPath);
    
    for (const subdir of AI_SUBDIRS) {
      await fs.ensureDir(path.join(folderPath, subdir));
    }
    
    console.log(chalk.green(`✅ Created folder: ${folder}/`));
  }

  return selectedFolders;
}

// Ensure AI tool directories exist or prompt to create them
async function ensureAIDirectories() {
  let existingDirs = await getExistingAIDirectories();
  if (existingDirs.length === 0) {
    existingDirs = await promptForAIFolders();
  }
  return existingDirs;
}

module.exports = {
  AI_DIRS,
  AI_SUBDIRS,
  LEGACY_WINDSURF_DIR,
  PROJECT_DIR,
  getExistingAIDirectories,
  checkAndMigrateWindsurf,
  promptForAIFolders,
  ensureAIDirectories
};
