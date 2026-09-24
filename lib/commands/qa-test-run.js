const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');
const { getPaths } = require('../utils/file');
const { promptOrFail } = require('../utils/prompt');

// Framework detection from generated test file naming conventions
const FRAMEWORK_RUNNERS = [
  {
    name: 'playwright',
    files: (feature) => [`${feature}.spec.ts`],
    dir: '',
    run: (feature, filePath) => `npx playwright test tests/${filePath}`,
    setup: true
  },
  {
    name: 'jest',
    files: (feature) => [`${feature}.test.ts`, `${feature}.test.tsx`, `${feature}.test.js`, `${feature}.test.jsx`],
    dir: '',
    run: (feature, filePath) => `npx jest tests/${filePath}`,
    setup: true
  },
  {
    name: 'phpunit',
    files: (feature) => [`Feature/${pascalCase(feature)}Test.php`],
    dir: '',
    run: (feature, filePath) => `php artisan test --filter=${feature}`,
    setup: false
  },
  {
    name: 'xunit',
    files: (feature) => [`${pascalCase(feature)}Tests.cs`],
    dir: '',
    run: (feature, filePath) => `dotnet test --filter ${feature}`,
    setup: false
  },
  {
    name: 'nunit',
    files: (feature) => [`${pascalCase(feature)}Tests.cs`],
    dir: '',
    run: (feature, filePath) => `dotnet test --filter ${feature}`,
    setup: false
  },
  {
    name: 'junit',
    files: (feature) => [`src/test/java/${pascalCase(feature)}Test.java`],
    dir: '',
    run: (feature, filePath) => `mvn test -Dtest=${pascalCase(feature)}Test`,
    setup: false
  },
  {
    name: 'pytest',
    files: (feature) => [`test_${feature.replace(/-/g, '_')}.py`],
    dir: '',
    run: (feature, filePath) => `python -m pytest tests/${filePath}`,
    setup: false
  },
  {
    name: 'gotest',
    files: (feature) => [`${feature.replace(/-/g, '_')}_test.go`],
    dir: '',
    run: (feature, filePath) => `go test -v ./tests/...`,
    setup: false
  }
];

function pascalCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

async function findTestFile(paths, featureName) {
  for (const runner of FRAMEWORK_RUNNERS) {
    for (const file of runner.files(featureName)) {
      const candidate = path.join(paths.TESTS_DIR, file);
      if (await fs.pathExists(candidate)) {
        return { runner, file };
      }
    }
  }
  return null;
}

function runCommand(command, projectDir, frameworkName) {
  console.log(chalk.cyan(`\n🚀 Running test command: ${command}`));
  try {
    execSync(command, { cwd: projectDir, stdio: 'inherit', shell: true });
  } catch (error) {
    console.log(chalk.gray(`\nℹ️  Note: test command exited with code ${error.status || 'unknown'}`));
    process.exitCode = error.status || 1;
  }
}

function registerQATestRunCommand(program) {
  program
    .command('/qa-test-run [featureName]')
    .description('Run generated tests for the feature across all supported frameworks')
    .action(async (featureName) => {
      try {
        featureName = await promptOrFail(featureName, 'Enter feature name:', 'sdd-gen /qa-test-run <featureName>');
        const paths = getPaths();

        const found = await findTestFile(paths, featureName);

        if (!found) {
          console.error(chalk.red(`Error: No test file found for "${featureName}" in tests/ directory`));
          console.error(chalk.yellow(`Run 'sdd-gen /qa-test-script ${featureName}' first to generate the test script`));
          process.exit(1);
        }

        const { runner, file } = found;
        const packageJsonPath = path.join(paths.PROJECT_DIR, 'package.json');

        console.log(chalk.green(`✅ Found test file: ${file} (${runner.name})`));

        if (runner.setup) {
          const { ensurePlaywrightInstalled } = require('../utils/file');

          if (!(await fs.pathExists(packageJsonPath))) {
            console.error(chalk.red('Error: package.json not found in project directory'));
            process.exit(1);
          }

          if (runner.name === 'playwright') {
            await ensurePlaywrightInstalled(paths.PROJECT_DIR);
          }

          const packageJson = await fs.readJson(packageJsonPath);
          const scriptName = `qa-run:${featureName}`;
          packageJson.scripts = packageJson.scripts || {};
          packageJson.scripts[scriptName] = runner.run(featureName, file);
          await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

          console.log(chalk.green(`✅ Test script added to package.json: "${scriptName}"`));
          console.log(chalk.yellow(`\nTo run the test, execute: npm run ${scriptName}`));
        }

        runCommand(runner.run(featureName, file), paths.PROJECT_DIR, runner.name);

      } catch (error) {
        console.error(chalk.red('Error setting up test run:'), error.message);
        process.exit(1);
      }
    });
}

module.exports = { registerQATestRunCommand };