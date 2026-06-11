const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { getPaths } = require('../utils/file');
const { ensurePlaywrightInstalled } = require('../utils/file');

function registerQATestRunCommand(program) {
  program
    .command('/qa-test-run <featureName>')
    .description('Execute Playwright test and add script to package.json')
    .action(async (featureName) => {
      try {
        const paths = getPaths();
        const testScriptPath = path.join(paths.TESTS_DIR, `${featureName}.spec.js`);
        const packageJsonPath = path.join(paths.PROJECT_DIR, 'package.json');
        
        // Check if test script exists
        if (!(await fs.pathExists(testScriptPath))) {
          console.error(chalk.red(`Error: ${featureName}.spec.js not found in tests directory`));
          console.error(chalk.yellow(`Run 'sdd-gen /qa-test-script ${featureName}' first to generate the test script`));
          process.exit(1);
        }
        
        // Check if package.json exists
        if (!(await fs.pathExists(packageJsonPath))) {
          console.error(chalk.red('Error: package.json not found in project directory'));
          process.exit(1);
        }
        
        // Ensure Playwright is installed
        await ensurePlaywrightInstalled(paths.PROJECT_DIR);
        
        // Read package.json
        const packageJson = await fs.readJson(packageJsonPath);
        
        // Add test script to package.json
        const scriptName = `qa-run:${featureName}`;
        packageJson.scripts = packageJson.scripts || {};
        packageJson.scripts[scriptName] = `npx playwright test tests/${featureName}.spec.js`;
        
        // Write updated package.json
        await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
        
        console.log(chalk.green(`✅ Test script added to package.json: "${scriptName}"`));
        console.log(chalk.yellow(`\nTo run the test, execute: npm run ${scriptName}`));
        console.log(chalk.yellow(`Or run directly: npx playwright test tests/${featureName}.spec.js`));
        
      } catch (error) {
        console.error(chalk.red('Error setting up test run:'), error.message);
        process.exit(1);
      }
    });
}

module.exports = { registerQATestRunCommand };
