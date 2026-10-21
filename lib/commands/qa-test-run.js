const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { spawnSync } = require('child_process');
const { getPaths } = require('../utils/file');
const { resolveFeatureName } = require('../utils/prompt');
const { writeConfig } = require('../utils/config');

const IS_WIN = process.platform === 'win32';

// Test runners. Each runner describes the executable and its arguments
// separately: nothing is ever concatenated into a shell command string, so a
// feature name or path cannot inject extra commands.
const FRAMEWORK_RUNNERS = [
  {
    name: 'playwright',
    files: (feature) => [`${feature}.spec.ts`],
    run: (feature, file) => ({ command: 'npx', args: ['playwright', 'test', `tests/${file}`] }),
    setup: true
  },
  {
    name: 'jest',
    files: (feature) => [`${feature}.test.ts`, `${feature}.test.tsx`, `${feature}.test.js`, `${feature}.test.jsx`],
    run: (feature, file) => ({ command: 'npx', args: ['jest', `tests/${file}`] }),
    setup: true
  },
  {
    name: 'phpunit',
    files: (feature) => [`Feature/${pascalCase(feature)}Test.php`],
    run: (feature) => ({ command: 'php', args: ['artisan', 'test', `--filter=${feature}`] }),
    setup: false
  },
  {
    name: 'xunit',
    files: (feature) => [`${pascalCase(feature)}Tests.cs`],
    run: (feature) => ({ command: 'dotnet', args: ['test', '--filter', feature] }),
    setup: false
  },
  {
    name: 'nunit',
    files: (feature) => [`${pascalCase(feature)}Tests.cs`],
    run: (feature) => ({ command: 'dotnet', args: ['test', '--filter', feature] }),
    setup: false
  },
  {
    name: 'junit',
    files: (feature) => [`src/test/java/${pascalCase(feature)}Test.java`],
    run: (feature) => ({ command: 'mvn', args: ['test', `-Dtest=${pascalCase(feature)}Test`] }),
    setup: false
  },
  {
    name: 'pytest',
    files: (feature) => [`test_${feature.replace(/-/g, '_')}.py`],
    run: (feature, file) => ({ command: 'python', args: ['-m', 'pytest', `tests/${file}`] }),
    setup: false
  },
  {
    name: 'gotest',
    files: (feature) => [`${feature.replace(/-/g, '_')}_test.go`],
    run: () => ({ command: 'go', args: ['test', '-v', './tests/...'] }),
    setup: false
  }
];

function pascalCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

// Render a command for display / npm scripts. Arguments are validated slugs or
// fixed flags, so quoting is cosmetic only.
function formatCommand(cmd) {
  const args = cmd.args.map((arg) => (/\s/.test(arg) ? `"${arg}"` : arg));
  return [cmd.command, ...args].join(' ');
}

function hasExtension(command) {
  return path.extname(command) !== '';
}

// npx/npm are .cmd shims on Windows and cannot be spawned without a shell.
// Resolve npm's JS entry point instead, so the child process is plain node.
function resolveNpmCli(command) {
  if (command !== 'npx' && command !== 'npm') return null;
  const candidate = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', `${command}-cli.js`);
  return fs.existsSync(candidate) ? candidate : null;
}

function quoteForCmd(arg) {
  const escaped = String(arg).replace(/"/g, '\\"').replace(/%/g, '%%');
  return `"${escaped}"`;
}

// Spawn without a shell. Returns the spawnSync result.
function spawnCommand(command, args, options) {
  const base = { ...options, shell: false };

  if (!IS_WIN || hasExtension(command)) {
    return spawnSync(command, args, base);
  }

  const npmCli = resolveNpmCli(command);
  if (npmCli) {
    return spawnSync(process.execPath, [npmCli, ...args], base);
  }

  if (command !== 'mvn') return spawnSync(command, args, base);

  // ponytail: last resort for remaining .cmd shims (mvn). cmd.exe is the only
  // way to execute them; every argument is quoted, so a value cannot escape.
  const line = [command, ...args.map(quoteForCmd)].join(' ');
  return spawnSync(process.env.COMSPEC || 'cmd.exe', ['/d', '/s', '/c', line], base);
}

// Run a test command without shell interpolation. Returns the exit status and
// mirrors it into process.exitCode so the CLI exit code reflects the runner.
function runCommand(cmd, projectDir, frameworkName) {
  if (!cmd || typeof cmd.command !== 'string' || !Array.isArray(cmd.args)) {
    throw new TypeError('runCommand expects { command, args } — shell command strings are not supported');
  }
  console.log(chalk.cyan(`\n🚀 Running test command: ${formatCommand(cmd)}`));

  const result = spawnCommand(cmd.command, cmd.args, { cwd: projectDir, stdio: 'inherit' });

  if (result.error) {
    console.error(chalk.red(`Error: could not run ${cmd.command}: ${result.error.message}`));
    console.error(chalk.yellow(`Check that ${cmd.command} is installed and available on PATH.`));
    process.exitCode = 1;
    return 1;
  }

  const status = typeof result.status === 'number' ? result.status : 1;
  if (status !== 0) {
    console.log(chalk.gray(`\nℹ️  Note: ${frameworkName || 'test'} command exited with code ${status}`));
    process.exitCode = status;
  }
  return status;
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

function registerQATestRunCommand(program, getOpts) {
  program
    .command('/qa-test-run [featureName]')
    .description('Run the generated test file for the feature (framework auto-detected)')
    .action(async (featureName) => {
      try {
        const opts = getOpts();
        const paths = getPaths();
        featureName = await resolveFeatureName(featureName, {
          yes: opts.yes,
          paths,
          message: 'Enter feature name:',
          usage: 'sdd-gen /qa-test-run <featureName>'
        });
        writeConfig({ lastFeature: featureName }, paths.PROJECT_DIR);

        const found = await findTestFile(paths, featureName);

        if (!found) {
          console.error(chalk.red(`Error: No test file found for "${featureName}" in tests/ directory`));
          console.error(chalk.yellow(`Run 'sdd-gen /qa-test-script ${featureName}' first to generate the test script`));
          process.exit(1);
        }

        const { runner, file } = found;
        const packageJsonPath = path.join(paths.PROJECT_DIR, 'package.json');
        const cmd = runner.run(featureName, file);

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
          packageJson.scripts[scriptName] = formatCommand(cmd);
          await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

          console.log(chalk.green(`✅ Test script added to package.json: "${scriptName}"`));
          console.log(chalk.yellow(`\nTo run the test, execute: npm run ${scriptName}`));
        }

        runCommand(cmd, paths.PROJECT_DIR, runner.name);

      } catch (error) {
        console.error(chalk.red('Error setting up test run:'), error.message);
        process.exit(1);
      }
    });
}

module.exports = { registerQATestRunCommand, FRAMEWORK_RUNNERS, findTestFile, runCommand, formatCommand };
