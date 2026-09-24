const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs-extra');
const { readConfig } = require('./config');

function isTTY() {
  return Boolean(process.stdout.isTTY);
}

async function promptInput(message, defaultValue, validate, yes = false) {
  if (yes) return defaultValue !== undefined ? String(defaultValue).trim() : '';
  const { answer } = await inquirer.default.prompt([
    {
      type: 'input',
      name: 'answer',
      message,
      default: defaultValue,
      validate: validate ? validate : undefined
    }
  ]);
  return answer.trim();
}

// Return value if present. Otherwise: in --yes mode return defaultValue;
// in a TTY prompt for it; in non-TTY print usage and exit.
async function promptOrFail(value, message, usage, yes = false, defaultValue) {
  if (value) return value;
  if (yes) {
    if (defaultValue !== undefined) return defaultValue;
    console.error(chalk.red('Error: missing required value.'));
    console.error(chalk.yellow(`Usage: ${usage}`));
    process.exit(1);
  }
  if (isTTY()) {
    return promptInput(message, defaultValue);
  }
  console.error(chalk.red('Error: missing required value.'));
  console.error(chalk.yellow(`Usage: ${usage}`));
  process.exit(1);
}

// TTY next-step guidance. In --yes mode prints plain usage lines instead.
async function offerNextSteps(steps, yes = false) {
  if (!steps || steps.length === 0) return;
  if (yes) {
    console.log('\n' + chalk.bold.cyan('Next steps:'));
    for (const s of steps) {
      if (s.cmd) console.log(chalk.yellow(`- ${s.label}: ${s.cmd}`));
      else if (s.usage) console.log(chalk.yellow(`- ${s.label}: ${s.usage}`));
    }
    return;
  }
  if (!isTTY()) return;
  const choices = steps.map((s) => ({ name: s.label, value: s.value }));
  const { next } = await inquirer.default.prompt([
    { type: 'list', name: 'next', message: '📌 What next?', choices }
  ]);
  const step = steps.find((s) => s.value === next);
  if (!step) return;
  if (step.cmd) {
    const { execSync } = require('child_process');
    try {
      execSync(step.cmd, { stdio: 'inherit', shell: true });
    } catch (error) {
      process.exitCode = error.status || 1;
    }
  } else if (step.usage) {
    console.log('');
    console.log(chalk.yellow(`${step.usage}`));
  }
}

// Derive a feature name from docs/features/*-prd.md when one exists.
async function deriveFeatureFromDocs(paths) {
  try {
    const files = await fs.readdir(paths.DOCS_FEATURES_DIR);
    const prd = files.find((f) => f.endsWith('-prd.md'));
    if (prd) return prd.replace(/-prd\.md$/i, '');
  } catch (e) {
    // docs/features may not exist yet
  }
  return null;
}

// Resolve a feature name: explicit arg > config.lastFeature > derived from
// PRD file name. In non-TTY without --yes, error out instead of hanging.
async function resolveFeatureName(value, { yes, paths, message, usage }) {
  if (value) return value;
  const config = readConfig(paths.PROJECT_DIR);
  if (yes) {
    const fromConfig = config.lastFeature;
    if (fromConfig) return fromConfig;
    const derived = await deriveFeatureFromDocs(paths);
    if (derived) return derived;
    console.error(chalk.red('Error: missing required value.'));
    console.error(chalk.yellow(`Usage: ${usage}`));
    process.exit(1);
  }
  if (isTTY()) {
    const def = config.lastFeature || (await deriveFeatureFromDocs(paths)) || '';
    return promptInput(message, def);
  }
  console.error(chalk.red('Error: missing required value.'));
  console.error(chalk.yellow(`Usage: ${usage}`));
  process.exit(1);
}

function doneStep() {
  return { label: '🏁 Done', value: 'done' };
}

module.exports = {
  isTTY,
  promptInput,
  promptOrFail,
  offerNextSteps,
  resolveFeatureName,
  deriveFeatureFromDocs,
  doneStep
};