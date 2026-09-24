const inquirer = require('inquirer');
const chalk = require('chalk');

function isTTY() {
  return Boolean(process.stdout.isTTY);
}

async function promptInput(message, defaultValue, validate) {
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

async function promptList(message, choices) {
  const { answer } = await inquirer.default.prompt([
    { type: 'list', name: 'answer', message, choices }
  ]);
  return answer;
}

// Return value if present (non-interactive path). Otherwise prompt via input
// when running in a TTY; in a non-TTY (AI agent, CI) print usage and exit.
async function promptOrFail(value, message, usage) {
  if (value) return value;
  if (isTTY()) {
    return promptInput(message);
  }
  console.error(chalk.red('Error: missing required value.'));
  console.error(chalk.yellow(`Usage: ${usage}`));
  process.exit(1);
}

// TTY-only next-step guidance. No-op in non-TTY. Each step either runs a
// command (cmd) or prints usage (usage). Selecting a step with neither exits.
async function offerNextSteps(steps) {
  if (!isTTY() || !steps || steps.length === 0) return;
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

function doneStep() {
  return { label: '🏁 Done', value: 'done' };
}

module.exports = { isTTY, promptInput, promptList, promptOrFail, offerNextSteps, doneStep };