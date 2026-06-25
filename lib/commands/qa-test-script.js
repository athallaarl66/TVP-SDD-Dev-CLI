const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { getPaths, ensureDirectories } = require('../utils/file');
const { generatePlaywrightScript } = require('../utils/template');
const { ensureAIDirectories } = require('../ai-tools');

function registerQATestScriptCommand(program) {
  program
    .command('/qa-test-script <featureName>')
    .description('Generate Playwright test script from SPEC_TEST document')
    .action(async (featureName) => {
      try {
        const paths = getPaths();
        await ensureDirectories(paths);
        
        // Try to find SPEC_TEST.md in docs/test-reports/
        let specTestPath = null;
        
        // Check docs/test-reports/{featureName}/{featureName}-spec-test.md
        const docsSpecTestPath = path.join(paths.DOCS_TEST_REPORTS_DIR, featureName, `${featureName}-spec-test.md`);
        if (await fs.pathExists(docsSpecTestPath)) {
          specTestPath = docsSpecTestPath;
        }
        
        if (!specTestPath) {
          console.error(chalk.red(`Error: ${featureName}-spec-test.md not found in docs/test-reports/`));
          console.error(chalk.yellow(`Run 'sdd-gen /spec-test ${featureName}' first to generate the spec test document`));
          process.exit(1);
        }
        
        const testScriptPath = path.join(paths.TESTS_DIR, `${featureName}.spec.js`);
        
        // Read SPEC_TEST content
        const specTestContent = await fs.readFile(specTestPath, 'utf-8');
        
        // Generate Playwright test script
        const playwrightScript = generatePlaywrightScript(featureName, specTestContent);
        
        // Write test script
        await fs.writeFile(testScriptPath, playwrightScript, 'utf-8');
        
        console.log(chalk.green(`✅ Playwright test script created: ${testScriptPath}`));
      } catch (error) {
        console.error(chalk.red('Error generating test script:'), error.message);
        process.exit(1);
      }
    });
}

module.exports = { registerQATestScriptCommand };
